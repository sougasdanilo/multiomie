import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { initializeWorkers } from './jobs/queues';
import { requestLogger, errorLogger } from './middlewares/logger';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet());
app.use(cors());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // limite de 1000 requisições por IP (mais permissivo para API)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas requisições, tente novamente mais tarde'
  }
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});

// Error logging
app.use(errorLogger);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message
  });
});

// Start server
async function startServer() {
  try {
    // Conecta ao banco de dados
    await connectDatabase();
    
    // Conecta ao Redis (opcional - não bloqueia se falhar)
    let redisConnected = false;
    try {
      await connectRedis();
      redisConnected = true;
    } catch (error: any) {
      console.warn('⚠️  Redis não disponível:', error.message);
      console.warn('   Funcionalidades de fila estarão desabilitadas');
    }
    
    // Inicializa workers BullMQ apenas se Redis conectado e habilitado
    if (redisConnected && process.env.ENABLE_WORKERS !== 'false') {
      try {
        initializeWorkers();
      } catch (error: any) {
        console.warn('⚠️  Falha ao inicializar workers:', error.message);
      }
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📚 API disponível em: http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      if (!redisConnected) {
        console.log('⚠️  Modo sem Redis - funcionalidades de fila desabilitadas');
      }
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido, encerrando gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recebido, encerrando gracefully...');
  process.exit(0);
});

startServer().catch(console.error);

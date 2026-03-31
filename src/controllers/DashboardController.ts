import { Request, Response } from 'express';
import { sql } from '../config/database.js';
import { OmieIntegrationService } from '../integrations/OmieServices.js';
import { omieCircuitBreaker } from '../integrations/CircuitBreaker.js';
import { logger } from '../middlewares/logger.js';

export class DashboardController {
  private omieIntegration: OmieIntegrationService;

  constructor() {
    this.omieIntegration = new OmieIntegrationService();
  }

  /**
   * Obtém resumo do sistema para dashboard
   */
  async getResumo(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalEmpresas,
        totalClientes,
        totalProdutos,
        totalPedidos,
        totalNotasFiscais,
        pedidosPorStatus,
        empresasAtivas
      ] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM empresas`,
        sql`SELECT COUNT(*) as count FROM clientes`,
        sql`SELECT COUNT(*) as count FROM produtos`,
        sql`SELECT COUNT(*) as count FROM pedidos`,
        sql`SELECT COUNT(*) as count FROM notas_fiscais`,
        sql`SELECT status, COUNT(*) as count FROM pedidos GROUP BY status`,
        sql`SELECT COUNT(*) as count FROM empresas WHERE ativa = true`
      ]);

      // Contagens de sincronização
      const clientesSincronizados = await sql`
        SELECT COUNT(*) as count FROM cliente_empresa WHERE sync_status = 'SYNCED'
      `;
      
      const clientesPendentes = await sql`
        SELECT COUNT(*) as count FROM cliente_empresa WHERE sync_status = 'PENDING'
      `;
      
      const clientesErro = await sql`
        SELECT COUNT(*) as count FROM cliente_empresa WHERE sync_status = 'ERROR'
      `;

      res.json({
        success: true,
        data: {
          resumo: {
            totalEmpresas: totalEmpresas[0].count,
            empresasAtivas: empresasAtivas[0].count,
            totalClientes: totalClientes[0].count,
            totalProdutos: totalProdutos[0].count,
            totalPedidos: totalPedidos[0].count,
            totalNotasFiscais: totalNotasFiscais[0].count
          },
          pedidosPorStatus: pedidosPorStatus.map((p: any) => ({
            status: p.status,
            quantidade: parseInt(p.count)
          })),
          sincronizacao: {
            clientesSincronizados: clientesSincronizados[0].count,
            clientesPendentes: clientesPendentes[0].count,
            clientesErro: clientesErro[0].count
          }
        }
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao gerar resumo do dashboard');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtém status de integração com Omie por empresa
   */
  async getStatusIntegracao(req: Request, res: Response): Promise<void> {
    try {
      const empresas = await sql`
        SELECT 
          e.*,
          (SELECT COUNT(*) FROM cliente_empresa WHERE empresa_id = e.id) as clientes_count,
          (SELECT COUNT(*) FROM produto_empresa WHERE empresa_id = e.id) as produtos_count,
          (SELECT COUNT(*) FROM pedido_empresa WHERE empresa_id = e.id) as pedidos_count,
          (SELECT COUNT(*) FROM notas_fiscais WHERE empresa_id = e.id) as notas_count
        FROM empresas e 
        WHERE e.ativa = true
      `;

      const statusEmpresas = [];

      for (const empresa of empresas) {
        try {
          const entity = {
            id: empresa.id,
            nome: empresa.nome,
            cnpj: empresa.cnpj,
            nomeFantasia: empresa.nome_fantasia || undefined,
            appKey: empresa.app_key,
            appSecret: empresa.app_secret,
            ativa: empresa.ativa,
            configuracoes: empresa.configuracoes as Record<string, unknown> | undefined,
            createdAt: empresa.created_at,
            updatedAt: empresa.updated_at
          };

          const clienteService = this.omieIntegration.getClienteService(entity);
          
          // Testa conexão fazendo uma chamada simples
          await clienteService.listar(1, 1);
          
          statusEmpresas.push({
            id: empresa.id,
            nome: empresa.nome,
            cnpj: empresa.cnpj,
            status: 'connected',
            estatisticas: {
              clientes: parseInt(empresa.clientes_count),
              produtos: parseInt(empresa.produtos_count),
              pedidos: parseInt(empresa.pedidos_count),
              notasFiscais: parseInt(empresa.notas_count)
            }
          });
        } catch (error: any) {
          statusEmpresas.push({
            id: empresa.id,
            nome: empresa.nome,
            cnpj: empresa.cnpj,
            status: 'error',
            error: error.message,
            estatisticas: {
              clientes: empresa._count.clienteEmpresas,
              produtos: empresa._count.produtoEmpresas,
              pedidos: empresa._count.pedidoEmpresas,
              notasFiscais: empresa._count.notasFiscais
            }
          });
        }
      }

      res.json({
        success: true,
        data: {
          empresas: statusEmpresas,
          totalConectadas: statusEmpresas.filter(e => e.status === 'connected').length,
          totalErros: statusEmpresas.filter(e => e.status === 'error').length
        }
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao obter status de integração');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtém status dos Circuit Breakers
   */
  async getCircuitBreakerStatus(req: Request, res: Response): Promise<void> {
    try {
      const stats = omieCircuitBreaker.getAllStats();
      
      res.json({
        success: true,
        data: {
          circuitBreakers: stats,
          total: stats.length,
          abertos: stats.filter(s => s?.state === 'OPEN').length,
          fechados: stats.filter(s => s?.state === 'CLOSED').length,
          meioAbertos: stats.filter(s => s?.state === 'HALF_OPEN').length
        }
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao obter status dos circuit breakers');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtém pedidos recentes
   */
  async getPedidosRecentes(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const pedidos = await sql`
        SELECT * FROM pedidos 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;

      res.json({
        success: true,
        data: pedidos
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao obter pedidos recentes');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtém notas fiscais recentes
   */
  async getNotasFiscaisRecentes(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const notas = await sql`
        SELECT * FROM notas_fiscais 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;

      res.json({
        success: true,
        data: notas
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao obter notas fiscais recentes');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtém status do sistema (health check detalhado)
   */
  async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      // Testa conexão com banco
      let databaseStatus = 'ok';
      try {
        await sql`SELECT 1`;
      } catch (error) {
        databaseStatus = 'error';
      }

      // Testa conexão com Redis (removido - não usa mais Redis)
      const redisStatus = 'disabled';

      const status = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: databaseStatus,
          redis: redisStatus
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        }
      };

      const httpStatus = databaseStatus === 'ok' ? 200 : 503;
      
      res.status(httpStatus).json({
        success: databaseStatus === 'ok',
        data: status
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao obter status do sistema');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { OmieIntegrationService } from '../integrations/OmieServices';
import { omieCircuitBreaker } from '../integrations/CircuitBreaker';
import { logger } from '../middlewares/logger';

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
        prisma.empresa.count(),
        prisma.cliente.count(),
        prisma.produto.count(),
        prisma.pedido.count(),
        prisma.notaFiscal.count(),
        prisma.pedido.groupBy({
          by: ['status'],
          _count: { id: true }
        }),
        prisma.empresa.count({ where: { ativa: true } })
      ]);

      // Contagens de sincronização
      const clientesSincronizados = await prisma.clienteEmpresa.count({
        where: { sync_status: 'SYNCED' }
      });
      
      const clientesPendentes = await prisma.clienteEmpresa.count({
        where: { sync_status: 'PENDING' }
      });
      
      const clientesErro = await prisma.clienteEmpresa.count({
        where: { sync_status: 'ERROR' }
      });

      res.json({
        success: true,
        data: {
          resumo: {
            totalEmpresas,
            empresasAtivas,
            totalClientes,
            totalProdutos,
            totalPedidos,
            totalNotasFiscais
          },
          pedidosPorStatus: pedidosPorStatus.map(p => ({
            status: p.status,
            quantidade: p._count.id
          })),
          sincronizacao: {
            clientesSincronizados,
            clientesPendentes,
            clientesErro
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
      const empresas = await prisma.empresa.findMany({
        where: { ativa: true },
        include: {
          _count: {
            select: {
              clienteEmpresas: true,
              produtoEmpresas: true,
              pedidoEmpresas: true,
              notasFiscais: true
            }
          }
        }
      });

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
              clientes: empresa._count.clienteEmpresas,
              produtos: empresa._count.produtoEmpresas,
              pedidos: empresa._count.pedidoEmpresas,
              notasFiscais: empresa._count.notasFiscais
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
      
      const pedidos = await prisma.pedido.findMany({
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          cliente: true,
          itens: {
            include: {
              produto: true,
              produtoEmpresa: { include: { empresa: true } }
            }
          },
          pedidoEmpresas: { include: { empresa: true } }
        }
      });

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
      
      const notas = await prisma.notaFiscal.findMany({
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          empresa: true,
          pedido: {
            include: {
              cliente: true
            }
          }
        }
      });

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
        await prisma.$queryRaw`SELECT 1`;
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

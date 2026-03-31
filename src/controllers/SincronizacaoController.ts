import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { OmieIntegrationService } from '../integrations/OmieServices.js';
import { agendarSincronizacaoProdutos, agendarProcessamentoPedido, agendarFaturamentoPedido } from '../jobs/queues.js';
import { logger } from '../middlewares/logger.js';

export class SincronizacaoController {
  private omieIntegration: OmieIntegrationService;

  constructor() {
    this.omieIntegration = new OmieIntegrationService();
  }

  /**
   * Sincroniza todos os produtos de uma empresa
   */
  async sincronizarProdutos(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      
      if (!empresaId) {
        res.status(400).json({ success: false, error: 'ID da empresa é obrigatório' });
        return;
      }

      const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
      
      if (!empresa) {
        res.status(404).json({ success: false, error: 'Empresa não encontrada' });
        return;
      }

      // Agenda job de sincronização
      const job = await agendarSincronizacaoProdutos(empresaId);
      
      res.json({
        success: true,
        data: {
          jobId: job.id,
          empresaId,
          status: 'scheduled'
        },
        message: 'Sincronização de produtos agendada com sucesso'
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao agendar sincronização de produtos');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Processa pedido em background
   */
  async processarPedidoAsync(req: Request, res: Response): Promise<void> {
    try {
      const { pedidoId } = req.params;
      const { delay = 0 } = req.body;
      
      if (!pedidoId) {
        res.status(400).json({ success: false, error: 'ID do pedido é obrigatório' });
        return;
      }

      const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
      
      if (!pedido) {
        res.status(404).json({ success: false, error: 'Pedido não encontrado' });
        return;
      }

      const job = await agendarProcessamentoPedido(pedidoId, delay);
      
      res.json({
        success: true,
        data: {
          jobId: job.id,
          pedidoId,
          delay,
          status: 'scheduled'
        },
        message: 'Processamento de pedido agendado com sucesso'
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao agendar processamento de pedido');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Fatura pedido em background
   */
  async faturarPedidoAsync(req: Request, res: Response): Promise<void> {
    try {
      const { pedidoId } = req.params;
      const { delay = 0 } = req.body;
      
      if (!pedidoId) {
        res.status(400).json({ success: false, error: 'ID do pedido é obrigatório' });
        return;
      }

      const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
      
      if (!pedido) {
        res.status(404).json({ success: false, error: 'Pedido não encontrado' });
        return;
      }

      const job = await agendarFaturamentoPedido(pedidoId, delay);
      
      res.json({
        success: true,
        data: {
          jobId: job.id,
          pedidoId,
          delay,
          status: 'scheduled'
        },
        message: 'Faturamento de pedido agendado com sucesso'
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao agendar faturamento de pedido');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Sincroniza clientes de todas as empresas
   */
  async sincronizarClientesTodasEmpresas(req: Request, res: Response): Promise<void> {
    try {
      const empresas = await prisma.empresa.findMany({ where: { ativa: true } });
      const resultados = [];

      for (const empresa of empresas) {
        try {
          const omieService = this.omieIntegration.getClienteService({
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
          });

          // Lista clientes do Omie (primeira página apenas para validar)
          await omieService.listar(1, 1);
          
          resultados.push({
            empresaId: empresa.id,
            nome: empresa.nome,
            status: 'success'
          });
        } catch (error: any) {
          resultados.push({
            empresaId: empresa.id,
            nome: empresa.nome,
            status: 'error',
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          totalEmpresas: empresas.length,
          resultados
        }
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao sincronizar clientes');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Atualiza estoque de todos os produtos de uma empresa
   */
  async atualizarEstoqueEmpresa(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      
      if (!empresaId) {
        res.status(400).json({ success: false, error: 'ID da empresa é obrigatório' });
        return;
      }

      const produtosEmpresa = await prisma.produtoEmpresa.findMany({
        where: { empresa_id: empresaId },
        select: { produto_id: true, codigo_omie: true }
      });

      // Agenda atualização de estoque para cada produto
      const jobs = [];
      for (const produto of produtosEmpresa) {
        const job = await agendarSincronizacaoProdutos(empresaId);
        jobs.push(job.id);
      }

      res.json({
        success: true,
        data: {
          empresaId,
          totalProdutos: produtosEmpresa.length,
          jobsAgendados: jobs.length
        },
        message: `Atualização de estoque agendada para ${produtosEmpresa.length} produtos`
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao atualizar estoque');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtém status das filas (desabilitado - sem Redis)
   */
  async obterStatusFilas(req: Request, res: Response): Promise<void> {
    try {
      const status = {
        filas: 0,
        message: 'Filas desabilitadas - modo sem Redis'
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Erro ao obter status das filas');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

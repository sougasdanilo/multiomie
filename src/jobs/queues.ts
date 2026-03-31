import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../middlewares/logger';
import { ClienteService } from '../services/ClienteService';
import { ProdutoService } from '../services/ProdutoService';
import { PedidoService } from '../services/PedidoService';

// Filas principais
export const sincronizacaoQueue = new Queue('sincronizacao', { connection: redis });
export const pedidoQueue = new Queue('pedido', { connection: redis });
export const estoqueQueue = new Queue('estoque', { connection: redis });

// Tipos de jobs
interface SincronizarClienteJob {
  clienteId: string;
  empresaId: string;
}

interface SincronizarProdutosJob {
  empresaId: string;
}

interface ProcessarPedidoJob {
  pedidoId: string;
}

interface ConsultarEstoqueJob {
  produtoId: string;
  empresaId: string;
}

// Workers
export function initializeWorkers(): void {
  // Worker de sincronização de clientes
  new Worker('sincronizacao', async (job: Job) => {
    const { type, data } = job.data;
    
    logger.info({ jobId: job.id, type }, 'Processando job de sincronização');
    
    try {
      switch (type) {
        case 'SINCRONIZAR_CLIENTE':
          await processarSincronizacaoCliente(data as SincronizarClienteJob);
          break;
        case 'SINCRONIZAR_PRODUTOS':
          await processarSincronizacaoProdutos(data as SincronizarProdutosJob);
          break;
        default:
          logger.warn({ type }, 'Tipo de job desconhecido');
      }
      
      logger.info({ jobId: job.id, type }, 'Job processado com sucesso');
    } catch (error: any) {
      logger.error({ jobId: job.id, type, error: error.message }, 'Erro ao processar job');
      throw error;
    }
  }, { 
    connection: redis,
    concurrency: 5 
  });

  // Worker de processamento de pedidos
  new Worker('pedido', async (job: Job) => {
    const { type, data } = job.data;
    
    logger.info({ jobId: job.id, type }, 'Processando job de pedido');
    
    try {
      switch (type) {
        case 'PROCESSAR_PEDIDO':
          await processarPedido(data as ProcessarPedidoJob);
          break;
        case 'FATURAR_PEDIDO':
          await faturarPedido(data as ProcessarPedidoJob);
          break;
        default:
          logger.warn({ type }, 'Tipo de job desconhecido');
      }
      
      logger.info({ jobId: job.id, type }, 'Job processado com sucesso');
    } catch (error: any) {
      logger.error({ jobId: job.id, type, error: error.message }, 'Erro ao processar job');
      throw error;
    }
  }, { 
    connection: redis,
    concurrency: 3 
  });

  // Worker de estoque
  new Worker('estoque', async (job: Job) => {
    const { type, data } = job.data;
    
    logger.info({ jobId: job.id, type }, 'Processando job de estoque');
    
    try {
      switch (type) {
        case 'CONSULTAR_ESTOQUE':
          await processarConsultaEstoque(data as ConsultarEstoqueJob);
          break;
        case 'ATUALIZAR_ESTOQUE_EMPRESA':
          await atualizarEstoqueEmpresa(data.empresaId);
          break;
        default:
          logger.warn({ type }, 'Tipo de job desconhecido');
      }
      
      logger.info({ jobId: job.id, type }, 'Job processado com sucesso');
    } catch (error: any) {
      logger.error({ jobId: job.id, type, error: error.message }, 'Erro ao processar job');
      throw error;
    }
  }, { 
    connection: redis,
    concurrency: 10 
  });

  logger.info('Workers inicializados');
}

// Processadores
async function processarSincronizacaoCliente(data: SincronizarClienteJob): Promise<void> {
  const clienteService = new ClienteService();
  const { clienteId, empresaId } = data;
  
  // Implementação específica de sincronização
  logger.info({ clienteId, empresaId }, 'Sincronizando cliente com empresa');
}

async function processarSincronizacaoProdutos(data: SincronizarProdutosJob): Promise<void> {
  const produtoService = new ProdutoService();
  const { empresaId } = data;
  
  await produtoService.sincronizarProdutosEmpresa(empresaId);
  logger.info({ empresaId }, 'Produtos sincronizados');
}

async function processarPedido(data: ProcessarPedidoJob): Promise<void> {
  const pedidoService = new PedidoService();
  const { pedidoId } = data;
  
  await pedidoService.processarPedido(pedidoId);
  logger.info({ pedidoId }, 'Pedido processado');
}

async function faturarPedido(data: ProcessarPedidoJob): Promise<void> {
  const pedidoService = new PedidoService();
  const { pedidoId } = data;
  
  await pedidoService.faturarPedido(pedidoId);
  logger.info({ pedidoId }, 'Pedido faturado');
}

async function processarConsultaEstoque(data: ConsultarEstoqueJob): Promise<void> {
  const produtoService = new ProdutoService();
  const { produtoId, empresaId } = data;
  
  await produtoService.consultarEstoque(produtoId, empresaId);
  logger.info({ produtoId, empresaId }, 'Estoque consultado');
}

async function atualizarEstoqueEmpresa(empresaId: string): Promise<void> {
  const produtoService = new ProdutoService();
  
  const produtos = await produtoService.listarProdutosEmpresa(empresaId, 0, 1000);
  
  for (const produto of produtos) {
    await estoqueQueue.add('CONSULTAR_ESTOQUE', {
      type: 'CONSULTAR_ESTOQUE',
      data: {
        produtoId: produto.id,
        empresaId
      }
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });
  }
  
  logger.info({ empresaId, totalProdutos: produtos.length }, 'Jobs de estoque enfileirados');
}

// Helpers para adicionar jobs
export async function agendarSincronizacaoCliente(clienteId: string, empresaId: string): Promise<Job> {
  return sincronizacaoQueue.add('SINCRONIZAR_CLIENTE', {
    type: 'SINCRONIZAR_CLIENTE',
    data: { clienteId, empresaId }
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100
  });
}

export async function agendarSincronizacaoProdutos(empresaId: string): Promise<Job> {
  return sincronizacaoQueue.add('SINCRONIZAR_PRODUTOS', {
    type: 'SINCRONIZAR_PRODUTOS',
    data: { empresaId }
  }, {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 5000
    },
    removeOnComplete: 10
  });
}

export async function agendarProcessamentoPedido(pedidoId: string, delay?: number): Promise<Job> {
  return pedidoQueue.add('PROCESSAR_PEDIDO', {
    type: 'PROCESSAR_PEDIDO',
    data: { pedidoId }
  }, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 3000
    },
    delay,
    removeOnComplete: 50
  });
}

export async function agendarFaturamentoPedido(pedidoId: string, delay?: number): Promise<Job> {
  return pedidoQueue.add('FATURAR_PEDIDO', {
    type: 'FATURAR_PEDIDO',
    data: { pedidoId }
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    delay,
    removeOnComplete: 50
  });
}

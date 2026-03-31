// Jobs simplificados - sem Redis/BullMQ
// Processamento sincrono direto

import { ClienteService } from '../services/ClienteService.js';
import { ProdutoService } from '../services/ProdutoService.js';
import { PedidoService } from '../services/PedidoService.js';
import { logger } from '../middlewares/logger.js';

// Tipos de jobs
interface SincronizarClienteJob {
  clienteId: string;
  empresaId: string;
}

interface SincronizarProdutosJob {
  empresaId: string;
}

// Inicializacao (noop sem Redis)
export function initializeWorkers(): void {
  logger.info('Workers desabilitados - modo sem Redis ativo');
}

// Processadores sincronos
export async function processarSincronizacaoCliente(data: SincronizarClienteJob): Promise<void> {
  const { clienteId, empresaId } = data;
  logger.info({ clienteId, empresaId }, 'Sincronizando cliente com empresa (sincrono)');
}

export async function processarSincronizacaoProdutos(data: SincronizarProdutosJob): Promise<void> {
  const produtoService = new ProdutoService();
  const { empresaId } = data;

  await produtoService.sincronizarProdutosEmpresa(empresaId);
  logger.info({ empresaId }, 'Produtos sincronizados');
}

export async function agendarSincronizacaoProdutos(empresaId: string): Promise<{ id: string }> {
  // Processa imediatamente em vez de agendar
  await processarSincronizacaoProdutos({ empresaId });
  return { id: `sync-${Date.now()}` };
}

export async function agendarProcessamentoPedido(pedidoId: string, delay?: number): Promise<{ id: string }> {
  const pedidoService = new PedidoService();

  // Se tiver delay, aguarda
  if (delay && delay > 0) {
    await new Promise(r => setTimeout(r, delay));
  }

  await pedidoService.processarPedido(pedidoId);
  logger.info({ pedidoId }, 'Pedido processado');
  return { id: `pedido-${Date.now()}` };
}

export async function agendarFaturamentoPedido(pedidoId: string, delay?: number): Promise<{ id: string }> {
  const pedidoService = new PedidoService();

  // Se tiver delay, aguarda
  if (delay && delay > 0) {
    await new Promise(r => setTimeout(r, delay));
  }

  await pedidoService.faturarPedido(pedidoId);
  logger.info({ pedidoId }, 'Pedido faturado');
  return { id: `fatura-${Date.now()}` };
}

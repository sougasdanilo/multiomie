import { ProdutoService } from '../services/ProdutoService.js';
import { PedidoService } from '../services/PedidoService.js';
import { logger } from '../middlewares/logger.js';
export function initializeWorkers() {
    logger.info('Workers desabilitados - modo sem Redis ativo');
}
export async function processarSincronizacaoCliente(data) {
    const { clienteId, empresaId } = data;
    logger.info({ clienteId, empresaId }, 'Sincronizando cliente com empresa (sincrono)');
}
export async function processarSincronizacaoProdutos(data) {
    const produtoService = new ProdutoService();
    const { empresaId } = data;
    await produtoService.sincronizarProdutosEmpresa(empresaId);
    logger.info({ empresaId }, 'Produtos sincronizados');
}
export async function agendarSincronizacaoProdutos(empresaId) {
    await processarSincronizacaoProdutos({ empresaId });
    return { id: `sync-${Date.now()}` };
}
export async function agendarProcessamentoPedido(pedidoId, delay) {
    const pedidoService = new PedidoService();
    if (delay && delay > 0) {
        await new Promise(r => setTimeout(r, delay));
    }
    await pedidoService.processarPedido(pedidoId);
    logger.info({ pedidoId }, 'Pedido processado');
    return { id: `pedido-${Date.now()}` };
}
export async function agendarFaturamentoPedido(pedidoId, delay) {
    const pedidoService = new PedidoService();
    if (delay && delay > 0) {
        await new Promise(r => setTimeout(r, delay));
    }
    await pedidoService.faturarPedido(pedidoId);
    logger.info({ pedidoId }, 'Pedido faturado');
    return { id: `fatura-${Date.now()}` };
}
//# sourceMappingURL=queues.js.map
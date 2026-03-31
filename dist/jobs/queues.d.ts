interface SincronizarClienteJob {
    clienteId: string;
    empresaId: string;
}
interface SincronizarProdutosJob {
    empresaId: string;
}
export declare function initializeWorkers(): void;
export declare function processarSincronizacaoCliente(data: SincronizarClienteJob): Promise<void>;
export declare function processarSincronizacaoProdutos(data: SincronizarProdutosJob): Promise<void>;
export declare function agendarSincronizacaoProdutos(empresaId: string): Promise<{
    id: string;
}>;
export declare function agendarProcessamentoPedido(pedidoId: string, delay?: number): Promise<{
    id: string;
}>;
export declare function agendarFaturamentoPedido(pedidoId: string, delay?: number): Promise<{
    id: string;
}>;
export {};
//# sourceMappingURL=queues.d.ts.map
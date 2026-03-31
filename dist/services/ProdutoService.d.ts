import { Produto, ProdutoEmpresa, EstoqueInfo } from '../entities/index.js';
export declare class ProdutoService {
    private omieIntegration;
    constructor();
    sincronizarProdutosEmpresa(empresaId: string): Promise<{
        processados: number;
        criados: number;
        atualizados: number;
    }>;
    private processarProdutoOmie;
    consultarEstoque(produtoId: string, empresaId: string): Promise<EstoqueInfo>;
    reservarEstoque(produtoId: string, empresaId: string, quantidade: number, reservaId: string): Promise<boolean>;
    liberarReserva(produtoId: string, empresaId: string, reservaId: string): Promise<void>;
    listarProdutosEmpresa(empresaId: string, skip?: number, take?: number): Promise<Array<Produto & {
        estoque: ProdutoEmpresa;
    }>>;
    private mapearTipoProduto;
}
//# sourceMappingURL=ProdutoService.d.ts.map
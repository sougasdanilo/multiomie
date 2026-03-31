import { Pedido, Endereco } from '../entities/index.js';
export interface CreatePedidoItemDTO {
    produtoId: string;
    quantidade: number;
    precoUnitario?: number;
    percentualDesconto?: number;
}
export interface CreatePedidoDTO {
    clienteId: string;
    enderecoEntrega?: Endereco;
    observacoes?: string;
    observacaoInterna?: string;
    formaPagamento: string;
    condicaoPagamento?: string;
    dataPrevisao?: Date;
    itens: CreatePedidoItemDTO[];
    usuarioId?: string;
}
export declare class PedidoService {
    private omieIntegration;
    private clienteService;
    private produtoService;
    constructor();
    criarPedido(dados: CreatePedidoDTO): Promise<Pedido>;
    processarPedido(pedidoId: string): Promise<Pedido>;
    faturarPedido(pedidoId: string): Promise<Pedido>;
    obterPedido(id: string): Promise<Pedido | null>;
    listarPedidos(skip?: number, take?: number, filtros?: {
        status?: string;
        clienteId?: string;
    }): Promise<Pedido[]>;
    private gerarNumeroPedido;
    private calcularValores;
    private mapToEntity;
}
//# sourceMappingURL=PedidoService.d.ts.map
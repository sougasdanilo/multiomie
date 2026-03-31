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
export interface PedidoOmiePayload {
    cabecalho: {
        codigo_cliente: number;
        codigo_pedido_integracao: string;
        data_previsao: string;
        numero_pedido: string;
        codigo_parcela: string;
        quantidade_itens: number;
        valor_total: number;
        obs?: string;
    };
    det: Array<{
        ide: {
            codigo_produto: number;
            quantidade: number;
        };
        produto: {
            valor_unitario: number;
            valor_total: number;
        };
    }>;
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
    private validarEEnriquecerItens;
    private agruparItensPorEmpresa;
    private calcularValores;
    private gerarNumeroPedido;
    private criarPedidoOmie;
    private faturarPedidoOmie;
    private cancelarPedidoOmie;
    private mapToEntity;
}
//# sourceMappingURL=PedidoService.d.ts.map
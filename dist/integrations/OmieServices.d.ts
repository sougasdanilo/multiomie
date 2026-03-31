import { OmieClient } from './OmieClient.js';
import { Empresa } from '../entities/index.js';
export declare class OmieClienteService {
    private omieClient;
    constructor(omieClient: OmieClient);
    incluir(cliente: any): Promise<{
        codigo_cliente_omie: number;
        codigo_cliente_integracao: string;
    }>;
    alterar(cliente: any): Promise<any>;
    consultar(cnpjCpf: string): Promise<any | null>;
    listar(pagina?: number, registrosPorPagina?: number): Promise<any>;
}
export declare class OmieProdutoService {
    private omieClient;
    constructor(omieClient: OmieClient);
    consultar(codigoProduto: string): Promise<any>;
    listar(pagina?: number, registrosPorPagina?: number): Promise<any>;
    consultarEstoque(codigoProduto: string): Promise<{
        saldo: number;
        reservado?: number;
    }>;
}
export declare class OmiePedidoService {
    private omieClient;
    constructor(omieClient: OmieClient);
    incluir(pedido: any): Promise<{
        codigo_pedido: number;
        codigo_pedido_integracao: string;
        numero_pedido: string;
    }>;
    alterar(pedido: any): Promise<any>;
    consultar(codigoPedido: string): Promise<any>;
    faturar(codigoPedido: string): Promise<any>;
    cancelar(codigoPedido: string, motivo: string): Promise<any>;
}
export declare class OmieNfeService {
    private omieClient;
    constructor(omieClient: OmieClient);
    consultarPorPedido(codigoPedido: string): Promise<any | null>;
    listar(pagina?: number, registrosPorPagina?: number): Promise<any>;
}
export declare class OmieIntegrationService {
    private clientFactory;
    constructor();
    getClienteService(empresa: Empresa): OmieClienteService;
    getProdutoService(empresa: Empresa): OmieProdutoService;
    getPedidoService(empresa: Empresa): OmiePedidoService;
    getNfeService(empresa: Empresa): OmieNfeService;
    getEmpresaByAppKey(appKey: string): Promise<Empresa | null>;
}
//# sourceMappingURL=OmieServices.d.ts.map
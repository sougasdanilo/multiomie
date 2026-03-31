import { OmieClientFactory, OmieApiError } from './OmieClient.js';
import { sql } from '../config/database.js';
export class OmieClienteService {
    omieClient;
    constructor(omieClient) {
        this.omieClient = omieClient;
    }
    async incluir(cliente) {
        return await this.omieClient.call('geral/clientes', 'IncluirCliente', cliente);
    }
    async alterar(cliente) {
        return await this.omieClient.call('geral/clientes', 'AlterarCliente', cliente);
    }
    async consultar(cnpjCpf) {
        try {
            const response = await this.omieClient.call('geral/clientes', 'ConsultarCliente', {
                cnpj_cpf: cnpjCpf.replace(/[^0-9]/g, '')
            });
            return response.cliente_cadastro;
        }
        catch (error) {
            if (error instanceof OmieApiError && error.code.includes('113')) {
                return null;
            }
            throw error;
        }
    }
    async listar(pagina = 1, registrosPorPagina = 50) {
        return await this.omieClient.call('geral/clientes', 'ListarClientes', {
            pagina,
            registros_por_pagina: registrosPorPagina,
            apenas_importado_api: 'N'
        });
    }
}
export class OmieProdutoService {
    omieClient;
    constructor(omieClient) {
        this.omieClient = omieClient;
    }
    async consultar(codigoProduto) {
        const response = await this.omieClient.call('geral/produtos', 'ConsultarProduto', {
            codigo: codigoProduto
        });
        return response.produto_servico_cadastro;
    }
    async listar(pagina = 1, registrosPorPagina = 50) {
        return await this.omieClient.call('geral/produtos', 'ListarProdutos', {
            pagina,
            registros_por_pagina: registrosPorPagina,
            apenas_importado_api: 'N',
            filtrar_apenas_ativo: 'S'
        });
    }
    async consultarEstoque(codigoProduto) {
        return await this.omieClient.call('estoque/consulta', 'ConsultarEstoque', {
            codigo_produto: codigoProduto
        });
    }
}
export class OmiePedidoService {
    omieClient;
    constructor(omieClient) {
        this.omieClient = omieClient;
    }
    async incluir(pedido) {
        return await this.omieClient.call('produtos/pedido', 'IncluirPedido', pedido);
    }
    async alterar(pedido) {
        return await this.omieClient.call('produtos/pedido', 'AlterarPedido', pedido);
    }
    async consultar(codigoPedido) {
        const response = await this.omieClient.call('produtos/pedido', 'ConsultarPedido', {
            codigo_pedido: codigoPedido
        });
        return response.pedido_venda_produto;
    }
    async faturar(codigoPedido) {
        return await this.omieClient.call('produtos/pedidovendafat', 'FaturarPedidoVenda', {
            codigo_pedido: codigoPedido
        });
    }
    async cancelar(codigoPedido, motivo) {
        return await this.omieClient.call('produtos/pedido', 'CancelarPedido', {
            codigo_pedido: codigoPedido,
            motivo
        });
    }
}
export class OmieNfeService {
    omieClient;
    constructor(omieClient) {
        this.omieClient = omieClient;
    }
    async consultarPorPedido(codigoPedido) {
        try {
            const response = await this.omieClient.call('produtos/nfconsultar', 'ConsultarNF', {
                codigo_pedido: codigoPedido
            });
            return response.nfCadastro;
        }
        catch (error) {
            if (error instanceof OmieApiError && error.message.includes('não localizada')) {
                return null;
            }
            throw error;
        }
    }
    async listar(pagina = 1, registrosPorPagina = 50) {
        return await this.omieClient.call('produtos/nfconsultar', 'ListarNF', {
            pagina,
            registros_por_pagina: registrosPorPagina
        });
    }
}
export class OmieIntegrationService {
    clientFactory;
    constructor() {
        this.clientFactory = new OmieClientFactory();
    }
    getClienteService(empresa) {
        return new OmieClienteService(this.clientFactory.create(empresa));
    }
    getProdutoService(empresa) {
        return new OmieProdutoService(this.clientFactory.create(empresa));
    }
    getPedidoService(empresa) {
        return new OmiePedidoService(this.clientFactory.create(empresa));
    }
    getNfeService(empresa) {
        return new OmieNfeService(this.clientFactory.create(empresa));
    }
    async getEmpresaByAppKey(appKey) {
        const empresa = await sql `SELECT * FROM empresas WHERE app_key = ${appKey} LIMIT 1`;
        if (!empresa.length) {
            return null;
        }
        return {
            id: empresa[0].id,
            nome: empresa[0].nome,
            cnpj: empresa[0].cnpj,
            nomeFantasia: empresa[0].nome_fantasia || undefined,
            appKey: empresa[0].app_key,
            appSecret: empresa[0].app_secret,
            ativa: empresa[0].ativa,
            configuracoes: empresa[0].configuracoes,
            createdAt: empresa[0].created_at,
            updatedAt: empresa[0].updated_at
        };
    }
}
//# sourceMappingURL=OmieServices.js.map
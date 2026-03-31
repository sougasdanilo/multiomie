import { OmieClient, OmieClientFactory, OmieApiError } from './OmieClient';
import { Empresa } from '../entities';
import { prisma } from '../config/database';

export class OmieClienteService {
  constructor(private omieClient: OmieClient) {}

  async incluir(cliente: any): Promise<{ codigo_cliente_omie: number; codigo_cliente_integracao: string }> {
    return await this.omieClient.call('geral/clientes', 'IncluirCliente', cliente);
  }

  async alterar(cliente: any): Promise<any> {
    return await this.omieClient.call('geral/clientes', 'AlterarCliente', cliente);
  }

  async consultar(cnpjCpf: string): Promise<any | null> {
    try {
      const response = await this.omieClient.call('geral/clientes', 'ConsultarCliente', {
        cnpj_cpf: cnpjCpf.replace(/[^0-9]/g, '')
      });
      return response.cliente_cadastro;
    } catch (error) {
      if (error instanceof OmieApiError && error.code.includes('113')) {
        return null;
      }
      throw error;
    }
  }

  async listar(pagina: number = 1, registrosPorPagina: number = 50): Promise<any> {
    return await this.omieClient.call('geral/clientes', 'ListarClientes', {
      pagina,
      registros_por_pagina: registrosPorPagina,
      apenas_importado_api: 'N'
    });
  }
}

export class OmieProdutoService {
  constructor(private omieClient: OmieClient) {}

  async consultar(codigoProduto: string): Promise<any> {
    const response = await this.omieClient.call('geral/produtos', 'ConsultarProduto', {
      codigo: codigoProduto
    });
    return response.produto_servico_cadastro;
  }

  async listar(pagina: number = 1, registrosPorPagina: number = 50): Promise<any> {
    return await this.omieClient.call('geral/produtos', 'ListarProdutos', {
      pagina,
      registros_por_pagina: registrosPorPagina,
      apenas_importado_api: 'N',
      filtrar_apenas_ativo: 'S'
    });
  }

  async consultarEstoque(codigoProduto: string): Promise<{ saldo: number; reservado?: number }> {
    return await this.omieClient.call('estoque/consulta', 'ConsultarEstoque', {
      codigo_produto: codigoProduto
    });
  }
}

export class OmiePedidoService {
  constructor(private omieClient: OmieClient) {}

  async incluir(pedido: any): Promise<{ codigo_pedido: number; codigo_pedido_integracao: string; numero_pedido: string }> {
    return await this.omieClient.call('produtos/pedido', 'IncluirPedido', pedido);
  }

  async alterar(pedido: any): Promise<any> {
    return await this.omieClient.call('produtos/pedido', 'AlterarPedido', pedido);
  }

  async consultar(codigoPedido: string): Promise<any> {
    const response = await this.omieClient.call('produtos/pedido', 'ConsultarPedido', {
      codigo_pedido: codigoPedido
    });
    return response.pedido_venda_produto;
  }

  async faturar(codigoPedido: string): Promise<any> {
    return await this.omieClient.call('produtos/pedidovendafat', 'FaturarPedidoVenda', {
      codigo_pedido: codigoPedido
    });
  }

  async cancelar(codigoPedido: string, motivo: string): Promise<any> {
    return await this.omieClient.call('produtos/pedido', 'CancelarPedido', {
      codigo_pedido: codigoPedido,
      motivo
    });
  }
}

export class OmieNfeService {
  constructor(private omieClient: OmieClient) {}

  async consultarPorPedido(codigoPedido: string): Promise<any | null> {
    try {
      const response = await this.omieClient.call('produtos/nfconsultar', 'ConsultarNF', {
        codigo_pedido: codigoPedido
      });
      return response.nfCadastro;
    } catch (error) {
      if (error instanceof OmieApiError && error.message.includes('não localizada')) {
        return null;
      }
      throw error;
    }
  }

  async listar(pagina: number = 1, registrosPorPagina: number = 50): Promise<any> {
    return await this.omieClient.call('produtos/nfconsultar', 'ListarNF', {
      pagina,
      registros_por_pagina: registrosPorPagina
    });
  }
}

export class OmieIntegrationService {
  private clientFactory: OmieClientFactory;

  constructor() {
    this.clientFactory = new OmieClientFactory();
  }

  getClienteService(empresa: Empresa): OmieClienteService {
    return new OmieClienteService(this.clientFactory.create(empresa));
  }

  getProdutoService(empresa: Empresa): OmieProdutoService {
    return new OmieProdutoService(this.clientFactory.create(empresa));
  }

  getPedidoService(empresa: Empresa): OmiePedidoService {
    return new OmiePedidoService(this.clientFactory.create(empresa));
  }

  getNfeService(empresa: Empresa): OmieNfeService {
    return new OmieNfeService(this.clientFactory.create(empresa));
  }

  async getEmpresaByAppKey(appKey: string): Promise<Empresa | null> {
    const empresa = await prisma.empresa.findFirst({
      where: { app_key: appKey }
    });

    if (!empresa) return null;

    return {
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
    };
  }
}

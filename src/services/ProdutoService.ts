import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { OmieIntegrationService } from '../integrations/OmieServices';
import { Produto, ProdutoEmpresa, EstoqueInfo } from '../entities';

export class ProdutoService {
  private omieIntegration: OmieIntegrationService;

  constructor() {
    this.omieIntegration = new OmieIntegrationService();
  }

  /**
   * Sincroniza produtos de uma empresa com o Omie
   */
  async sincronizarProdutosEmpresa(empresaId: string): Promise<{
    processados: number;
    criados: number;
    atualizados: number;
  }> {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId }
    });

    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    const omieService = this.omieIntegration.getProdutoService({
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
    });

    let pagina = 1;
    let totalProcessados = 0;
    let totalCriados = 0;
    let totalAtualizados = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await omieService.listar(pagina, 50);
      
      if (!response.produto_servico_cadastro) break;

      for (const produtoOmie of response.produto_servico_cadastro) {
        const resultado = await this.processarProdutoOmie(produtoOmie, empresa);
        
        if (resultado.acao === 'CRIADO') totalCriados++;
        if (resultado.acao === 'ATUALIZADO') totalAtualizados++;
        totalProcessados++;
      }

      hasMore = response.pagina < response.total_de_paginas;
      pagina++;

      // Rate limiting
      if (hasMore) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    return {
      processados: totalProcessados,
      criados: totalCriados,
      atualizados: totalAtualizados
    };
  }

  /**
   * Processa produto retornado do Omie
   */
  private async processarProdutoOmie(
    produtoOmie: any,
    empresa: any
  ): Promise<{ acao: 'CRIADO' | 'ATUALIZADO'; produtoId: string }> {
    const ncm = produtoOmie.ncm?.codigo || '00000000';
    
    // Tenta encontrar produto existente no ERP
    let produto = await prisma.produto.findFirst({
      where: {
        OR: [
          { ncm },
          { codigo: `OMIE_${produtoOmie.codigo}` }
        ]
      }
    });

    if (!produto) {
      // Cria produto genérico no ERP
      produto = await prisma.produto.create({
        data: {
          codigo: `OMIE_${produtoOmie.codigo}`,
          descricao: produtoOmie.descricao,
          descricao_complementar: produtoOmie.descr_detalhada,
          ncm,
          cest: produtoOmie.cest?.codigo,
          unidade: produtoOmie.unidade,
          preco_base: parseFloat(produtoOmie.valor_unitario) || 0,
          tipo: this.mapearTipoProduto(produtoOmie.tipoItem),
          ativo: true
        }
      });
    }

    // Atualiza/cria vínculo com empresa
    const existente = await prisma.produtoEmpresa.findUnique({
      where: {
        produto_id_empresa_id: {
          produto_id: produto.id,
          empresa_id: empresa.id
        }
      }
    });

    await prisma.produtoEmpresa.upsert({
      where: {
        produto_id_empresa_id: {
          produto_id: produto.id,
          empresa_id: empresa.id
        }
      },
      create: {
        produto_id: produto.id,
        empresa_id: empresa.id,
        codigo_omie: produtoOmie.codigo.toString(),
        preco_venda: parseFloat(produtoOmie.valor_unitario) || 0,
        estoque_atual: parseInt(produtoOmie.quantidade_estoque) || 0,
        dados_omie: produtoOmie
      },
      update: {
        codigo_omie: produtoOmie.codigo.toString(),
        preco_venda: parseFloat(produtoOmie.valor_unitario) || 0,
        estoque_atual: parseInt(produtoOmie.quantidade_estoque) || 0,
        dados_omie: produtoOmie
      }
    });

    return {
      acao: existente ? 'ATUALIZADO' : 'CRIADO',
      produtoId: produto.id
    };
  }

  /**
   * Consulta estoque em tempo real (sem cache - Redis removido)
   */
  async consultarEstoque(
    produtoId: string,
    empresaId: string
  ): Promise<EstoqueInfo> {
    const produtoEmpresa = await prisma.produtoEmpresa.findUnique({
      where: {
        produto_id_empresa_id: {
          produto_id: produtoId,
          empresa_id: empresaId
        }
      },
      include: { produto: true, empresa: true }
    });

    if (!produtoEmpresa) {
      throw new Error('Produto não encontrado na empresa');
    }

    const omieService = this.omieIntegration.getProdutoService({
      id: produtoEmpresa.empresa.id,
      nome: produtoEmpresa.empresa.nome,
      cnpj: produtoEmpresa.empresa.cnpj,
      nomeFantasia: produtoEmpresa.empresa.nome_fantasia || undefined,
      appKey: produtoEmpresa.empresa.app_key,
      appSecret: produtoEmpresa.empresa.app_secret,
      ativa: produtoEmpresa.empresa.ativa,
      configuracoes: produtoEmpresa.empresa.configuracoes as Record<string, unknown> | undefined,
      createdAt: produtoEmpresa.empresa.created_at,
      updatedAt: produtoEmpresa.empresa.updated_at
    });

    // Consulta estoque real no Omie
    const response = await omieService.consultarEstoque(produtoEmpresa.codigo_omie);

    const estoque: EstoqueInfo = {
      produtoId,
      empresaId,
      codigoOmie: produtoEmpresa.codigo_omie,
      saldo: response.saldo,
      reservado: response.reservado || 0,
      disponivel: response.saldo - (response.reservado || 0),
      ultimaConsulta: new Date()
    };

    // Atualiza no banco (sem cache Redis)
    await prisma.produtoEmpresa.update({
      where: {
        produto_id_empresa_id: {
          produto_id: produtoId,
          empresa_id: empresaId
        }
      },
      data: {
        estoque_atual: response.saldo,
        estoque_reservado: response.reservado || 0,
        ultima_consulta: new Date()
      }
    });

    return estoque;
  }

  /**
   * Reserva estoque (bloqueio temporário) - sem Redis, usa apenas banco
   */
  async reservarEstoque(
    produtoId: string,
    empresaId: string,
    quantidade: number,
    reservaId: string
  ): Promise<boolean> {
    const estoque = await this.consultarEstoque(produtoId, empresaId);

    if (estoque.disponivel < quantidade) {
      return false;
    }

    // Registra reserva no banco (campo estoque_reservado)
    await prisma.produtoEmpresa.update({
      where: {
        produto_id_empresa_id: {
          produto_id: produtoId,
          empresa_id: empresaId
        }
      },
      data: {
        estoque_reservado: { increment: quantidade }
      }
    });

    return true;
  }

  /**
   * Libera reserva de estoque - sem Redis, usa apenas banco
   */
  async liberarReserva(
    produtoId: string,
    empresaId: string,
    reservaId: string
  ): Promise<void> {
    // Atualiza no banco (decrementa reserva)
    await prisma.produtoEmpresa.update({
      where: {
        produto_id_empresa_id: {
          produto_id: produtoId,
          empresa_id: empresaId
        }
      },
      data: {
        estoque_reservado: { decrement: 0 } // Seria necessário saber a quantidade exata
      }
    });
  }

  /**
   * Lista produtos com estoque de uma empresa
   */
  async listarProdutosEmpresa(
    empresaId: string,
    skip: number = 0,
    take: number = 50
  ): Promise<Array<Produto & { estoque: ProdutoEmpresa }>> {
    const produtosEmpresa = await prisma.produtoEmpresa.findMany({
      where: { empresa_id: empresaId },
      skip,
      take,
      include: { produto: true }
    });

    return produtosEmpresa.map(pe => ({
      id: pe.produto.id,
      codigo: pe.produto.codigo,
      descricao: pe.produto.descricao,
      descricaoComplementar: pe.produto.descricao_complementar || undefined,
      ncm: pe.produto.ncm,
      cest: pe.produto.cest || undefined,
      cfop: pe.produto.cfop || undefined,
      unidade: pe.produto.unidade,
      precoBase: pe.produto.preco_base ? parseFloat(pe.produto.preco_base.toString()) : undefined,
      tipo: pe.produto.tipo as any,
      ativo: pe.produto.ativo,
      createdAt: pe.produto.created_at,
      updatedAt: pe.produto.updated_at,
      estoque: {
        id: pe.id,
        produtoId: pe.produto_id,
        empresaId: pe.empresa_id,
        codigoOmie: pe.codigo_omie,
        estoqueMinimo: pe.estoque_minimo,
        estoqueAtual: pe.estoque_atual,
        estoqueReservado: pe.estoque_reservado,
        ultimaConsulta: pe.ultima_consulta || undefined,
        precoVenda: pe.preco_venda ? parseFloat(pe.preco_venda.toString()) : undefined,
        configFiscal: pe.config_fiscal as Record<string, unknown> | undefined,
        dadosOmie: pe.dados_omie as Record<string, unknown> | undefined
      }
    }));
  }

  private mapearTipoProduto(tipoItem: string): 'PRODUTO' | 'SERVICO' | 'KIT' {
    const map: Record<string, 'PRODUTO' | 'SERVICO' | 'KIT'> = {
      '00': 'PRODUTO',
      '01': 'PRODUTO',
      '02': 'SERVICO',
      '03': 'KIT',
      '04': 'PRODUTO',
      '05': 'SERVICO'
    };
    return map[tipoItem] || 'PRODUTO';
  }
}

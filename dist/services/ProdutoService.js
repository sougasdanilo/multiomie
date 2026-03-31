import { sql } from '../config/database.js';
import { OmieIntegrationService } from '../integrations/OmieServices.js';
export class ProdutoService {
    omieIntegration;
    constructor() {
        this.omieIntegration = new OmieIntegrationService();
    }
    async sincronizarProdutosEmpresa(empresaId) {
        const empresa = await sql `SELECT * FROM empresas WHERE id = ${empresaId} LIMIT 1`;
        if (!empresa.length) {
            throw new Error('Empresa não encontrada');
        }
        const omieService = this.omieIntegration.getProdutoService({
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
        });
        let pagina = 1;
        let totalProcessados = 0;
        let totalCriados = 0;
        let totalAtualizados = 0;
        let hasMore = true;
        while (hasMore) {
            const response = await omieService.listar(pagina, 50);
            if (!response.produto_servico_cadastro)
                break;
            for (const produtoOmie of response.produto_servico_cadastro) {
                const resultado = await this.processarProdutoOmie(produtoOmie, empresa);
                if (resultado.acao === 'CRIADO')
                    totalCriados++;
                if (resultado.acao === 'ATUALIZADO')
                    totalAtualizados++;
                totalProcessados++;
            }
            hasMore = response.pagina < response.total_de_paginas;
            pagina++;
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
    async processarProdutoOmie(produtoOmie, empresa) {
        const ncm = produtoOmie.ncm?.codigo || '00000000';
        let produto = await sql `
      SELECT * FROM produtos WHERE ncm = ${ncm} OR codigo = ${`OMIE_${produtoOmie.codigo}`} LIMIT 1
    `;
        if (!produto.length) {
            produto = await sql `
        INSERT INTO produtos (codigo, descricao, descricao_complementar, ncm, cest, unidade, preco_base, tipo, ativo)
        VALUES (${`OMIE_${produtoOmie.codigo}`}, ${produtoOmie.descricao}, ${produtoOmie.descr_detalhada}, ${ncm}, ${produtoOmie.cest?.codigo}, ${produtoOmie.unidade}, ${parseFloat(produtoOmie.valor_unitario) || 0}, ${this.mapearTipoProduto(produtoOmie.tipoItem)}, ${true})
        RETURNING *
      `;
        }
        const existente = await sql `
      SELECT * FROM produto_empresa WHERE produto_id = ${produto[0].id} AND empresa_id = ${empresa.id} LIMIT 1
    `;
        if (existente.length) {
            await sql `
        UPDATE produto_empresa 
        SET codigo_omie = ${produtoOmie.codigo.toString()}, 
            preco_venda = ${parseFloat(produtoOmie.valor_unitario) || 0}, 
            estoque_atual = ${parseInt(produtoOmie.quantidade_estoque) || 0}, 
            dados_omie = ${JSON.stringify(produtoOmie)}
        WHERE produto_id = ${produto[0].id} AND empresa_id = ${empresa.id}
      `;
        }
        else {
            await sql `
        INSERT INTO produto_empresa (produto_id, empresa_id, codigo_omie, preco_venda, estoque_atual, dados_omie)
        VALUES (${produto[0].id}, ${empresa.id}, ${produtoOmie.codigo.toString()}, ${parseFloat(produtoOmie.valor_unitario) || 0}, ${parseInt(produtoOmie.quantidade_estoque) || 0}, ${JSON.stringify(produtoOmie)})
      `;
        }
        return {
            acao: existente.length ? 'ATUALIZADO' : 'CRIADO',
            produtoId: produto[0].id
        };
    }
    async consultarEstoque(produtoId, empresaId) {
        const produtoEmpresa = await sql `
      SELECT * FROM produto_empresa WHERE produto_id = ${produtoId} AND empresa_id = ${empresaId} LIMIT 1
    `;
        if (!produtoEmpresa.length) {
            throw new Error('Produto não encontrado na empresa');
        }
        const empresa = await sql `SELECT * FROM empresas WHERE id = ${empresaId} LIMIT 1`;
        const omieService = this.omieIntegration.getProdutoService({
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
        });
        const response = await omieService.consultarEstoque(produtoEmpresa[0].codigo_omie);
        const estoque = {
            produtoId,
            empresaId,
            codigoOmie: produtoEmpresa[0].codigo_omie,
            saldo: response.saldo,
            reservado: response.reservado || 0,
            disponivel: response.saldo - (response.reservado || 0),
            ultimaConsulta: new Date()
        };
        await sql `
      UPDATE produto_empresa 
      SET estoque_atual = ${response.saldo}, 
          estoque_reservado = ${response.reservado || 0}, 
          ultima_consulta = NOW()
      WHERE produto_id = ${produtoId} AND empresa_id = ${empresaId}
    `;
        return estoque;
    }
    async reservarEstoque(produtoId, empresaId, quantidade, reservaId) {
        const estoque = await this.consultarEstoque(produtoId, empresaId);
        if (estoque.disponivel < quantidade) {
            return false;
        }
        await sql `
      UPDATE produto_empresa 
      SET estoque_reservado = estoque_reservado + ${quantidade}
      WHERE produto_id = ${produtoId} AND empresa_id = ${empresaId}
    `;
        return true;
    }
    async liberarReserva(produtoId, empresaId, reservaId) {
        await sql `
      UPDATE produto_empresa 
      SET estoque_reservado = GREATEST(0, estoque_reservado - 1)
      WHERE produto_id = ${produtoId} AND empresa_id = ${empresaId}
    `;
    }
    async listarProdutosEmpresa(empresaId, skip = 0, take = 50) {
        const produtosEmpresa = await sql `
      SELECT pe.*, p.* 
      FROM produto_empresa pe
      JOIN produtos p ON p.id = pe.produto_id
      WHERE pe.empresa_id = ${empresaId}
      LIMIT ${take} OFFSET ${skip}
    `;
        return produtosEmpresa.map((pe) => ({
            id: pe.produto_id,
            codigo: pe.codigo,
            descricao: pe.descricao,
            descricaoComplementar: pe.descricao_complementar || undefined,
            ncm: pe.ncm,
            cest: pe.cest || undefined,
            cfop: pe.cfop || undefined,
            unidade: pe.unidade,
            precoBase: pe.preco_base ? parseFloat(pe.preco_base.toString()) : undefined,
            tipo: pe.tipo,
            ativo: pe.ativo,
            createdAt: pe.created_at,
            updatedAt: pe.updated_at,
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
                configFiscal: pe.config_fiscal,
                dadosOmie: pe.dados_omie
            }
        }));
    }
    mapearTipoProduto(tipoItem) {
        const map = {
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
//# sourceMappingURL=ProdutoService.js.map
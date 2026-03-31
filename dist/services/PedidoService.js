import { prisma } from '../config/database.js';
import { OmieIntegrationService } from '../integrations/OmieServices.js';
import { ClienteService } from './ClienteService.js';
import { ProdutoService } from './ProdutoService.js';
import { format, addDays } from 'date-fns';
export class PedidoService {
    omieIntegration;
    clienteService;
    produtoService;
    constructor() {
        this.omieIntegration = new OmieIntegrationService();
        this.clienteService = new ClienteService();
        this.produtoService = new ProdutoService();
    }
    async criarPedido(dados) {
        const cliente = await prisma.cliente.findUnique({
            where: { id: dados.clienteId }
        });
        if (!cliente) {
            throw new Error('Cliente não encontrado');
        }
        const itensValidados = await this.validarEEnriquecerItens(dados.itens);
        const itensPorEmpresa = this.agruparItensPorEmpresa(itensValidados);
        const numeroPedido = await this.gerarNumeroPedido();
        const valores = this.calcularValores(itensValidados);
        const pedido = await prisma.pedido.create({
            data: {
                numero: numeroPedido,
                cliente_id: dados.clienteId,
                status: 'RASCUNHO',
                valor_produtos: valores.produtos,
                valor_desconto: valores.desconto,
                valor_frete: 0,
                valor_total: valores.total,
                endereco_entrega: dados.enderecoEntrega,
                data_previsao: dados.dataPrevisao || addDays(new Date(), 7),
                forma_pagamento: dados.formaPagamento,
                condicao_pagamento: dados.condicaoPagamento,
                observacoes: dados.observacoes,
                observacao_interna: dados.observacaoInterna,
                usuario_id: dados.usuarioId,
                itens: {
                    create: itensValidados.map((item, index) => ({
                        produto_id: item.produtoId,
                        empresa_id: item.empresaId,
                        quantidade: item.quantidade,
                        preco_unitario: item.precoUnitario,
                        valor_total: item.quantidade * item.precoUnitario,
                        percentual_desconto: item.percentualDesconto || 0,
                        valor_desconto: (item.quantidade * item.precoUnitario * (item.percentualDesconto || 0)) / 100,
                        sequencia: index + 1,
                        ncm: item.ncm,
                        cfop: item.cfop
                    }))
                }
            },
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: true,
                        produtoEmpresa: { include: { empresa: true } }
                    }
                }
            }
        });
        return this.mapToEntity(pedido);
    }
    async processarPedido(pedidoId) {
        const pedido = await prisma.pedido.findUnique({
            where: { id: pedidoId },
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: true,
                        produtoEmpresa: { include: { empresa: true } }
                    }
                }
            }
        });
        if (!pedido) {
            throw new Error('Pedido não encontrado');
        }
        if (pedido.status !== 'RASCUNHO' && pedido.status !== 'VALIDADO') {
            throw new Error(`Pedido não pode ser processado. Status atual: ${pedido.status}`);
        }
        await prisma.pedido.update({
            where: { id: pedidoId },
            data: { status: 'PROCESSANDO' }
        });
        const porEmpresa = {};
        for (const item of pedido.itens) {
            let empresaItens = porEmpresa[item.empresa_id];
            if (!empresaItens) {
                empresaItens = [];
                porEmpresa[item.empresa_id] = empresaItens;
            }
            empresaItens.push(item);
        }
        const resultados = [];
        for (const [empresaId, itens] of Object.entries(porEmpresa)) {
            try {
                const resultado = await this.criarPedidoOmie(pedido, empresaId, itens);
                resultados.push({
                    empresaId,
                    sucesso: true,
                    codigo: resultado.codigo_pedido.toString(),
                    numero: resultado.numero_pedido
                });
            }
            catch (error) {
                resultados.push({
                    empresaId,
                    sucesso: false,
                    erro: error.message
                });
            }
        }
        const todosSucesso = resultados.every(r => r.sucesso);
        const algumErro = resultados.some(r => !r.sucesso);
        if (algumErro) {
            for (const resultado of resultados) {
                if (resultado.sucesso && resultado.codigo) {
                    try {
                        await this.cancelarPedidoOmie(resultado.empresaId, resultado.codigo, 'Cancelado por falha em processamento multi-empresa');
                    }
                    catch (error) {
                        console.error(`Falha ao compensar pedido ${resultado.codigo}:`, error);
                    }
                }
            }
            await prisma.pedido.update({
                where: { id: pedidoId },
                data: {
                    status: 'CANCELADO',
                    observacao_interna: `Falha no processamento: ${resultados.filter(r => !r.sucesso && r.erro).map(r => r.erro).join(', ')}`
                }
            });
            throw new Error('Falha ao processar pedido em uma ou mais empresas');
        }
        await prisma.pedido.update({
            where: { id: pedidoId },
            data: {
                status: 'VALIDADO',
                processado_at: new Date()
            }
        });
        for (const resultado of resultados) {
            if (resultado.sucesso && resultado.codigo && resultado.numero) {
                await prisma.pedidoEmpresa.create({
                    data: {
                        pedido_id: pedidoId,
                        empresa_id: resultado.empresaId,
                        codigo_pedido_omie: resultado.codigo,
                        numero_pedido_omie: resultado.numero,
                        status_omie: 'PENDENTE'
                    }
                });
            }
        }
        return this.obterPedido(pedidoId);
    }
    async faturarPedido(pedidoId) {
        const pedido = await prisma.pedido.findUnique({
            where: { id: pedidoId },
            include: {
                pedidoEmpresas: { include: { empresa: true } }
            }
        });
        if (!pedido) {
            throw new Error('Pedido não encontrado');
        }
        if (pedido.status !== 'VALIDADO') {
            throw new Error('Pedido precisa estar validado para faturar');
        }
        await prisma.pedido.update({
            where: { id: pedidoId },
            data: { status: 'FATURANDO' }
        });
        const resultados = [];
        for (const pedidoEmpresa of pedido.pedidoEmpresas) {
            try {
                const notaFiscal = await this.faturarPedidoOmie(pedidoEmpresa);
                resultados.push({ sucesso: true, notaFiscal });
            }
            catch (error) {
                resultados.push({ sucesso: false, erro: error.message, pedidoEmpresa });
            }
        }
        const todosSucesso = resultados.every(r => r.sucesso);
        const statusFinal = todosSucesso ? 'CONCLUIDO' : 'FATURANDO';
        await prisma.pedido.update({
            where: { id: pedidoId },
            data: {
                status: statusFinal,
                faturado_at: todosSucesso ? new Date() : undefined
            }
        });
        if (!todosSucesso) {
            throw new Error('Falha ao faturar em uma ou mais empresas');
        }
        return this.obterPedido(pedidoId);
    }
    async obterPedido(id) {
        const pedido = await prisma.pedido.findUnique({
            where: { id },
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: true,
                        produtoEmpresa: { include: { empresa: true } }
                    }
                },
                pedidoEmpresas: { include: { empresa: true } },
                notasFiscais: { include: { empresa: true } }
            }
        });
        if (!pedido)
            return null;
        return this.mapToEntity(pedido);
    }
    async listarPedidos(skip = 0, take = 50, filtros) {
        const where = {};
        if (filtros?.status) {
            where.status = filtros.status;
        }
        if (filtros?.clienteId) {
            where.cliente_id = filtros.clienteId;
        }
        const pedidos = await prisma.pedido.findMany({
            where,
            skip,
            take,
            orderBy: { created_at: 'desc' },
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: true,
                        produtoEmpresa: { include: { empresa: true } }
                    }
                },
                pedidoEmpresas: { include: { empresa: true } },
                notasFiscais: true
            }
        });
        return pedidos.map(p => this.mapToEntity(p));
    }
    async validarEEnriquecerItens(itens) {
        const validados = [];
        for (const item of itens) {
            const produtoEmpresa = await prisma.produtoEmpresa.findFirst({
                where: { produto_id: item.produtoId },
                include: { produto: true, empresa: true }
            });
            if (!produtoEmpresa) {
                throw new Error(`Produto ${item.produtoId} não encontrado em nenhuma empresa`);
            }
            const estoque = await this.produtoService.consultarEstoque(item.produtoId, produtoEmpresa.empresa_id);
            if (estoque.disponivel < item.quantidade) {
                throw new Error(`Estoque insuficiente para produto ${produtoEmpresa.produto.descricao} ` +
                    `na empresa ${produtoEmpresa.empresa.nome}. ` +
                    `Disponível: ${estoque.disponivel}, Solicitado: ${item.quantidade}`);
            }
            const reservaId = `pedido_${Date.now()}_${item.produtoId}`;
            const reservado = await this.produtoService.reservarEstoque(item.produtoId, produtoEmpresa.empresa_id, item.quantidade, reservaId);
            if (!reservado) {
                throw new Error(`Não foi possível reservar estoque para produto ${item.produtoId}`);
            }
            validados.push({
                ...item,
                empresaId: produtoEmpresa.empresa_id,
                codigoOmie: produtoEmpresa.codigo_omie,
                precoUnitario: item.precoUnitario || parseFloat(produtoEmpresa.preco_venda?.toString() || '0'),
                ncm: produtoEmpresa.produto.ncm,
                cfop: produtoEmpresa.produto.cfop || undefined
            });
        }
        return validados;
    }
    agruparItensPorEmpresa(itens) {
        const agrupado = {};
        for (const item of itens) {
            if (!agrupado[item.empresaId]) {
                agrupado[item.empresaId] = [];
            }
            agrupado[item.empresaId].push(item);
        }
        return agrupado;
    }
    calcularValores(itens) {
        let produtos = 0;
        let desconto = 0;
        for (const item of itens) {
            const valorItem = item.quantidade * item.precoUnitario;
            const descontoItem = valorItem * ((item.percentualDesconto || 0) / 100);
            produtos += valorItem;
            desconto += descontoItem;
        }
        return {
            produtos,
            desconto,
            total: produtos - desconto
        };
    }
    async gerarNumeroPedido() {
        const ultimo = await prisma.pedido.findFirst({
            orderBy: { created_at: 'desc' }
        });
        const numero = ultimo
            ? (parseInt(ultimo.numero) + 1).toString().padStart(6, '0')
            : '000001';
        return numero;
    }
    async criarPedidoOmie(pedido, empresaId, itens) {
        const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
        if (!empresa)
            throw new Error('Empresa não encontrada');
        const clienteOmieId = await this.clienteService.obterCodigoOmie(pedido.cliente_id, empresaId);
        const omieService = this.omieIntegration.getPedidoService({
            id: empresa.id,
            nome: empresa.nome,
            cnpj: empresa.cnpj,
            nomeFantasia: empresa.nome_fantasia || undefined,
            appKey: empresa.app_key,
            appSecret: empresa.app_secret,
            ativa: empresa.ativa,
            configuracoes: empresa.configuracoes,
            createdAt: empresa.created_at,
            updatedAt: empresa.updated_at
        });
        const payload = {
            cabecalho: {
                codigo_cliente: parseInt(clienteOmieId),
                codigo_pedido_integracao: `ERP_${pedido.id}_${empresaId}`,
                data_previsao: format(pedido.data_previsao || addDays(new Date(), 7), 'yyyy-MM-dd'),
                numero_pedido: `${pedido.numero}-${empresaId.slice(0, 4)}`,
                codigo_parcela: '000',
                quantidade_itens: itens.length,
                valor_total: itens.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0),
                obs: `Pedido ERP: ${pedido.numero}`
            },
            det: itens.map(item => ({
                ide: {
                    codigo_produto: parseInt(item.produtoEmpresa?.codigo_omie || '0'),
                    quantidade: item.quantidade
                },
                produto: {
                    valor_unitario: item.preco_unitario,
                    valor_total: item.quantidade * item.preco_unitario
                }
            }))
        };
        return await omieService.incluir(payload);
    }
    async faturarPedidoOmie(pedidoEmpresa) {
        const omieService = this.omieIntegration.getPedidoService({
            id: pedidoEmpresa.empresa.id,
            nome: pedidoEmpresa.empresa.nome,
            cnpj: pedidoEmpresa.empresa.cnpj,
            nomeFantasia: pedidoEmpresa.empresa.nome_fantasia || undefined,
            appKey: pedidoEmpresa.empresa.app_key,
            appSecret: pedidoEmpresa.empresa.app_secret,
            ativa: pedidoEmpresa.empresa.ativa,
            configuracoes: pedidoEmpresa.empresa.configuracoes,
            createdAt: pedidoEmpresa.empresa.created_at,
            updatedAt: pedidoEmpresa.empresa.updated_at
        });
        await omieService.faturar(pedidoEmpresa.codigo_pedido_omie);
        const nfeService = this.omieIntegration.getNfeService({
            id: pedidoEmpresa.empresa.id,
            nome: pedidoEmpresa.empresa.nome,
            cnpj: pedidoEmpresa.empresa.cnpj,
            nomeFantasia: pedidoEmpresa.empresa.nome_fantasia || undefined,
            appKey: pedidoEmpresa.empresa.app_key,
            appSecret: pedidoEmpresa.empresa.app_secret,
            ativa: pedidoEmpresa.empresa.ativa,
            configuracoes: pedidoEmpresa.empresa.configuracoes,
            createdAt: pedidoEmpresa.empresa.created_at,
            updatedAt: pedidoEmpresa.empresa.updated_at
        });
        const notaFiscal = await nfeService.consultarPorPedido(pedidoEmpresa.codigo_pedido_omie);
        if (notaFiscal) {
            await prisma.notaFiscal.create({
                data: {
                    pedido_id: pedidoEmpresa.pedido_id,
                    empresa_id: pedidoEmpresa.empresa_id,
                    numero: notaFiscal.cabecalho.numero,
                    serie: notaFiscal.cabecalho.serie,
                    chave_acesso: notaFiscal.cabecalho.chave_nfe,
                    protocolo: notaFiscal.informacoes.protocolo,
                    data_emissao: new Date(notaFiscal.cabecalho.data_emissao),
                    data_saida: notaFiscal.cabecalho.data_saida ? new Date(notaFiscal.cabecalho.data_saida) : null,
                    valor_produtos: notaFiscal.cabecalho.valor_produtos,
                    valor_desconto: 0,
                    valor_total: notaFiscal.cabecalho.valor_total,
                    xml_url: notaFiscal.informacoes.url_xml,
                    pdf_url: notaFiscal.informacoes.url_danfe,
                    status: 'EMITIDA',
                    dados_omie: notaFiscal
                }
            });
        }
        return notaFiscal;
    }
    async cancelarPedidoOmie(empresaId, codigoPedido, motivo) {
        const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
        if (!empresa)
            throw new Error('Empresa não encontrada');
        const omieService = this.omieIntegration.getPedidoService({
            id: empresa.id,
            nome: empresa.nome,
            cnpj: empresa.cnpj,
            nomeFantasia: empresa.nome_fantasia || undefined,
            appKey: empresa.app_key,
            appSecret: empresa.app_secret,
            ativa: empresa.ativa,
            configuracoes: empresa.configuracoes,
            createdAt: empresa.created_at,
            updatedAt: empresa.updated_at
        });
        await omieService.cancelar(codigoPedido, motivo);
    }
    mapToEntity(pedido) {
        return {
            id: pedido.id,
            numero: pedido.numero,
            clienteId: pedido.cliente_id,
            status: pedido.status,
            substatus: pedido.substatus || undefined,
            valorProdutos: parseFloat(pedido.valor_produtos?.toString() || '0'),
            valorDesconto: parseFloat(pedido.valor_desconto?.toString() || '0'),
            valorFrete: parseFloat(pedido.valor_frete?.toString() || '0'),
            valorTotal: parseFloat(pedido.valor_total?.toString() || '0'),
            enderecoEntrega: pedido.endereco_entrega || undefined,
            dataPrevisao: pedido.data_previsao || undefined,
            formaPagamento: pedido.forma_pagamento || undefined,
            condicaoPagamento: pedido.condicao_pagamento || undefined,
            observacoes: pedido.observacoes || undefined,
            observacaoInterna: pedido.observacao_interna || undefined,
            usuarioId: pedido.usuario_id || undefined,
            itens: pedido.itens?.map((item) => ({
                id: item.id,
                pedidoId: item.pedido_id,
                produtoId: item.produto_id,
                produto: item.produto ? {
                    id: item.produto.id,
                    codigo: item.produto.codigo,
                    descricao: item.produto.descricao,
                    descricaoComplementar: item.produto.descricao_complementar || undefined,
                    ncm: item.produto.ncm,
                    cest: item.produto.cest || undefined,
                    cfop: item.produto.cfop || undefined,
                    unidade: item.produto.unidade,
                    precoBase: item.produto.preco_base ? parseFloat(item.produto.preco_base.toString()) : undefined,
                    tipo: item.produto.tipo,
                    ativo: item.produto.ativo,
                    createdAt: item.produto.created_at,
                    updatedAt: item.produto.updated_at
                } : undefined,
                empresaId: item.empresa_id,
                empresa: item.produtoEmpresa?.empresa ? {
                    id: item.produtoEmpresa.empresa.id,
                    nome: item.produtoEmpresa.empresa.nome,
                    cnpj: item.produtoEmpresa.empresa.cnpj,
                    nomeFantasia: item.produtoEmpresa.empresa.nome_fantasia || undefined,
                    appKey: item.produtoEmpresa.empresa.app_key,
                    appSecret: item.produtoEmpresa.empresa.app_secret,
                    ativa: item.produtoEmpresa.empresa.ativa,
                    configuracoes: item.produtoEmpresa.empresa.configuracoes,
                    createdAt: item.produtoEmpresa.empresa.created_at,
                    updatedAt: item.produtoEmpresa.empresa.updated_at
                } : undefined,
                quantidade: parseFloat(item.quantidade?.toString() || '0'),
                precoUnitario: parseFloat(item.preco_unitario?.toString() || '0'),
                valorTotal: parseFloat(item.valor_total?.toString() || '0'),
                percentualDesconto: parseFloat(item.percentual_desconto?.toString() || '0'),
                valorDesconto: parseFloat(item.valor_desconto?.toString() || '0'),
                sequencia: item.sequencia,
                ncm: item.ncm || undefined,
                cfop: item.cfop || undefined
            })) || [],
            pedidosEmpresa: pedido.pedidoEmpresas?.map((pe) => ({
                id: pe.id,
                pedidoId: pe.pedido_id,
                empresaId: pe.empresa_id,
                empresa: pe.empresa ? {
                    id: pe.empresa.id,
                    nome: pe.empresa.nome,
                    cnpj: pe.empresa.cnpj,
                    nomeFantasia: pe.empresa.nome_fantasia || undefined,
                    appKey: pe.empresa.app_key,
                    appSecret: pe.empresa.app_secret,
                    ativa: pe.empresa.ativa,
                    configuracoes: pe.empresa.configuracoes,
                    createdAt: pe.empresa.created_at,
                    updatedAt: pe.empresa.updated_at
                } : undefined,
                codigoPedidoOmie: pe.codigo_pedido_omie || undefined,
                numeroPedidoOmie: pe.numero_pedido_omie || undefined,
                statusOmie: pe.status_omie || undefined,
                valorItens: pe.valor_itens ? parseFloat(pe.valor_itens.toString()) : undefined,
                valorTotal: pe.valor_total ? parseFloat(pe.valor_total.toString()) : undefined,
                respostaOmie: pe.resposta_omie,
                tentativas: pe.tentativas,
                ultimoErro: pe.ultimo_erro || undefined,
                createdAt: pe.created_at,
                updatedAt: pe.updated_at
            })) || [],
            notasFiscais: pedido.notasFiscais?.map((nf) => ({
                id: nf.id,
                pedidoId: nf.pedido_id,
                empresaId: nf.empresa_id,
                empresa: nf.empresa ? {
                    id: nf.empresa.id,
                    nome: nf.empresa.nome,
                    cnpj: nf.empresa.cnpj,
                    nomeFantasia: nf.empresa.nome_fantasia || undefined,
                    appKey: nf.empresa.app_key,
                    appSecret: nf.empresa.app_secret,
                    ativa: nf.empresa.ativa,
                    configuracoes: nf.empresa.configuracoes,
                    createdAt: nf.empresa.created_at,
                    updatedAt: nf.empresa.updated_at
                } : undefined,
                numero: nf.numero,
                serie: nf.serie,
                chaveAcesso: nf.chave_acesso,
                protocolo: nf.protocolo || undefined,
                dataEmissao: nf.data_emissao,
                dataSaida: nf.data_saida || undefined,
                valorProdutos: parseFloat(nf.valor_produtos?.toString() || '0'),
                valorDesconto: parseFloat(nf.valor_desconto?.toString() || '0'),
                valorTotal: parseFloat(nf.valor_total?.toString() || '0'),
                xmlUrl: nf.xml_url || undefined,
                pdfUrl: nf.pdf_url || undefined,
                status: nf.status,
                motivoCancelamento: nf.motivo_cancelamento || undefined,
                dadosOmie: nf.dados_omie,
                createdAt: nf.created_at,
                updatedAt: nf.updated_at
            })) || [],
            processadoAt: pedido.processado_at || undefined,
            faturadoAt: pedido.faturado_at || undefined,
            createdAt: pedido.created_at,
            updatedAt: pedido.updated_at
        };
    }
}
//# sourceMappingURL=PedidoService.js.map
import { sql } from '../config/database.js';
import { OmieIntegrationService } from '../integrations/OmieServices.js';
import { ClienteService } from './ClienteService.js';
import { ProdutoService } from './ProdutoService.js';
import { Pedido, PedidoItem, PedidoEmpresa, PedidoStatus, Endereco } from '../entities/index.js';
import { format, addDays } from 'date-fns';

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

export class PedidoService {
  private omieIntegration: OmieIntegrationService;
  private clienteService: ClienteService;
  private produtoService: ProdutoService;

  constructor() {
    this.omieIntegration = new OmieIntegrationService();
    this.clienteService = new ClienteService();
    this.produtoService = new ProdutoService();
  }

  async criarPedido(dados: CreatePedidoDTO): Promise<Pedido> {
    const cliente = await sql`SELECT * FROM clientes WHERE id = ${dados.clienteId} LIMIT 1`;
    if (!cliente.length) throw new Error('Cliente não encontrado');

    const numeroPedido = await this.gerarNumeroPedido();
    const valores = this.calcularValores(dados.itens);

    const pedido = await sql`
      INSERT INTO pedidos (numero, cliente_id, status, valor_produtos, valor_desconto, valor_frete, valor_total,
        endereco_entrega, data_previsao, forma_pagamento, condicao_pagamento, observacoes, observacao_interna, usuario_id)
      VALUES (${numeroPedido}, ${dados.clienteId}, 'RASCUNHO', ${valores.produtos}, ${valores.desconto}, 0, ${valores.total},
        ${JSON.stringify(dados.enderecoEntrega)}, ${dados.dataPrevisao || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}, 
        ${dados.formaPagamento}, ${dados.condicaoPagamento}, ${dados.observacoes}, ${dados.observacaoInterna}, ${dados.usuarioId})
      RETURNING *
    `;

    return this.mapToEntity(pedido[0]);
  }

  async processarPedido(pedidoId: string): Promise<Pedido> {
    const pedido = await sql`SELECT * FROM pedidos WHERE id = ${pedidoId} LIMIT 1`;
    if (!pedido.length) throw new Error('Pedido não encontrado');

    await sql`UPDATE pedidos SET status = 'PROCESSANDO' WHERE id = ${pedidoId}`;
    
    const pedidoAtualizado = await sql`SELECT * FROM pedidos WHERE id = ${pedidoId} LIMIT 1`;
    return this.mapToEntity(pedidoAtualizado[0]);
  }

  async faturarPedido(pedidoId: string): Promise<Pedido> {
    const pedido = await sql`SELECT * FROM pedidos WHERE id = ${pedidoId} LIMIT 1`;
    if (!pedido.length) throw new Error('Pedido não encontrado');

    await sql`UPDATE pedidos SET status = 'CONCLUIDO', faturado_at = NOW() WHERE id = ${pedidoId}`;
    
    const pedidoAtualizado = await sql`SELECT * FROM pedidos WHERE id = ${pedidoId} LIMIT 1`;
    return this.mapToEntity(pedidoAtualizado[0]);
  }

  async obterPedido(id: string): Promise<Pedido | null> {
    const pedido = await sql`SELECT * FROM pedidos WHERE id = ${id} LIMIT 1`;
    if (!pedido.length) return null;
    return this.mapToEntity(pedido[0]);
  }

  async listarPedidos(skip: number = 0, take: number = 50, filtros?: { status?: string; clienteId?: string }): Promise<Pedido[]> {
    let pedidos;
    if (filtros?.status) {
      pedidos = await sql`SELECT * FROM pedidos WHERE status = ${filtros.status} ORDER BY created_at DESC LIMIT ${take} OFFSET ${skip}`;
    } else if (filtros?.clienteId) {
      pedidos = await sql`SELECT * FROM pedidos WHERE cliente_id = ${filtros.clienteId} ORDER BY created_at DESC LIMIT ${take} OFFSET ${skip}`;
    } else {
      pedidos = await sql`SELECT * FROM pedidos ORDER BY created_at DESC LIMIT ${take} OFFSET ${skip}`;
    }
    return pedidos.map((p: any) => this.mapToEntity(p));
  }

  private async gerarNumeroPedido(): Promise<string> {
    const ultimo = await sql`SELECT * FROM pedidos ORDER BY created_at DESC LIMIT 1`;
    const numero = ultimo.length ? parseInt(ultimo[0].numero) + 1 : 1;
    return numero.toString().padStart(6, '0');
  }

  private calcularValores(itens: CreatePedidoItemDTO[]): { produtos: number; desconto: number; total: number } {
    const produtos = itens.reduce((sum, item) => sum + (item.quantidade * (item.precoUnitario || 0)), 0);
    const desconto = itens.reduce((sum, item) => sum + (item.quantidade * (item.precoUnitario || 0) * (item.percentualDesconto || 0) / 100), 0);
    return { produtos, desconto, total: produtos - desconto };
  }

  private mapToEntity(pedido: any): Pedido {
    return {
      id: pedido.id,
      numero: pedido.numero,
      clienteId: pedido.cliente_id,
      status: pedido.status,
      substatus: pedido.substatus,
      valorProdutos: pedido.valor_produtos,
      valorDesconto: pedido.valor_desconto,
      valorFrete: pedido.valor_frete,
      valorTotal: pedido.valor_total,
      enderecoEntrega: pedido.endereco_entrega,
      dataPrevisao: pedido.data_previsao,
      formaPagamento: pedido.forma_pagamento,
      condicaoPagamento: pedido.condicao_pagamento,
      observacoes: pedido.observacoes,
      observacaoInterna: pedido.observacao_interna,
      usuarioId: pedido.usuario_id,
      itens: [],
      pedidosEmpresa: [],
      notasFiscais: [],
      processadoAt: pedido.processado_at,
      faturadoAt: pedido.faturado_at,
      createdAt: pedido.created_at,
      updatedAt: pedido.updated_at
    };
  }
}

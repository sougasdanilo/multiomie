import { Request, Response } from 'express';
import { PedidoService, CreatePedidoDTO } from '../services/PedidoService.js';

export class PedidoController {
  private pedidoService: PedidoService;

  constructor() {
    this.pedidoService = new PedidoService();
  }

  async criar(req: Request, res: Response): Promise<void> {
    try {
      const dados: CreatePedidoDTO = req.body;
      const pedido = await this.pedidoService.criarPedido(dados);
      
      res.status(201).json({
        success: true,
        data: pedido
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async processar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, error: 'ID do pedido é obrigatório' });
        return;
      }
      const pedido = await this.pedidoService.processarPedido(id);
      
      res.json({
        success: true,
        data: pedido,
        message: 'Pedido processado com sucesso em todas as empresas'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async faturar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, error: 'ID do pedido é obrigatório' });
        return;
      }
      const pedido = await this.pedidoService.faturarPedido(id);
      
      res.json({
        success: true,
        data: pedido,
        message: 'Pedido faturado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;
      const status = req.query.status as string;
      const clienteId = req.query.clienteId as string;
      
      const pedidos = await this.pedidoService.listarPedidos(skip, take, {
        status,
        clienteId
      });
      
      res.json({
        success: true,
        data: pedidos,
        meta: { skip, take, filtros: { status, clienteId } }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, error: 'ID do pedido é obrigatório' });
        return;
      }
      const pedido = await this.pedidoService.obterPedido(id);
      
      if (!pedido) {
        res.status(404).json({
          success: false,
          error: 'Pedido não encontrado'
        });
        return;
      }
      
      res.json({
        success: true,
        data: pedido
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

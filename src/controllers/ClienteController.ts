import { Request, Response } from 'express';
import { ClienteService } from '../services/ClienteService.js';

export class ClienteController {
  private clienteService: ClienteService;

  constructor() {
    this.clienteService = new ClienteService();
  }

  async criar(req: Request, res: Response): Promise<void> {
    try {
      const resultado = await this.clienteService.cadastrarCliente(req.body);
      res.status(201).json({
        success: true,
        data: {
          cliente: resultado.cliente,
          sincronizacoes: resultado.sincronizacoes
        }
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
      
      const clientes = await this.clienteService.listarClientes(skip, take);
      
      res.json({
        success: true,
        data: clientes,
        meta: { skip, take }
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
        res.status(400).json({ success: false, error: 'ID do cliente é obrigatório' });
        return;
      }
      const cliente = await this.clienteService.obterCliente(id);
      
      if (!cliente) {
        res.status(404).json({
          success: false,
          error: 'Cliente não encontrado'
        });
        return;
      }
      
      res.json({
        success: true,
        data: cliente
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async obterPorCpfCnpj(req: Request, res: Response): Promise<void> {
    try {
      const { cpfCnpj } = req.params;
      if (!cpfCnpj) {
        res.status(400).json({ success: false, error: 'CPF/CNPJ é obrigatório' });
        return;
      }
      const cliente = await this.clienteService.obterClientePorCpfCnpj(cpfCnpj);
      
      if (!cliente) {
        res.status(404).json({
          success: false,
          error: 'Cliente não encontrado'
        });
        return;
      }
      
      res.json({
        success: true,
        data: cliente
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async reprocessarSincronizacoes(req: Request, res: Response): Promise<void> {
    try {
      const resultado = await this.clienteService.reprocessarPendentes();
      res.json({
        success: true,
        data: resultado
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

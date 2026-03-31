import { Request, Response } from 'express';
import { ProdutoService } from '../services/ProdutoService.js';

export class ProdutoController {
  private produtoService: ProdutoService;

  constructor() {
    this.produtoService = new ProdutoService();
  }

  async sincronizarEmpresa(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      if (!empresaId) {
        res.status(400).json({ success: false, error: 'ID da empresa é obrigatório' });
        return;
      }
      const resultado = await this.produtoService.sincronizarProdutosEmpresa(empresaId);
      
      res.json({
        success: true,
        data: resultado,
        message: `Sincronização concluída para empresa ${empresaId}`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async listarPorEmpresa(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      if (!empresaId) {
        res.status(400).json({ success: false, error: 'ID da empresa é obrigatório' });
        return;
      }
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;
      
      const produtos = await this.produtoService.listarProdutosEmpresa(empresaId, skip, take);
      
      res.json({
        success: true,
        data: produtos,
        meta: { skip, take }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async consultarEstoque(req: Request, res: Response): Promise<void> {
    try {
      const { produtoId, empresaId } = req.params;
      if (!produtoId || !empresaId) {
        res.status(400).json({ success: false, error: 'ID do produto e ID da empresa são obrigatórios' });
        return;
      }
      const estoque = await this.produtoService.consultarEstoque(produtoId, empresaId);
      
      res.json({
        success: true,
        data: estoque
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

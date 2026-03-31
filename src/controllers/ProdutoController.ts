import { Request, Response } from 'express';
import { ProdutoService } from '../services/ProdutoService';

export class ProdutoController {
  private produtoService: ProdutoService;

  constructor() {
    this.produtoService = new ProdutoService();
  }

  async sincronizarEmpresa(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
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

import { Request, Response } from 'express';
export declare class SincronizacaoController {
    private omieIntegration;
    constructor();
    sincronizarProdutos(req: Request, res: Response): Promise<void>;
    processarPedidoAsync(req: Request, res: Response): Promise<void>;
    faturarPedidoAsync(req: Request, res: Response): Promise<void>;
    sincronizarClientesTodasEmpresas(req: Request, res: Response): Promise<void>;
    atualizarEstoqueEmpresa(req: Request, res: Response): Promise<void>;
    obterStatusFilas(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=SincronizacaoController.d.ts.map
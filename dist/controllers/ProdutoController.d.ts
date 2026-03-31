import { Request, Response } from 'express';
export declare class ProdutoController {
    private produtoService;
    constructor();
    sincronizarEmpresa(req: Request, res: Response): Promise<void>;
    listarPorEmpresa(req: Request, res: Response): Promise<void>;
    consultarEstoque(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ProdutoController.d.ts.map
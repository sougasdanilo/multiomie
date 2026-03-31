import { Request, Response } from 'express';
export declare class PedidoController {
    private pedidoService;
    constructor();
    criar(req: Request, res: Response): Promise<void>;
    processar(req: Request, res: Response): Promise<void>;
    faturar(req: Request, res: Response): Promise<void>;
    listar(req: Request, res: Response): Promise<void>;
    obterPorId(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=PedidoController.d.ts.map
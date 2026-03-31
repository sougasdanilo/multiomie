import { Request, Response } from 'express';
export declare class ClienteController {
    private clienteService;
    constructor();
    criar(req: Request, res: Response): Promise<void>;
    listar(req: Request, res: Response): Promise<void>;
    obterPorId(req: Request, res: Response): Promise<void>;
    obterPorCpfCnpj(req: Request, res: Response): Promise<void>;
    reprocessarSincronizacoes(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ClienteController.d.ts.map
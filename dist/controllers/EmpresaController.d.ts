import { Request, Response } from 'express';
export declare class EmpresaController {
    private empresaService;
    constructor();
    criar(req: Request, res: Response): Promise<void>;
    listar(req: Request, res: Response): Promise<void>;
    obterPorId(req: Request, res: Response): Promise<void>;
    atualizar(req: Request, res: Response): Promise<void>;
    desativar(req: Request, res: Response): Promise<void>;
    testarConexao(req: Request, res: Response): Promise<void>;
    obterEstatisticas(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=EmpresaController.d.ts.map
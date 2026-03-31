import { Request, Response } from 'express';
export declare class DashboardController {
    private omieIntegration;
    constructor();
    getResumo(req: Request, res: Response): Promise<void>;
    getStatusIntegracao(req: Request, res: Response): Promise<void>;
    getCircuitBreakerStatus(req: Request, res: Response): Promise<void>;
    getPedidosRecentes(req: Request, res: Response): Promise<void>;
    getNotasFiscaisRecentes(req: Request, res: Response): Promise<void>;
    getSystemStatus(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=DashboardController.d.ts.map
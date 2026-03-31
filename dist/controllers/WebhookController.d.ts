import { Request, Response } from 'express';
export declare class WebhookController {
    private omieIntegration;
    constructor();
    handleNfeEmitida(req: Request, res: Response): Promise<void>;
    handlePedidoFaturado(req: Request, res: Response): Promise<void>;
    private verificarConclusaoFaturamento;
}
//# sourceMappingURL=WebhookController.d.ts.map
import { Request, Response, NextFunction } from 'express';
export declare const logger: any;
export interface LoggedRequest extends Request {
    id: string;
    startTime: number;
}
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
export declare function errorLogger(err: Error, req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=logger.d.ts.map
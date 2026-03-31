import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare function generateToken(payload: {
    id: string;
    email: string;
    role: string;
}): string;
export declare function generateRefreshToken(payload: {
    id: string;
}): string;
export declare function verifyToken(token: string): {
    id: string;
    email: string;
    role: string;
};
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requireRole(roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map
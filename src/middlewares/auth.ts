import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

export function generateToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn']
  });
}

export function generateRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
  });
}

export function verifyToken(token: string): { id: string; email: string; role: string } {
  return jwt.verify(token, JWT_SECRET as jwt.Secret) as { id: string; email: string; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido'
    });
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    res.status(401).json({
      success: false,
      error: 'Token mal formatado'
    });
    return;
  }

  const [scheme, token] = parts;

  if (!scheme || !token || !/^Bearer$/i.test(scheme)) {
    res.status(401).json({
      success: false,
      error: 'Token mal formatado'
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado'
    });
    return;
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Permissão insuficiente'
      });
      return;
    }

    next();
  };
}

import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m')
    });
}
export function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d')
    });
}
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
export function authMiddleware(req, res, next) {
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
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Token inválido ou expirado'
        });
        return;
    }
}
export function requireRole(roles) {
    return (req, res, next) => {
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
//# sourceMappingURL=auth.js.map
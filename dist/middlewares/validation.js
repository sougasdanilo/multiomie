import { ZodError } from 'zod';
export function validateBody(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }));
                res.status(400).json({
                    success: false,
                    error: 'Dados inválidos',
                    details: errors
                });
                return;
            }
            res.status(400).json({
                success: false,
                error: 'Erro de validação'
            });
        }
    };
}
export function validateParams(schema) {
    return (req, res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }));
                res.status(400).json({
                    success: false,
                    error: 'Parâmetros inválidos',
                    details: errors
                });
                return;
            }
            res.status(400).json({
                success: false,
                error: 'Erro de validação de parâmetros'
            });
        }
    };
}
export function validateQuery(schema) {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }));
                res.status(400).json({
                    success: false,
                    error: 'Query params inválidos',
                    details: errors
                });
                return;
            }
            res.status(400).json({
                success: false,
                error: 'Erro de validação de query params'
            });
        }
    };
}
//# sourceMappingURL=validation.js.map
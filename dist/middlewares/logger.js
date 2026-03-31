import pino from 'pino';
import { randomUUID } from 'crypto';
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.LOG_PRETTY === 'true' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    } : undefined,
    base: {
        pid: process.pid,
        env: process.env.NODE_ENV
    }
});
export function requestLogger(req, res, next) {
    const requestId = randomUUID();
    const startTime = Date.now();
    req.id = requestId;
    req.startTime = startTime;
    logger.info({
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    }, 'Request started');
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info({
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        }, 'Request completed');
    });
    next();
}
export function errorLogger(err, req, res, next) {
    logger.error({
        error: err.message,
        stack: err.stack,
        requestId: req.id,
        method: req.method,
        url: req.url
    }, 'Error occurred');
    next(err);
}
//# sourceMappingURL=logger.js.map
import { pino } from 'pino';
import { Request, Response, NextFunction } from 'express';
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

export interface LoggedRequest extends Request {
  id: string;
  startTime: number;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  const startTime = Date.now();
  
  (req as LoggedRequest).id = requestId;
  (req as LoggedRequest).startTime = startTime;
  
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

export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: (req as LoggedRequest).id,
    method: req.method,
    url: req.url
  }, 'Error occurred');

  next(err);
}

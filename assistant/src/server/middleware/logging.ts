import { Request, Response, NextFunction } from 'express';
import { createCategoryLogger } from '../../logger';

const logger = createCategoryLogger('HTTP');

export const requestLogging = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

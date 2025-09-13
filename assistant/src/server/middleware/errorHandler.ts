import { Request, Response, NextFunction } from 'express';
import { createCategoryLogger } from '../../logger';
import { ApiError } from '../../types/api';

const logger = createCategoryLogger('ERROR');

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  const apiError: ApiError = {
    error: error.name || 'InternalServerError',
    message: error.message || 'An unexpected error occurred',
    statusCode: 500,
    timestamp: new Date().toISOString()
  };

  res.status(apiError.statusCode).json(apiError);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const apiError: ApiError = {
    error: 'NotFound',
    message: `Route ${req.method} ${req.url} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString()
  };

  res.status(404).json(apiError);
};

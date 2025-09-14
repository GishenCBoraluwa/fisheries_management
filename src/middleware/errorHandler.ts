import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { ApiResponse } from '../types/index.js';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  logger.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query
  });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: {
        url: req.url,
        method: req.method
      }
    })
  } as ApiResponse);
};

export const notFound = (req: Request, res: Response): Response => {
  const message = `Route ${req.method} ${req.originalUrl} not found`;
  logger.warn(message);
  
  return res.status(404).json({
    success: false,
    message
  } as ApiResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
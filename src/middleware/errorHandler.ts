import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not Found';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = 'Conflict';
  } else if (error.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too Many Requests';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: getErrorName(statusCode),
    message: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

/**
 * Get error name from status code
 */
function getErrorName(statusCode: number): string {
  const errorNames: { [key: number]: string } = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  
  return errorNames[statusCode] || 'Unknown Error';
}

/**
 * Create custom API error
 */
export const createError = (message: string, statusCode: number = 500): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

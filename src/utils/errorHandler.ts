/**
 * Utility functions for error handling
 */

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Creates a standardized error object
 */
export function createError(message: string, statusCode: number = 500): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return getErrorMessage(error);
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Safely extracts error status code from unknown error type
 */
export function getErrorStatusCode(error: unknown): number {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as any).statusCode;
    if (typeof statusCode === 'number') {
      return statusCode;
    }
  }
  return 500;
}

/**
 * Checks if error is an operational error
 */
export function isOperationalError(error: unknown): boolean {
  return error instanceof Error && 
         'isOperational' in error && 
         (error as any).isOperational === true;
}

/**
 * Logs error with proper typing
 */
export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const statusCode = getErrorStatusCode(error);
  
  console.error(`[${context || 'ERROR'}] ${message}`, {
    statusCode,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
}

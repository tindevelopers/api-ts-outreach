import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

// Simple in-memory rate limiter (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = parseInt(process.env.API_RATE_LIMIT || '100');
const RATE_WINDOW_MS = parseInt(process.env.API_RATE_WINDOW_MS || '900000'); // 15 minutes

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    
    // Clean up expired entries
    cleanupExpiredEntries(now);
    
    // Get or create client data
    let clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      // Reset or create new window
      clientData = {
        count: 0,
        resetTime: now + RATE_WINDOW_MS
      };
      requestCounts.set(clientId, clientData);
    }
    
    // Check if limit exceeded
    if (clientData.count >= RATE_LIMIT) {
      logger.warn('Rate limit exceeded', {
        clientId,
        count: clientData.count,
        limit: RATE_LIMIT,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    // Increment count
    clientData.count++;
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': RATE_LIMIT.toString(),
      'X-RateLimit-Remaining': (RATE_LIMIT - clientData.count).toString(),
      'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
    });
    
    next();
  } catch (error) {
    logger.error('Rate limiter error', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip
    });
    
    // If rate limiter fails, allow request to proceed
    next();
  }
};

/**
 * Get unique identifier for rate limiting
 */
function getClientIdentifier(req: Request): string {
  // Try to get user ID from authenticated request first
  const user = (req as any).user;
  if (user?.id) {
    return `user:${user.id}`;
  }
  
  // Fall back to IP address
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(now: number): void {
  for (const [clientId, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(clientId);
    }
  }
}

/**
 * Reset rate limit for specific client
 */
export const resetRateLimit = (clientId: string): void => {
  requestCounts.delete(clientId);
};

/**
 * Get current rate limit status for client
 */
export const getRateLimitStatus = (req: Request): {
  limit: number;
  remaining: number;
  resetTime: number;
} | null => {
  const clientId = getClientIdentifier(req);
  const clientData = requestCounts.get(clientId);
  
  if (!clientData) {
    return {
      limit: RATE_LIMIT,
      remaining: RATE_LIMIT,
      resetTime: Date.now() + RATE_WINDOW_MS
    };
  }
  
  return {
    limit: RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - clientData.count),
    resetTime: clientData.resetTime
  };
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@/utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    apiKey: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No authorization header provided',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }

    // For API key authentication (simple token)
    if (token.length > 50) {
      // This is likely an API key, validate it
      const user = validateApiKey(token);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid API key',
          timestamp: new Date().toISOString()
        });
      }
      
      req.user = user;
      return next();
    }

    // For JWT authentication
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      apiKey: decoded.apiKey
    };

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Validate API key (in production, this should check against database)
 */
function validateApiKey(apiKey: string): { id: string; email: string; apiKey: string } | null {
  // TODO: Implement actual API key validation against database
  // For now, this is a placeholder that accepts any key starting with 'ak_'
  
  if (!apiKey.startsWith('ak_')) {
    return null;
  }

  // Mock user data - replace with actual database lookup
  return {
    id: 'user_' + apiKey.slice(3, 15), // Extract user ID from API key
    email: `user_${apiKey.slice(3, 15)}@example.com`,
    apiKey: apiKey
  };
}

/**
 * Generate JWT token for user
 */
export const generateToken = (user: { id: string; email: string; apiKey: string }): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      apiKey: user.apiKey
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * Generate API key for user
 */
export const generateApiKey = (userId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `ak_${timestamp}${random}`;
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@/utils/logger';
import { getErrorMessage, logError } from '@/utils/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    apiKey: string;
  };
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    // For Google IAM authentication (longer tokens)
    if (token.length > 100) {
      // This is likely a Google IAM token, validate it
      const user = await validateGoogleIAMToken(token);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid Google IAM token',
          timestamp: new Date().toISOString()
        });
      }
      
      req.user = user;
      next();
    }

    // For API key authentication (shorter tokens)
    if (token.length > 20) {
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
      next();
    }

    // For JWT authentication
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'JWT configuration error',
        timestamp: new Date().toISOString()
      });
    }
    
    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      apiKey: decoded.apiKey
    };

    next();
  } catch (error) {
    logError(error, 'Authentication failed');
    logger.error('Authentication failed', {
      error: getErrorMessage(error),
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
  
  // This should never be reached, but TypeScript needs it
  return;
};

/**
 * Validate API key using Google IAM or simple validation
 */
function validateApiKey(apiKey: string): { id: string; email: string; apiKey: string } | null {
  // For Google Cloud Run with IAM, we can use Google's built-in authentication
  // This is a simplified version for demo purposes
  
  if (!apiKey.startsWith('ak_')) {
    return null;
  }

  // In production with Google IAM, you would:
  // 1. Verify the token with Google's OAuth 2.0 API
  // 2. Extract user information from the verified token
  // 3. Check user permissions against IAM policies
  
  // For now, return mock user data
  return {
    id: `user_${  apiKey.slice(3, 15)}`, // Extract user ID from API key
    email: `user_${apiKey.slice(3, 15)}@example.com`,
    apiKey
  };
}

/**
 * Validate Google IAM token (for production use)
 */
async function validateGoogleIAMToken(token: string): Promise<{ id: string; email: string; apiKey: string } | null> {
  try {
    // In production, you would verify the token with Google's API
    // const { OAuth2Client } = require('google-auth-library');
    // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({
    //   idToken: token,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });
    // const payload = ticket.getPayload();
    
    // For demo purposes, return mock data
    return {
      id: 'google_user_123',
      email: 'user@example.com',
      apiKey: token
    };
  } catch (error) {
    logError(error, 'Failed to validate Google IAM token');
    return null;
  }
}

/**
 * Generate JWT token for user
 */
export const generateToken = (user: { id: string; email: string; apiKey: string }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  const payload = {
    id: user.id,
    email: user.email,
    apiKey: user.apiKey
  };
  
  // @ts-ignore - Temporary fix for JWT type issue
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};

/**
 * Generate API key for user
 */
export const generateApiKey = (_userId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `ak_${timestamp}${random}`;
};

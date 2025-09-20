import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { rateLimiter } from '@/middleware/rateLimiter';
import { authMiddleware } from '@/middleware/auth';

// Import controllers
import { campaignController } from '@/controllers/campaignController';
import { leadController } from '@/controllers/leadController';
import { workflowController } from '@/controllers/workflowController';
import { analyticsController } from '@/controllers/analyticsController';
import { accountController } from '@/controllers/accountController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/v1/campaigns', authMiddleware, campaignController);
app.use('/api/v1/leads', authMiddleware, leadController);
app.use('/api/v1/workflows', authMiddleware, workflowController);
app.use('/api/v1/analytics', authMiddleware, analyticsController);
app.use('/api/v1/accounts', authMiddleware, accountController);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Outreach Service started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app };
export default app;

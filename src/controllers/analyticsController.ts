import { Request, Response, Router } from 'express';
import { getErrorMessage, logError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';
import { analyticsService } from '@/services/analyticsService';
import { ApiResponse } from '@/models/types';

const router = Router();

/**
 * Get campaign analytics
 * GET /api/v1/analytics/campaigns
 */
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const campaignId = req.query.campaignId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const platform = req.query.platform as string;

    const filters = {
      campaignId,
      startDate,
      endDate,
      platform,
      userId
    };

    const analytics = await analyticsService.getCampaignAnalytics(filters);

    res.status(200).json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to get campaign analytics', {
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve campaign analytics',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Get lead analytics
 * GET /api/v1/analytics/leads
 */
router.get('/leads', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const campaignId = req.query.campaignId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const filters = {
      campaignId,
      startDate,
      endDate,
      userId
    };

    const analytics = await analyticsService.getLeadAnalytics(filters);

    res.status(200).json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to get lead analytics', {
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve lead analytics',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Get campaign metrics summary
 * GET /api/v1/analytics/campaigns/metrics
 */
router.get('/campaigns/metrics', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const campaignId = req.query.campaignId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const filters = {
      campaignId,
      startDate,
      endDate,
      userId
    };

    const metrics = await analyticsService.getCampaignMetrics(filters);

    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to get campaign metrics', {
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve campaign metrics',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Get lead metrics summary
 * GET /api/v1/analytics/leads/metrics
 */
router.get('/leads/metrics', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const campaignId = req.query.campaignId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const filters = {
      campaignId,
      startDate,
      endDate,
      userId
    };

    const metrics = await analyticsService.getLeadMetrics(filters);

    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to get lead metrics', {
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve lead metrics',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Get platform metrics
 * GET /api/v1/analytics/platforms
 */
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const filters = {
      startDate,
      endDate,
      userId
    };

    const metrics = await analyticsService.getPlatformMetrics(filters);

    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to get platform metrics', {
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve platform metrics',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Get performance trends
 * GET /api/v1/analytics/trends
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const filters = {
      startDate,
      endDate,
      userId
    };

    const trends = await analyticsService.getPerformanceTrends(filters);

    res.status(200).json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to get performance trends', {
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve performance trends',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

export { router as analyticsController };

import { Request, Response, Router } from 'express';
import { getErrorMessage, logError } from '@/utils/errorHandler';
// import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { logger } from '@/utils/logger';
import { campaignService } from '@/services/campaignService';
import { 
  CreateCampaignRequest, 
  Campaign, 
  ApiResponse, 
  PaginatedResponse,
  CampaignStatus
} from '@/models/types';

const router = Router();

// Validation schemas
const createCampaignSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  platform: Joi.string().valid('linkedin', 'twitter', 'facebook', 'instagram').required(),
  settings: Joi.object({
    workingHours: Joi.object({
      start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      timezone: Joi.string().required(),
      weekdays: Joi.array().items(Joi.number().min(0).max(6)).required()
    }).required(),
    rateLimiting: Joi.object({
      maxConnectionsPerDay: Joi.number().min(1).max(1000).required(),
      maxMessagesPerDay: Joi.number().min(1).max(1000).required(),
      delayBetweenActions: Joi.number().min(1000).required()
    }).required(),
    personalization: Joi.object({
      useCustomMessages: Joi.boolean().required(),
      messageTemplates: Joi.array().items(Joi.string()).optional(),
      includeCompanyInfo: Joi.boolean().required()
    }).required()
  }).required()
});

const updateCampaignSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  settings: Joi.object({
    workingHours: Joi.object({
      start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      timezone: Joi.string().optional(),
      weekdays: Joi.array().items(Joi.number().min(0).max(6)).optional()
    }).optional(),
    rateLimiting: Joi.object({
      maxConnectionsPerDay: Joi.number().min(1).max(1000).optional(),
      maxMessagesPerDay: Joi.number().min(1).max(1000).optional(),
      delayBetweenActions: Joi.number().min(1000).optional()
    }).optional(),
    personalization: Joi.object({
      useCustomMessages: Joi.boolean().optional(),
      messageTemplates: Joi.array().items(Joi.string()).optional(),
      includeCompanyInfo: Joi.boolean().optional()
    }).optional()
  }).optional()
});

/**
 * Create a new campaign
 * POST /api/v1/campaigns
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = createCampaignSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details[0].message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    const userId = (req as any).user.id;
    const campaignData: CreateCampaignRequest = value;

    const campaign = await campaignService.createCampaign(userId, campaignData);

    logger.info('Campaign created successfully', {
      campaignId: campaign.id,
      userId,
      platform: campaign.platform
    });

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
    return;

  } catch (error) {
    logger.error('Failed to create campaign', {
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create campaign',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Get all campaigns for the authenticated user
 * GET /api/v1/campaigns
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as CampaignStatus | undefined;

    const result = await campaignService.getCampaigns(userId, {
      page,
      limit,
      status
    });

    res.status(200).json({
      success: true,
      data: result.campaigns,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      },
      timestamp: new Date().toISOString()
    } as PaginatedResponse<Campaign>);
    return;

  } catch (error) {
    logger.error('Failed to get campaigns', {
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve campaigns',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Get a specific campaign
 * GET /api/v1/campaigns/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const campaignId = req.params.id;

    const campaign = await campaignService.getCampaignById(userId, campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    res.status(200).json({
      success: true,
      data: campaign,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to get campaign', {
      campaignId: req.params.id,
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve campaign',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Update a campaign
 * PUT /api/v1/campaigns/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { error, value } = updateCampaignSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details[0].message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    const userId = (req as any).user.id;
    const campaignId = req.params.id;
    const updateData = value;

    const campaign = await campaignService.updateCampaign(userId, campaignId, updateData);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    logger.info('Campaign updated successfully', {
      campaignId,
      userId
    });

    res.status(200).json({
      success: true,
      data: campaign,
      message: 'Campaign updated successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to update campaign', {
      campaignId: req.params.id,
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update campaign',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Delete a campaign
 * DELETE /api/v1/campaigns/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const campaignId = req.params.id;

    const success = await campaignService.deleteCampaign(userId, campaignId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Campaign not found',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    logger.info('Campaign deleted successfully', {
      campaignId,
      userId
    });

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to delete campaign', {
      campaignId: req.params.id,
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete campaign',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Start a campaign
 * POST /api/v1/campaigns/:id/start
 */
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const campaignId = req.params.id;

    await campaignService.startCampaign(userId, campaignId);

    logger.info('Campaign started successfully', {
      campaignId,
      userId
    });

    res.status(200).json({
      success: true,
      message: 'Campaign started successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to start campaign', {
      campaignId: req.params.id,
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    const statusCode = getErrorMessage(error).includes('not found') ? 404 : 500;
    const message = getErrorMessage(error).includes('not found') 
      ? 'Campaign not found' 
      : 'Failed to start campaign';

    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
      message,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Pause a campaign
 * POST /api/v1/campaigns/:id/pause
 */
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const campaignId = req.params.id;

    await campaignService.pauseCampaign(userId, campaignId);

    logger.info('Campaign paused successfully', {
      campaignId,
      userId
    });

    res.status(200).json({
      success: true,
      message: 'Campaign paused successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to pause campaign', {
      campaignId: req.params.id,
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    const statusCode = getErrorMessage(error).includes('not found') ? 404 : 500;
    const message = getErrorMessage(error).includes('not found') 
      ? 'Campaign not found' 
      : 'Failed to pause campaign';

    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
      message,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

export { router as campaignController };

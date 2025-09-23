import { Request, Response, Router } from 'express';
import { getErrorMessage, logError } from '@/utils/errorHandler';
// import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { logger } from '@/utils/logger';
import { leadService } from '@/services/leadService';
import { 
  CreateLeadRequest, 
  Lead, 
  ApiResponse, 
  PaginatedResponse,
  LeadStatus 
} from '@/models/types';

const router = Router();

// Validation schemas
const createLeadSchema = Joi.object({
  email: Joi.string().email().optional(),
  name: Joi.string().min(1).max(255).optional(),
  company: Joi.string().max(255).optional(),
  profileUrl: Joi.string().uri().optional(),
  metadata: Joi.object().optional()
});

const updateLeadSchema = Joi.object({
  email: Joi.string().email().optional(),
  name: Joi.string().min(1).max(255).optional(),
  company: Joi.string().max(255).optional(),
  profileUrl: Joi.string().uri().optional(),
  metadata: Joi.object().optional(),
  status: Joi.string().valid('pending', 'processing', 'connected', 'messaged', 'replied', 'failed', 'skipped').optional()
});

/**
 * Create a new lead
 * POST /api/v1/leads
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = createLeadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details[0].message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    const _userId = (req as any).user.id;
    const campaignId = req.body.campaignId; // This should come from the request
    
    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Campaign ID is required',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    const leadData: CreateLeadRequest = value;
    const lead = await leadService.createLead(campaignId, leadData);

    logger.info('Lead created successfully', {
      leadId: lead.id,
      _userId,
      campaignId
    });

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to create lead', {
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create lead',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Get all leads for the authenticated user
 * GET /api/v1/leads
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const _userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as LeadStatus;
    const campaignId = req.query.campaignId as string;

    const result = await leadService.getLeads({
      page,
      limit,
      status,
      campaignId
    });

    res.status(200).json({
      success: true,
      data: result.leads,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      },
      timestamp: new Date().toISOString()
    } as PaginatedResponse<Lead>);
    return;

  } catch (error) {
    logger.error('Failed to get leads', {
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve leads',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Get a specific lead
 * GET /api/v1/leads/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const _userId = (req as any).user.id;
    const leadId = req.params.id;

    const lead = await leadService.getLeadById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Lead not found',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    res.status(200).json({
      success: true,
      data: lead,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to get lead', {
      leadId: req.params.id,
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve lead',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Update a lead
 * PUT /api/v1/leads/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { error, value } = updateLeadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details[0].message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    const _userId = (req as any).user.id;
    const leadId = req.params.id;
    const updateData = value;

    // TODO: Implement lead service
    const lead: Lead | null = null;

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Lead not found',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    logger.info('Lead updated successfully', {
      leadId,
      userId: (req as any).user.id
    });

    res.status(200).json({
      success: true,
      data: lead,
      message: 'Lead updated successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to update lead', {
      leadId: req.params.id,
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update lead',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

/**
 * Delete a lead
 * DELETE /api/v1/leads/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const _userId = (req as any).user.id;
    const leadId = req.params.id;

    // TODO: Implement lead service
    const success = false;

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Lead not found',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    return;
    }

    logger.info('Lead deleted successfully', {
      leadId,
      userId: (req as any).user.id
    });

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;

  } catch (error) {
    logger.error('Failed to delete lead', {
      leadId: req.params.id,
      error: getErrorMessage(error),
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete lead',
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }
});

export { router as leadController };

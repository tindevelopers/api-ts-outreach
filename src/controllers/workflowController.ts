import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { logger } from '@/utils/logger';
import { workflowService } from '@/services/workflowService';
import { 
  ApiResponse, 
  CreateWorkflowRequest, 
  Workflow, 
  PaginatedResponse,
  WorkflowStatus,
  WorkflowStep,
  WorkflowStepType
} from '@/models/types';

const router = Router();

// Validation schemas
const createWorkflowSchema = Joi.object({
  campaignId: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(255).required(),
  steps: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().required(),
      type: Joi.string().valid(...Object.values(WorkflowStepType)).required(),
      config: Joi.object().required(),
      order: Joi.number().min(1).required(),
      conditions: Joi.array().optional()
    })
  ).min(1).required(),
  settings: Joi.object({
    retryAttempts: Joi.number().min(0).max(10).required(),
    retryDelay: Joi.number().min(1000).required(),
    timeout: Joi.number().min(10000).required(),
    concurrency: Joi.number().min(1).max(20).required()
  }).required()
});

/**
 * Create a new workflow
 * POST /api/v1/workflows
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = createWorkflowSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details[0].message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const userId = (req as any).user.id;
    const { campaignId, ...workflowData } = value;

    // Validate workflow steps
    const validation = workflowService.validateWorkflowSteps(workflowData.steps);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: validation.errors.join(', '),
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const workflow = await workflowService.createWorkflow(campaignId, workflowData);

    logger.info('Workflow created successfully', {
      workflowId: workflow.id,
      userId,
      campaignId,
      stepCount: workflow.steps.length
    });

    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<Workflow>);

  } catch (error) {
    logger.error('Failed to create workflow', {
      error: error.message,
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create workflow',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * Get all workflows
 * GET /api/v1/workflows
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // TODO: Implement workflow listing
    res.status(200).json({
      success: true,
      data: [],
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    logger.error('Failed to get workflows', {
      error: error.message,
      userId: (req as any).user.id
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve workflows',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

export { router as workflowController };

import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { GrowChiefService } from '@/integrations/GrowChiefService';
import { 
  Workflow, 
  CreateWorkflowRequest, 
  WorkflowStatus, 
  WorkflowStep,
  WorkflowStepType,
  WorkflowSettings
} from '@/models/types';

export interface GetWorkflowsOptions {
  page: number;
  limit: number;
  status?: WorkflowStatus;
  campaignId?: string;
}

export interface GetWorkflowsResult {
  workflows: Workflow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class WorkflowService {
  private growChiefService: GrowChiefService;
  private workflows: Map<string, Workflow> = new Map(); // In-memory storage for demo

  constructor() {
    this.growChiefService = new GrowChiefService({
      endpoint: process.env.OUTREACH_API_ENDPOINT || 'http://localhost:8080',
      apiKey: process.env.OUTREACH_API_KEY || 'demo-key',
      timeout: 30000,
      retryAttempts: 3
    });
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(campaignId: string, data: CreateWorkflowRequest): Promise<Workflow> {
    const workflowId = uuidv4();
    
    const workflow: Workflow = {
      id: workflowId,
      campaignId,
      name: data.name,
      steps: data.steps,
      status: WorkflowStatus.DRAFT,
      settings: data.settings,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store workflow (in production, save to database)
    this.workflows.set(workflowId, workflow);

    logger.info('Workflow created', {
      workflowId,
      campaignId,
      name: workflow.name,
      stepCount: workflow.steps.length
    });

    return workflow;
  }

  /**
   * Get workflows with pagination and filtering
   */
  async getWorkflows(options: GetWorkflowsOptions): Promise<GetWorkflowsResult> {
    const { page, limit, status, campaignId } = options;
    
    // Filter workflows
    let filteredWorkflows = Array.from(this.workflows.values());

    if (campaignId) {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.campaignId === campaignId);
    }

    if (status) {
      filteredWorkflows = filteredWorkflows.filter(workflow => workflow.status === status);
    }

    // Sort by creation date (newest first)
    filteredWorkflows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate pagination
    const total = filteredWorkflows.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const workflows = filteredWorkflows.slice(startIndex, endIndex);

    return {
      workflows,
      page,
      limit,
      total,
      totalPages
    };
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflowById(workflowId: string): Promise<Workflow | null> {
    const workflow = this.workflows.get(workflowId);
    return workflow || null;
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(workflowId: string, updateData: Partial<CreateWorkflowRequest & { status: WorkflowStatus }>): Promise<Workflow | null> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      return null;
    }

    // Update workflow fields
    if (updateData.name !== undefined) workflow.name = updateData.name;
    if (updateData.steps !== undefined) workflow.steps = updateData.steps;
    if (updateData.settings !== undefined) workflow.settings = { ...workflow.settings, ...updateData.settings };
    if (updateData.status !== undefined) workflow.status = updateData.status;
    
    workflow.updatedAt = new Date();

    // Save updated workflow
    this.workflows.set(workflowId, workflow);

    logger.info('Workflow updated', {
      workflowId,
      updatedFields: Object.keys(updateData)
    });

    return workflow;
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      return false;
    }

    // Remove workflow
    this.workflows.delete(workflowId);

    logger.info('Workflow deleted', {
      workflowId,
      campaignId: workflow.campaignId
    });

    return true;
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.status !== WorkflowStatus.DRAFT) {
      throw new Error(`Cannot activate workflow with status: ${workflow.status}`);
    }

    // Update workflow status
    workflow.status = WorkflowStatus.ACTIVE;
    workflow.updatedAt = new Date();
    this.workflows.set(workflowId, workflow);

    try {
      // Create workflow in GrowChief
      await this.growChiefService.createWorkflow(workflow);
      
      logger.info('Workflow activated and sent to GrowChief', {
        workflowId,
        campaignId: workflow.campaignId
      });
    } catch (error) {
      // Revert status if GrowChief fails
      workflow.status = WorkflowStatus.DRAFT;
      workflow.updatedAt = new Date();
      this.workflows.set(workflowId, workflow);
      
      throw new Error(`Failed to activate workflow: ${error.message}`);
    }
  }

  /**
   * Pause a workflow
   */
  async pauseWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new Error(`Cannot pause workflow with status: ${workflow.status}`);
    }

    // Update workflow status
    workflow.status = WorkflowStatus.PAUSED;
    workflow.updatedAt = new Date();
    this.workflows.set(workflowId, workflow);

    logger.info('Workflow paused', {
      workflowId,
      campaignId: workflow.campaignId
    });
  }

  /**
   * Resume a paused workflow
   */
  async resumeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.status !== WorkflowStatus.PAUSED) {
      throw new Error(`Cannot resume workflow with status: ${workflow.status}`);
    }

    // Update workflow status
    workflow.status = WorkflowStatus.ACTIVE;
    workflow.updatedAt = new Date();
    this.workflows.set(workflowId, workflow);

    logger.info('Workflow resumed', {
      workflowId,
      campaignId: workflow.campaignId
    });
  }

  /**
   * Get workflows by campaign
   */
  async getWorkflowsByCampaign(campaignId: string, options: Omit<GetWorkflowsOptions, 'campaignId'>): Promise<GetWorkflowsResult> {
    return this.getWorkflows({
      ...options,
      campaignId
    });
  }

  /**
   * Create a default workflow for a campaign
   */
  async createDefaultWorkflow(campaignId: string, platform: string): Promise<Workflow> {
    const defaultSteps: WorkflowStep[] = [
      {
        id: uuidv4(),
        type: WorkflowStepType.CONNECT,
        config: {
          message: "Hi {{name}}, I'd like to connect with you on {{platform}}.",
          delay: 5000
        },
        order: 1
      },
      {
        id: uuidv4(),
        type: WorkflowStepType.MESSAGE,
        config: {
          message: "Thanks for connecting! I noticed you work at {{company}}. I'd love to learn more about your role.",
          delay: 10000
        },
        order: 2
      }
    ];

    const defaultSettings: WorkflowSettings = {
      retryAttempts: 3,
      retryDelay: 30000,
      timeout: 300000,
      concurrency: 5
    };

    const workflowData: CreateWorkflowRequest = {
      name: `Default ${platform} Workflow`,
      steps: defaultSteps,
      settings: defaultSettings
    };

    return this.createWorkflow(campaignId, workflowData);
  }

  /**
   * Validate workflow steps
   */
  validateWorkflowSteps(steps: WorkflowStep[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!steps || steps.length === 0) {
      errors.push('Workflow must have at least one step');
      return { valid: false, errors };
    }

    // Check for duplicate step orders
    const orders = steps.map(step => step.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      errors.push('Step orders must be unique');
    }

    // Validate each step
    steps.forEach((step, index) => {
      if (!step.id) {
        errors.push(`Step ${index + 1} must have an ID`);
      }
      if (!step.type || !Object.values(WorkflowStepType).includes(step.type)) {
        errors.push(`Step ${index + 1} must have a valid type`);
      }
      if (step.order < 1) {
        errors.push(`Step ${index + 1} must have an order greater than 0`);
      }
      if (!step.config || typeof step.config !== 'object') {
        errors.push(`Step ${index + 1} must have a valid config object`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const workflowService = new WorkflowService();

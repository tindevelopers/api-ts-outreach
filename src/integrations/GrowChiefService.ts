import { logger } from '@/utils/logger';
import { getErrorMessage, logError } from '@/utils/errorHandler';
import { 
  Campaign, 
  Lead, 
  Workflow, 
  CampaignSettings, 
  WorkflowSettings,
  WorkflowStep,
  LeadStatus,
  CampaignStatus
} from '@/models/types';

export interface GrowChiefConfig {
  endpoint: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface GrowChiefWorkflow {
  id: string;
  name: string;
  steps: GrowChiefStep[];
  settings: GrowChiefWorkflowSettings;
}

export interface GrowChiefStep {
  type: string;
  config: Record<string, any>;
  order: number;
  delay?: number;
}

export interface GrowChiefWorkflowSettings {
  concurrency: number;
  rateLimiting: {
    actionsPerHour: number;
    delayBetweenActions: number;
  };
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
}

export class GrowChiefService {
  private config: GrowChiefConfig;
  private baseUrl: string;

  constructor(config: GrowChiefConfig) {
    this.config = config;
    this.baseUrl = `${config.endpoint}/api/v1`;
  }

  /**
   * Create a new automation workflow in GrowChief
   */
  async createWorkflow(workflow: Workflow): Promise<string> {
    try {
      const growChiefWorkflow = this.mapToGrowChiefWorkflow(workflow);
      
      const response = await this.makeRequest('/workflows', {
        method: 'POST',
        body: JSON.stringify(growChiefWorkflow)
      });

      logger.info(`Created GrowChief workflow: ${response.id}`, {
        workflowId: workflow.id,
        growChiefWorkflowId: response.id
      });

      return response.id;
    } catch (error) {
      logger.error('Failed to create GrowChief workflow', {
        workflowId: workflow.id,
        error: getErrorMessage(error)
      });
      throw new Error(`Failed to create workflow: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Execute a campaign workflow
   */
  async executeCampaign(campaignId: string, workflowId: string): Promise<void> {
    try {
      await this.makeRequest(`/campaigns/${campaignId}/execute`, {
        method: 'POST',
        body: JSON.stringify({
          workflowId,
          executeAt: new Date().toISOString()
        })
      });

      logger.info(`Started campaign execution`, {
        campaignId,
        workflowId
      });
    } catch (error) {
      logger.error('Failed to execute campaign', {
        campaignId,
        workflowId,
        error: getErrorMessage(error)
      });
      throw new Error(`Failed to execute campaign: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Add leads to a campaign
   */
  async addLeads(campaignId: string, leads: Lead[]): Promise<void> {
    try {
      const growChiefLeads = leads.map(lead => ({
        id: lead.id,
        email: lead.email,
        name: lead.name,
        company: lead.company,
        profileUrl: lead.profileUrl,
        metadata: lead.metadata
      }));

      await this.makeRequest(`/campaigns/${campaignId}/leads`, {
        method: 'POST',
        body: JSON.stringify({
          leads: growChiefLeads
        })
      });

      logger.info(`Added ${leads.length} leads to campaign`, {
        campaignId,
        leadCount: leads.length
      });
    } catch (error) {
      logger.error('Failed to add leads to campaign', {
        campaignId,
        leadCount: leads.length,
        error: getErrorMessage(error)
      });
      throw new Error(`Failed to add leads: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get campaign status and statistics
   */
  async getCampaignStatus(campaignId: string): Promise<{
    status: CampaignStatus;
    processedLeads: number;
    totalLeads: number;
    successRate: number;
    lastActivity: Date;
  }> {
    try {
      const response = await this.makeRequest(`/campaigns/${campaignId}/status`);
      
      return {
        status: response.status,
        processedLeads: response.processedLeads,
        totalLeads: response.totalLeads,
        successRate: response.successRate,
        lastActivity: new Date(response.lastActivity)
      };
    } catch (error) {
      logger.error('Failed to get campaign status', {
        campaignId,
        error: getErrorMessage(error)
      });
      throw new Error(`Failed to get campaign status: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get lead processing status
   */
  async getLeadStatus(leadId: string): Promise<{
    status: LeadStatus;
    lastAction: string;
    nextAction?: string;
    processedAt?: Date;
    interactions: Array<{
      type: string;
      timestamp: Date;
      success: boolean;
    }>;
  }> {
    try {
      const response = await this.makeRequest(`/leads/${leadId}/status`);
      
      return {
        status: response.status,
        lastAction: response.lastAction,
        nextAction: response.nextAction,
        processedAt: response.processedAt ? new Date(response.processedAt) : undefined,
        interactions: response.interactions.map((interaction: any) => ({
          type: interaction.type,
          timestamp: new Date(interaction.timestamp),
          success: interaction.success
        }))
      };
    } catch (error) {
      logger.error('Failed to get lead status', {
        leadId,
        error: getErrorMessage(error)
      });
      throw new Error(`Failed to get lead status: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Pause a running campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await this.makeRequest(`/campaigns/${campaignId}/pause`, {
        method: 'POST'
      });

      logger.info(`Paused campaign`, { campaignId });
    } catch (error) {
      logger.error('Failed to pause campaign', {
        campaignId,
        error: getErrorMessage(error)
      });
      throw new Error(`Failed to pause campaign: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    try {
      await this.makeRequest(`/campaigns/${campaignId}/resume`, {
        method: 'POST'
      });

      logger.info(`Resumed campaign`, { campaignId });
    } catch (error) {
      logger.error('Failed to resume campaign', {
        campaignId,
        error: getErrorMessage(error)
      });
      throw new Error(`Failed to resume campaign: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Cancel a campaign
   */
  async cancelCampaign(campaignId: string): Promise<void> {
    try {
      await this.makeRequest(`/campaigns/${campaignId}/cancel`, {
        method: 'POST'
      });

      logger.info(`Cancelled campaign`, { campaignId });
    } catch (error) {
      logger.error('Failed to cancel campaign', {
        campaignId,
        error: getErrorMessage(error)
      });
      throw new Error(`Failed to cancel campaign: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Map our Workflow model to GrowChief's format
   */
  private mapToGrowChiefWorkflow(workflow: Workflow): GrowChiefWorkflow {
    return {
      id: workflow.id,
      name: workflow.name,
      steps: workflow.steps.map(step => this.mapToGrowChiefStep(step)),
      settings: {
        concurrency: workflow.settings.concurrency,
        rateLimiting: {
          actionsPerHour: 50, // Default rate limit
          delayBetweenActions: 60000 // 1 minute default delay
        },
        retryPolicy: {
          maxRetries: workflow.settings.retryAttempts,
          retryDelay: workflow.settings.retryDelay
        }
      }
    };
  }

  /**
   * Map our WorkflowStep to GrowChief's format
   */
  private mapToGrowChiefStep(step: WorkflowStep): GrowChiefStep {
    return {
      type: step.type,
      config: step.config,
      order: step.order,
      delay: step.config.delay || 0
    };
  }

  /**
   * Make HTTP request to GrowChief API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'User-Agent': 'API-Outreach-Service/1.0.0'
      },
      // timeout: this.config.timeout || 30000 // Not supported in fetch
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('GrowChief API request failed', {
        endpoint,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }
}

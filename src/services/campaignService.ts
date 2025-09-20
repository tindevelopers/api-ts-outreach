import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { GrowChiefService } from '@/integrations/GrowChiefService';
import { 
  Campaign, 
  CreateCampaignRequest, 
  CampaignStatus, 
  SocialPlatform 
} from '@/models/types';

export interface GetCampaignsOptions {
  page: number;
  limit: number;
  status?: CampaignStatus;
}

export interface GetCampaignsResult {
  campaigns: Campaign[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class CampaignService {
  private growChiefService: GrowChiefService;
  private campaigns: Map<string, Campaign> = new Map(); // In-memory storage for demo

  constructor() {
    this.growChiefService = new GrowChiefService({
      endpoint: process.env.OUTREACH_API_ENDPOINT || 'http://localhost:8080',
      apiKey: process.env.OUTREACH_API_KEY || 'demo-key',
      timeout: 30000,
      retryAttempts: 3
    });
  }

  /**
   * Create a new campaign
   */
  async createCampaign(userId: string, data: CreateCampaignRequest): Promise<Campaign> {
    const campaignId = uuidv4();
    
    const campaign: Campaign = {
      id: campaignId,
      userId,
      name: data.name,
      description: data.description,
      status: CampaignStatus.DRAFT,
      platform: data.platform,
      settings: data.settings,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store campaign (in production, save to database)
    this.campaigns.set(campaignId, campaign);

    logger.info('Campaign created', {
      campaignId,
      userId,
      platform: campaign.platform,
      name: campaign.name
    });

    return campaign;
  }

  /**
   * Get campaigns for a user with pagination
   */
  async getCampaigns(userId: string, options: GetCampaignsOptions): Promise<GetCampaignsResult> {
    const { page, limit, status } = options;
    
    // Filter campaigns by user and status
    let userCampaigns = Array.from(this.campaigns.values())
      .filter(campaign => campaign.userId === userId);

    if (status) {
      userCampaigns = userCampaigns.filter(campaign => campaign.status === status);
    }

    // Sort by creation date (newest first)
    userCampaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate pagination
    const total = userCampaigns.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const campaigns = userCampaigns.slice(startIndex, endIndex);

    return {
      campaigns,
      page,
      limit,
      total,
      totalPages
    };
  }

  /**
   * Get a specific campaign by ID
   */
  async getCampaignById(userId: string, campaignId: string): Promise<Campaign | null> {
    const campaign = this.campaigns.get(campaignId);
    
    if (!campaign || campaign.userId !== userId) {
      return null;
    }

    return campaign;
  }

  /**
   * Update a campaign
   */
  async updateCampaign(userId: string, campaignId: string, updateData: Partial<CreateCampaignRequest>): Promise<Campaign | null> {
    const campaign = this.campaigns.get(campaignId);
    
    if (!campaign || campaign.userId !== userId) {
      return null;
    }

    // Update campaign fields
    if (updateData.name) campaign.name = updateData.name;
    if (updateData.description !== undefined) campaign.description = updateData.description;
    if (updateData.platform) campaign.platform = updateData.platform;
    if (updateData.settings) campaign.settings = { ...campaign.settings, ...updateData.settings };
    
    campaign.updatedAt = new Date();

    // Save updated campaign
    this.campaigns.set(campaignId, campaign);

    logger.info('Campaign updated', {
      campaignId,
      userId,
      updatedFields: Object.keys(updateData)
    });

    return campaign;
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(userId: string, campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    
    if (!campaign || campaign.userId !== userId) {
      return false;
    }

    // Cancel campaign in GrowChief if it's running
    if (campaign.status === CampaignStatus.ACTIVE) {
      try {
        await this.growChiefService.cancelCampaign(campaignId);
      } catch (error) {
        logger.error('Failed to cancel campaign in GrowChief', {
          campaignId,
          error: error.message
        });
        // Continue with deletion even if GrowChief cancellation fails
      }
    }

    // Remove campaign
    this.campaigns.delete(campaignId);

    logger.info('Campaign deleted', {
      campaignId,
      userId
    });

    return true;
  }

  /**
   * Start a campaign
   */
  async startCampaign(userId: string, campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    
    if (!campaign || campaign.userId !== userId) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new Error(`Cannot start campaign with status: ${campaign.status}`);
    }

    // Update campaign status
    campaign.status = CampaignStatus.ACTIVE;
    campaign.startedAt = new Date();
    campaign.updatedAt = new Date();
    this.campaigns.set(campaignId, campaign);

    // Start campaign in GrowChief
    try {
      await this.growChiefService.executeCampaign(campaignId, 'default-workflow');
      
      logger.info('Campaign started', {
        campaignId,
        userId,
        platform: campaign.platform
      });
    } catch (error) {
      // Revert status if GrowChief fails
      campaign.status = CampaignStatus.DRAFT;
      campaign.startedAt = undefined;
      campaign.updatedAt = new Date();
      this.campaigns.set(campaignId, campaign);
      
      throw new Error(`Failed to start campaign: ${error.message}`);
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(userId: string, campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    
    if (!campaign || campaign.userId !== userId) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new Error(`Cannot pause campaign with status: ${campaign.status}`);
    }

    // Pause campaign in GrowChief
    await this.growChiefService.pauseCampaign(campaignId);

    // Update campaign status
    campaign.status = CampaignStatus.PAUSED;
    campaign.updatedAt = new Date();
    this.campaigns.set(campaignId, campaign);

    logger.info('Campaign paused', {
      campaignId,
      userId
    });
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(userId: string, campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    
    if (!campaign || campaign.userId !== userId) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new Error(`Cannot resume campaign with status: ${campaign.status}`);
    }

    // Resume campaign in GrowChief
    await this.growChiefService.resumeCampaign(campaignId);

    // Update campaign status
    campaign.status = CampaignStatus.ACTIVE;
    campaign.updatedAt = new Date();
    this.campaigns.set(campaignId, campaign);

    logger.info('Campaign resumed', {
      campaignId,
      userId
    });
  }

  /**
   * Get campaign status from GrowChief
   */
  async getCampaignStatus(userId: string, campaignId: string) {
    const campaign = this.campaigns.get(campaignId);
    
    if (!campaign || campaign.userId !== userId) {
      throw new Error('Campaign not found');
    }

    try {
      const status = await this.growChiefService.getCampaignStatus(campaignId);
      return status;
    } catch (error) {
      logger.error('Failed to get campaign status from GrowChief', {
        campaignId,
        error: error.message
      });
      throw error;
    }
  }
}

export const campaignService = new CampaignService();

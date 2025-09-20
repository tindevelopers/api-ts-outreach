import { campaignService } from '../../services/campaignService';
import { CreateCampaignRequest, CampaignStatus } from '../../models/types';

describe('CampaignService', () => {
  beforeEach(() => {
    // Clear any existing campaigns before each test
    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a new campaign', async () => {
      const campaignData: CreateCampaignRequest = {
        name: 'Test Campaign',
        description: 'A test campaign',
        targetAudience: 'Developers',
        socialPlatforms: ['linkedin'],
        settings: {
          maxConnectionsPerDay: 50,
          delayBetweenActions: 5000,
          retryAttempts: 3
        }
      };

      const campaign = await campaignService.createCampaign('user123', campaignData);

      expect(campaign).toBeDefined();
      expect(campaign.name).toBe(campaignData.name);
      expect(campaign.description).toBe(campaignData.description);
      expect(campaign.status).toBe(CampaignStatus.DRAFT);
      expect(campaign.id).toBeDefined();
      expect(campaign.createdAt).toBeDefined();
    });
  });

  describe('getCampaigns', () => {
    it('should return campaigns with pagination', async () => {
      const result = await campaignService.getCampaigns({
        userId: 'user123',
        page: 1,
        limit: 10
      });

      expect(result).toBeDefined();
      expect(result.campaigns).toBeInstanceOf(Array);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.totalPages).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCampaignById', () => {
    it('should return a campaign by ID', async () => {
      // First create a campaign
      const campaignData: CreateCampaignRequest = {
        name: 'Test Campaign for Get',
        description: 'A test campaign for get by ID',
        targetAudience: 'Developers',
        socialPlatforms: ['linkedin'],
        settings: {
          maxConnectionsPerDay: 50,
          delayBetweenActions: 5000,
          retryAttempts: 3
        }
      };

      const createdCampaign = await campaignService.createCampaign('user123', campaignData);
      const retrievedCampaign = await campaignService.getCampaignById(createdCampaign.id);

      expect(retrievedCampaign).toBeDefined();
      expect(retrievedCampaign?.id).toBe(createdCampaign.id);
      expect(retrievedCampaign?.name).toBe(campaignData.name);
    });

    it('should return null for non-existent campaign', async () => {
      const campaign = await campaignService.getCampaignById('non-existent-id');
      expect(campaign).toBeNull();
    });
  });
});

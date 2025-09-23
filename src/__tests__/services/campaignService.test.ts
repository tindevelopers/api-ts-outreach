import { campaignService } from '../../services/campaignService';
import { CreateCampaignRequest, CampaignStatus, SocialPlatform } from '../../models/types';

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
        platform: SocialPlatform.LINKEDIN,
        settings: {
          workingHours: {
            start: '09:00',
            end: '17:00',
            timezone: 'UTC',
            weekdays: [1, 2, 3, 4, 5]
          },
          rateLimiting: {
            maxConnectionsPerDay: 50,
            maxMessagesPerDay: 100,
            delayBetweenActions: 5000
          },
          personalization: {
            useCustomMessages: true,
            messageTemplates: ['Hello {name}!'],
            includeCompanyInfo: true
          }
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
      const result = await campaignService.getCampaigns('user123', {
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
        platform: SocialPlatform.LINKEDIN,
        settings: {
          workingHours: {
            start: '09:00',
            end: '17:00',
            timezone: 'UTC',
            weekdays: [1, 2, 3, 4, 5]
          },
          rateLimiting: {
            maxConnectionsPerDay: 50,
            maxMessagesPerDay: 100,
            delayBetweenActions: 5000
          },
          personalization: {
            useCustomMessages: true,
            messageTemplates: ['Hello {name}!'],
            includeCompanyInfo: true
          }
        }
      };

      const createdCampaign = await campaignService.createCampaign('user123', campaignData);
      const retrievedCampaign = await campaignService.getCampaignById('user123', createdCampaign.id);

      expect(retrievedCampaign).toBeDefined();
      expect(retrievedCampaign?.id).toBe(createdCampaign.id);
      expect(retrievedCampaign?.name).toBe(campaignData.name);
    });

    it('should return null for non-existent campaign', async () => {
      const campaign = await campaignService.getCampaignById('user123', 'non-existent-id');
      expect(campaign).toBeNull();
    });
  });
});

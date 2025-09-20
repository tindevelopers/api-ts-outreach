import request from 'supertest';
import { app } from '../../src/app';

describe('API Integration Tests', () => {
  describe('Campaign Management', () => {
    it('should create, retrieve, and update a campaign', async () => {
      // Create a campaign
      const campaignData = {
        name: 'Integration Test Campaign',
        description: 'A campaign for integration testing',
        targetAudience: 'Developers',
        socialPlatforms: ['linkedin'],
        settings: {
          maxConnectionsPerDay: 50,
          delayBetweenActions: 5000,
          retryAttempts: 3
        }
      };

      const createResponse = await request(app)
        .post('/api/v1/campaigns')
        .send(campaignData)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      const campaignId = createResponse.body.id;

      // Retrieve the campaign
      const getResponse = await request(app)
        .get(`/api/v1/campaigns/${campaignId}`)
        .expect(200);

      expect(getResponse.body.name).toBe(campaignData.name);
      expect(getResponse.body.description).toBe(campaignData.description);

      // Update the campaign
      const updateData = {
        name: 'Updated Integration Test Campaign',
        description: 'Updated description'
      };

      const updateResponse = await request(app)
        .put(`/api/v1/campaigns/${campaignId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateData.name);
      expect(updateResponse.body.description).toBe(updateData.description);
    });
  });

  describe('Lead Management', () => {
    it('should create and retrieve leads', async () => {
      // First create a campaign
      const campaignData = {
        name: 'Lead Test Campaign',
        description: 'A campaign for lead testing',
        targetAudience: 'Developers',
        socialPlatforms: ['linkedin'],
        settings: {
          maxConnectionsPerDay: 50,
          delayBetweenActions: 5000,
          retryAttempts: 3
        }
      };

      const campaignResponse = await request(app)
        .post('/api/v1/campaigns')
        .send(campaignData)
        .expect(201);

      const campaignId = campaignResponse.body.id;

      // Create a lead
      const leadData = {
        email: 'test@example.com',
        name: 'Test Lead',
        company: 'Test Company',
        profileUrl: 'https://linkedin.com/in/testlead'
      };

      const createLeadResponse = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/leads`)
        .send(leadData)
        .expect(201);

      expect(createLeadResponse.body).toHaveProperty('id');
      expect(createLeadResponse.body.email).toBe(leadData.email);

      // Retrieve leads
      const getLeadsResponse = await request(app)
        .get('/api/v1/leads')
        .expect(200);

      expect(getLeadsResponse.body.leads).toBeInstanceOf(Array);
      expect(getLeadsResponse.body.total).toBeGreaterThan(0);
    });
  });

  describe('Workflow Management', () => {
    it('should create and retrieve workflows', async () => {
      // First create a campaign
      const campaignData = {
        name: 'Workflow Test Campaign',
        description: 'A campaign for workflow testing',
        targetAudience: 'Developers',
        socialPlatforms: ['linkedin'],
        settings: {
          maxConnectionsPerDay: 50,
          delayBetweenActions: 5000,
          retryAttempts: 3
        }
      };

      const campaignResponse = await request(app)
        .post('/api/v1/campaigns')
        .send(campaignData)
        .expect(201);

      const campaignId = campaignResponse.body.id;

      // Create a workflow
      const workflowData = {
        name: 'Test Workflow',
        steps: [
          {
            type: 'VIEW_PROFILE',
            config: {},
            order: 1
          },
          {
            type: 'CONNECT',
            config: { message: 'Hi {{name}}, I noticed...' },
            order: 2
          }
        ],
        settings: {
          concurrency: 1,
          retryAttempts: 3,
          retryDelay: 5000,
          timeout: 60000
        }
      };

      const createWorkflowResponse = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/workflows`)
        .send(workflowData)
        .expect(201);

      expect(createWorkflowResponse.body).toHaveProperty('id');
      expect(createWorkflowResponse.body.name).toBe(workflowData.name);

      // Retrieve workflows
      const getWorkflowsResponse = await request(app)
        .get('/api/v1/workflows')
        .expect(200);

      expect(getWorkflowsResponse.body.workflows).toBeInstanceOf(Array);
      expect(getWorkflowsResponse.body.total).toBeGreaterThan(0);
    });
  });

  describe('Analytics', () => {
    it('should return analytics data', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/campaigns')
        .expect(200);

      expect(response.body).toHaveProperty('campaignId');
      expect(response.body).toHaveProperty('totalLeads');
      expect(response.body).toHaveProperty('processedLeads');
      expect(response.body).toHaveProperty('connectedLeads');
      expect(response.body).toHaveProperty('successRate');
    });

    it('should return lead analytics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/leads')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return campaign metrics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/campaigns/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('totalCampaigns');
      expect(response.body).toHaveProperty('activeCampaigns');
      expect(response.body).toHaveProperty('averageSuccessRate');
    });
  });
});

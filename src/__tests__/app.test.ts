import request from 'supertest';
import { app } from '../app';

describe('App', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/v1/campaigns', () => {
    it('should return campaigns list', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns')
        .expect(200);

      expect(response.body).toHaveProperty('campaigns');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('totalPages');
    });
  });

  describe('GET /api/v1/leads', () => {
    it('should return leads list', async () => {
      const response = await request(app)
        .get('/api/v1/leads')
        .expect(200);

      expect(response.body).toHaveProperty('leads');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('totalPages');
    });
  });

  describe('GET /api/v1/workflows', () => {
    it('should return workflows list', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .expect(200);

      expect(response.body).toHaveProperty('workflows');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('totalPages');
    });
  });

  describe('GET /api/v1/analytics/campaigns', () => {
    it('should return campaign analytics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/campaigns')
        .expect(200);

      expect(response.body).toHaveProperty('campaignId');
      expect(response.body).toHaveProperty('totalLeads');
      expect(response.body).toHaveProperty('processedLeads');
      expect(response.body).toHaveProperty('connectedLeads');
      expect(response.body).toHaveProperty('successRate');
    });
  });
});

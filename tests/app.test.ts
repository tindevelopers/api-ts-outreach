import request from 'supertest';
import app from '../src/app';

describe('API Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown-route')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Not Found');
    expect(response.body).toHaveProperty('message');
  });
});

describe('Authentication', () => {
  it('should require authentication for protected routes', async () => {
    await request(app)
      .get('/api/v1/campaigns')
      .expect(401);
  });

  it('should accept valid API key', async () => {
    const response = await request(app)
      .get('/api/v1/campaigns')
      .set('Authorization', 'Bearer ak_demo123456789')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  });
});

describe('Rate Limiting', () => {
  it('should include rate limit headers', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.headers).toHaveProperty('x-ratelimit-limit');
    expect(response.headers).toHaveProperty('x-ratelimit-remaining');
  });
});

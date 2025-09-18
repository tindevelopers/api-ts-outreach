import { logger } from '../src/utils/logger';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  
  // Suppress logger output during tests
  logger.transports.forEach((transport) => {
    transport.silent = true;
  });
});

afterAll(async () => {
  // Re-enable logger after tests
  logger.transports.forEach((transport) => {
    transport.silent = false;
  });
});

// Global test timeout
jest.setTimeout(10000);

// Global test setup
import { ConfigService } from '@nestjs/config';

// Mock external dependencies globally
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_NAME = 'test_db';
process.env.DATABASE_USERNAME = 'test';
process.env.DATABASE_PASSWORD = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

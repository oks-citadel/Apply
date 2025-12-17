/**
 * Global test setup for integration tests
 * Runs before all tests in the suite
 * Uses nock for HTTP mocking to enable testing without live services
 */

import nock from 'nock';
import { TestServiceManager } from './utils/test-service-manager';
import { MockedServiceManager } from './utils/mocked-service-manager';
import { TestDatabaseManager } from './utils/test-database';
import { MockedDatabaseManager } from './utils/mocked-database';
import { logger } from './utils/test-logger';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test managers
let dbManager: TestDatabaseManager | MockedDatabaseManager;
let serviceManager: TestServiceManager | MockedServiceManager;

// Check if we're running with live services
const useLiveServices = process.env.USE_LIVE_SERVICES === 'true';

beforeAll(async () => {
  logger.info('Starting integration test suite setup...');
  logger.info(`Mode: ${useLiveServices ? 'Live Services' : 'Mocked Services'}`);

  try {
    if (useLiveServices) {
      // Initialize real database manager
      dbManager = new TestDatabaseManager();
      await dbManager.initialize();
      logger.info('Test database initialized');

      // Initialize real service manager
      serviceManager = new TestServiceManager();
      await serviceManager.initialize();
      logger.info('Test services initialized');
    } else {
      // Use mocked services
      // Note: Not using nock.disableNetConnect() to avoid conflicts with msw interceptors

      // Initialize mocked database manager
      dbManager = new MockedDatabaseManager();
      await dbManager.initialize();
      logger.info('Mocked database initialized');

      // Initialize mocked service manager
      serviceManager = new MockedServiceManager();
      await serviceManager.initialize();
      logger.info('Mocked services initialized');
    }

    // Store in global scope for test access
    (global as any).testDb = dbManager;
    (global as any).testServices = serviceManager;
    (global as any).useLiveServices = useLiveServices;

    logger.info('Integration test setup complete');
  } catch (error) {
    logger.error('Failed to setup integration tests', error);
    throw error;
  }
});

afterAll(async () => {
  logger.info('Starting integration test suite teardown...');

  try {
    // Cleanup services
    if (serviceManager) {
      await serviceManager.cleanup();
      logger.info('Test services cleaned up');
    }

    // Cleanup database
    if (dbManager) {
      await dbManager.cleanup();
      logger.info('Test database cleaned up');
    }

    // Clean up nock
    if (!useLiveServices) {
      nock.cleanAll();
      nock.enableNetConnect();
    }

    logger.info('Integration test teardown complete');
  } catch (error) {
    logger.error('Failed to teardown integration tests', error);
  }
});

// Reset nock mocks before each test
beforeEach(async () => {
  if (!useLiveServices && serviceManager instanceof MockedServiceManager) {
    // Re-initialize the mocks for each test
    await serviceManager.reinitializeMocks();
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

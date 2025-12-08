/**
 * Global test setup for integration tests
 * Runs before all tests in the suite
 */

import { TestDatabaseManager } from './utils/test-database';
import { TestServiceManager } from './utils/test-service-manager';
import { logger } from './utils/test-logger';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test managers
let dbManager: TestDatabaseManager;
let serviceManager: TestServiceManager;

beforeAll(async () => {
  logger.info('Starting integration test suite setup...');

  try {
    // Initialize database manager
    dbManager = new TestDatabaseManager();
    await dbManager.initialize();
    logger.info('Test database initialized');

    // Initialize service manager
    serviceManager = new TestServiceManager();
    await serviceManager.initialize();
    logger.info('Test services initialized');

    // Store in global scope for test access
    (global as any).testDb = dbManager;
    (global as any).testServices = serviceManager;

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

    logger.info('Integration test teardown complete');
  } catch (error) {
    logger.error('Failed to teardown integration tests', error);
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

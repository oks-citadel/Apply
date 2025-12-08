/**
 * Test Database Manager
 * Manages test database lifecycle and provides utilities for database operations
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import { logger } from './test-logger';

export interface TestDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export class TestDatabaseManager {
  private dataSources: Map<string, DataSource> = new Map();
  private readonly baseConfig: TestDatabaseConfig;

  constructor() {
    this.baseConfig = {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
      username: process.env.TEST_DB_USERNAME || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
      database: process.env.TEST_DB_DATABASE || 'jobpilot_test',
    };
  }

  async initialize(): Promise<void> {
    logger.info('Initializing test databases...');

    // Create main test database
    await this.createDatabase(this.baseConfig.database);

    // Create service-specific test databases
    const services = [
      'auth_service_test',
      'user_service_test',
      'job_service_test',
      'resume_service_test',
      'notification_service_test',
      'auto_apply_service_test',
      'analytics_service_test',
    ];

    for (const dbName of services) {
      await this.createDatabase(dbName);
    }

    logger.info('Test databases initialized');
  }

  async createDatabase(dbName: string): Promise<void> {
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: this.baseConfig.host,
      port: this.baseConfig.port,
      username: this.baseConfig.username,
      password: this.baseConfig.password,
      database: 'postgres', // Connect to default database
    });

    try {
      await adminDataSource.initialize();

      // Check if database exists
      const result = await adminDataSource.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName]
      );

      if (result.length === 0) {
        await adminDataSource.query(`CREATE DATABASE ${dbName}`);
        logger.info(`Created test database: ${dbName}`);
      } else {
        // Clean existing database
        await adminDataSource.destroy();
        const dbDataSource = await this.getDataSource(dbName);
        await dbDataSource.query('DROP SCHEMA public CASCADE');
        await dbDataSource.query('CREATE SCHEMA public');
        logger.info(`Cleaned test database: ${dbName}`);
      }
    } finally {
      if (adminDataSource.isInitialized) {
        await adminDataSource.destroy();
      }
    }
  }

  async getDataSource(dbName: string, entities: any[] = []): Promise<DataSource> {
    const key = dbName;

    if (this.dataSources.has(key)) {
      return this.dataSources.get(key)!;
    }

    const options: DataSourceOptions = {
      type: 'postgres',
      host: this.baseConfig.host,
      port: this.baseConfig.port,
      username: this.baseConfig.username,
      password: this.baseConfig.password,
      database: dbName,
      entities,
      synchronize: true, // Auto-create schema for tests
      dropSchema: false,
      logging: process.env.TEST_DEBUG === 'true',
    };

    const dataSource = new DataSource(options);
    await dataSource.initialize();

    this.dataSources.set(key, dataSource);
    logger.debug(`Created DataSource for ${dbName}`);

    return dataSource;
  }

  async cleanDatabase(dbName: string): Promise<void> {
    const dataSource = this.dataSources.get(dbName);
    if (!dataSource) {
      logger.warn(`DataSource not found for ${dbName}`);
      return;
    }

    const entities = dataSource.entityMetadatas;

    // Disable foreign key checks
    await dataSource.query('SET session_replication_role = replica;');

    // Clear all tables
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }

    // Re-enable foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');

    logger.debug(`Cleaned database: ${dbName}`);
  }

  async cleanup(): Promise<void> {
    logger.info('Cleaning up test databases...');

    // Close all connections
    for (const [name, dataSource] of this.dataSources.entries()) {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
        logger.debug(`Closed connection to ${name}`);
      }
    }

    this.dataSources.clear();
    logger.info('Test database cleanup complete');
  }

  getConfig(): TestDatabaseConfig {
    return { ...this.baseConfig };
  }
}

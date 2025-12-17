/**
 * Mocked Database Manager
 * Provides in-memory database operations for testing without live PostgreSQL
 */

import { logger } from './test-logger';

export interface TestDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/**
 * Mocked Database Manager for testing without live PostgreSQL
 */
export class MockedDatabaseManager {
  private databases: Map<string, Map<string, any[]>> = new Map();
  private readonly baseConfig: TestDatabaseConfig;

  constructor() {
    this.baseConfig = {
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'jobpilot_test',
    };
  }

  async initialize(): Promise<void> {
    logger.info('Initializing mocked databases...');

    // Create mocked test databases
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
      this.databases.set(dbName, new Map());
      logger.debug(`Created mocked database: ${dbName}`);
    }

    logger.info('Mocked databases initialized');
  }

  async createDatabase(dbName: string): Promise<void> {
    if (!this.databases.has(dbName)) {
      this.databases.set(dbName, new Map());
      logger.info(`Created mocked database: ${dbName}`);
    }
  }

  getTable(dbName: string, tableName: string): any[] {
    const db = this.databases.get(dbName);
    if (!db) {
      return [];
    }
    if (!db.has(tableName)) {
      db.set(tableName, []);
    }
    return db.get(tableName)!;
  }

  insert(dbName: string, tableName: string, record: any): any {
    const table = this.getTable(dbName, tableName);
    const newRecord = {
      id: `${tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...record,
    };
    table.push(newRecord);
    return newRecord;
  }

  findOne(dbName: string, tableName: string, predicate: (item: any) => boolean): any | null {
    const table = this.getTable(dbName, tableName);
    return table.find(predicate) || null;
  }

  findMany(dbName: string, tableName: string, predicate?: (item: any) => boolean): any[] {
    const table = this.getTable(dbName, tableName);
    return predicate ? table.filter(predicate) : [...table];
  }

  update(dbName: string, tableName: string, id: string, updates: any): any | null {
    const table = this.getTable(dbName, tableName);
    const index = table.findIndex(item => item.id === id);
    if (index === -1) {
      return null;
    }
    table[index] = {
      ...table[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return table[index];
  }

  delete(dbName: string, tableName: string, id: string): boolean {
    const table = this.getTable(dbName, tableName);
    const index = table.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }
    table.splice(index, 1);
    return true;
  }

  async cleanDatabase(dbName: string): Promise<void> {
    const db = this.databases.get(dbName);
    if (db) {
      db.clear();
      logger.debug(`Cleaned mocked database: ${dbName}`);
    }
  }

  async cleanup(): Promise<void> {
    logger.info('Cleaning up mocked databases...');
    this.databases.clear();
    logger.info('Mocked database cleanup complete');
  }

  getConfig(): TestDatabaseConfig {
    return { ...this.baseConfig };
  }
}

#!/usr/bin/env ts-node
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

const logger = new Logger('Migrations');

async function runMigrations() {
  const isProd = process.env.NODE_ENV === 'production';

  logger.log('Starting migration process...');
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Database: ${process.env.DB_DATABASE || 'resume_service'}`);

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'resume_service',
    migrations: [
      isProd
        ? path.join(__dirname, '../../dist/migrations/*.js')
        : path.join(__dirname, '../migrations/*.ts'),
    ],
    logging: !isProd,
    ssl: isProd ? {
      rejectUnauthorized: true,
      ca: process.env.DB_SSL_CA_CERT,
    } : false,
  });

  try {
    logger.log('Connecting to database...');
    await dataSource.initialize();
    logger.log('Database connection established');

    // Check pending migrations
    const pendingMigrations = await dataSource.showMigrations();

    if (pendingMigrations) {
      logger.log('Pending migrations found. Running migrations...');
      const migrations = await dataSource.runMigrations({
        transaction: 'all', // Run all migrations in a single transaction
      });

      if (migrations.length === 0) {
        logger.log('No migrations were executed (all up to date)');
      } else {
        logger.log(`Successfully executed ${migrations.length} migration(s):`);
        migrations.forEach((migration) => {
          logger.log(`  - ${migration.name}`);
        });
      }
    } else {
      logger.log('No pending migrations. Database is up to date.');
    }

    // Display current migration status
    logger.log('Migration History:');
    const executedMigrations = await dataSource.query(
      `SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 10`
    );

    if (executedMigrations.length > 0) {
      executedMigrations.forEach((migration: any) => {
        logger.log(`  ✓ ${migration.name} (${new Date(migration.timestamp).toISOString()})`);
      });
    } else {
      logger.log('  No migrations executed yet');
    }

    await dataSource.destroy();
    logger.log('Migration process completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', error);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }

    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection', error);
  process.exit(1);
});

runMigrations();

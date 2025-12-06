#!/usr/bin/env ts-node
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

async function runMigrations() {
  const isProd = process.env.NODE_ENV === 'production';

  console.log('Starting migration process...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DB_DATABASE || 'resume_service'}`);

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
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Database connection established');

    // Check pending migrations
    const pendingMigrations = await dataSource.showMigrations();

    if (pendingMigrations) {
      console.log('\nPending migrations found. Running migrations...');
      const migrations = await dataSource.runMigrations({
        transaction: 'all', // Run all migrations in a single transaction
      });

      if (migrations.length === 0) {
        console.log('No migrations were executed (all up to date)');
      } else {
        console.log(`\nSuccessfully executed ${migrations.length} migration(s):`);
        migrations.forEach((migration) => {
          console.log(`  - ${migration.name}`);
        });
      }
    } else {
      console.log('\nNo pending migrations. Database is up to date.');
    }

    // Display current migration status
    console.log('\nMigration History:');
    const executedMigrations = await dataSource.query(
      `SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 10`
    );

    if (executedMigrations.length > 0) {
      executedMigrations.forEach((migration: any) => {
        console.log(`  ✓ ${migration.name} (${new Date(migration.timestamp).toISOString()})`);
      });
    } else {
      console.log('  No migrations executed yet');
    }

    await dataSource.destroy();
    console.log('\nMigration process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\nMigration failed:', error);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }

    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

runMigrations();

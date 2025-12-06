import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Import all data sources
import authDataSource from './services/auth-service/src/config/data-source';
import jobDataSource from './services/job-service/src/config/data-source';
import resumeDataSource from './services/resume-service/src/config/database.config';
import userDataSource from './services/user-service/src/config/data-source';
import notificationDataSource from './services/notification-service/src/config/data-source';
import autoApplyDataSource from './services/auto-apply-service/src/config/data-source';
import analyticsDataSource from './services/analytics-service/src/config/data-source';

interface MigrationResult {
  service: string;
  status: 'SUCCESS' | 'ERROR' | 'NO_MIGRATIONS';
  message: string;
  migrations?: string[];
}

const services: { name: string; dataSource: DataSource }[] = [
  { name: 'auth-service', dataSource: authDataSource },
  { name: 'job-service', dataSource: jobDataSource },
  { name: 'resume-service', dataSource: resumeDataSource },
  { name: 'user-service', dataSource: userDataSource },
  { name: 'notification-service', dataSource: notificationDataSource },
  { name: 'auto-apply-service', dataSource: autoApplyDataSource },
  { name: 'analytics-service', dataSource: analyticsDataSource },
];

async function runMigration(serviceName: string, dataSource: DataSource): Promise<MigrationResult> {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running migrations for: ${serviceName}`);
    console.log(`${'='.repeat(60)}`);

    // Initialize the data source
    await dataSource.initialize();
    console.log(`✓ Database connection established`);

    // Run pending migrations
    const migrations = await dataSource.runMigrations({ transaction: 'all' });

    if (migrations.length === 0) {
      console.log(`✓ No pending migrations`);
      await dataSource.destroy();
      return {
        service: serviceName,
        status: 'NO_MIGRATIONS',
        message: 'No pending migrations',
      };
    }

    const migrationNames = migrations.map(m => m.name);
    console.log(`✓ Executed ${migrations.length} migration(s):`);
    migrationNames.forEach(name => console.log(`  - ${name}`));

    await dataSource.destroy();

    return {
      service: serviceName,
      status: 'SUCCESS',
      message: `${migrations.length} migration(s) executed successfully`,
      migrations: migrationNames,
    };
  } catch (error) {
    console.error(`✗ Error running migrations for ${serviceName}:`, error);

    try {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    } catch (destroyError) {
      console.error(`Error destroying data source:`, destroyError);
    }

    return {
      service: serviceName,
      status: 'ERROR',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runAllMigrations() {
  console.log('Starting migration process for all services...\n');
  console.log(`Database: ${process.env.DB_DATABASE || 'jobpilot'}`);
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5434'}\n`);

  const results: MigrationResult[] = [];

  for (const { name, dataSource } of services) {
    const result = await runMigration(name, dataSource);
    results.push(result);
  }

  // Print summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('MIGRATION SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  results.forEach(result => {
    const statusIcon = result.status === 'SUCCESS' || result.status === 'NO_MIGRATIONS' ? '✅' : '❌';
    console.log(`${statusIcon} ${result.service.padEnd(25)} ${result.status.padEnd(15)} ${result.message}`);
    if (result.migrations && result.migrations.length > 0) {
      result.migrations.forEach(migration => {
        console.log(`     - ${migration}`);
      });
    }
  });

  console.log('\n');

  // Exit with error code if any migration failed
  const hasErrors = results.some(r => r.status === 'ERROR');
  process.exit(hasErrors ? 1 : 0);
}

runAllMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

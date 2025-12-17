#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Database configuration
const DB_CONFIG = {
  DB_HOST: 'localhost',
  DB_PORT: '5434',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_DATABASE: 'jobpilot',
  NODE_ENV: 'development'
};

// Services with their data source paths
const SERVICES = [
  {
    name: 'auth-service',
    path: 'services/auth-service',
    dataSource: 'src/config/data-source.ts'
  },
  {
    name: 'job-service',
    path: 'services/job-service',
    dataSource: 'src/config/data-source.ts'
  },
  {
    name: 'resume-service',
    path: 'services/resume-service',
    dataSource: 'src/config/database.config.ts'
  },
  {
    name: 'user-service',
    path: 'services/user-service',
    dataSource: 'src/config/data-source.ts'
  },
  {
    name: 'notification-service',
    path: 'services/notification-service',
    dataSource: 'src/config/data-source.ts'
  },
  {
    name: 'auto-apply-service',
    path: 'services/auto-apply-service',
    dataSource: 'src/config/data-source.ts'
  },
  {
    name: 'analytics-service',
    path: 'services/analytics-service',
    dataSource: 'src/config/data-source.ts'
  }
];

function runMigrations() {
  console.log('Starting migration process for all services...\n');
  console.log(`Database: ${DB_CONFIG.DB_DATABASE}`);
  console.log(`Host: ${DB_CONFIG.DB_HOST}:${DB_CONFIG.DB_PORT}\n`);

  const results = [];

  for (const service of SERVICES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running migrations for: ${service.name}`);
    console.log(`${'='.repeat(60)}`);

    const servicePath = path.join(__dirname, service.path);

    // Check if service directory exists
    if (!fs.existsSync(servicePath)) {
      console.error(`❌ Service directory not found: ${servicePath}`);
      results.push({ service: service.name, status: 'ERROR', message: 'Directory not found' });
      continue;
    }

    // Check if data source exists
    const dataSourcePath = path.join(servicePath, service.dataSource);
    if (!fs.existsSync(dataSourcePath)) {
      console.error(`❌ Data source not found: ${dataSourcePath}`);
      results.push({ service: service.name, status: 'ERROR', message: 'Data source not found' });
      continue;
    }

    // Set environment variables
    const env = { ...process.env, ...DB_CONFIG };

    try {
      // Run migrations using ts-node
      const command = `npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d ${service.dataSource}`;

      console.log(`Executing: ${command}`);
      const output = execSync(command, {
        cwd: servicePath,
        env: env,
        stdio: 'pipe',
        encoding: 'utf8'
      });

      console.log(output);

      if (output.includes('No migrations are pending')) {
        console.log(`✅ ${service.name}: No pending migrations`);
        results.push({ service: service.name, status: 'UP_TO_DATE', message: 'No pending migrations' });
      } else if (output.includes('migration') && output.includes('has been executed successfully')) {
        console.log(`✅ ${service.name}: Migrations executed successfully`);
        results.push({ service: service.name, status: 'SUCCESS', message: 'Migrations executed' });
      } else {
        console.log(`✅ ${service.name}: Completed`);
        results.push({ service: service.name, status: 'COMPLETED', message: 'Process completed' });
      }
    } catch (error) {
      console.error(`❌ ${service.name}: Error running migrations`);
      console.error(error.message);
      if (error.stdout) console.error('STDOUT:', error.stdout);
      if (error.stderr) console.error('STDERR:', error.stderr);
      results.push({ service: service.name, status: 'ERROR', message: error.message });
    }
  }

  // Print summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('MIGRATION SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  results.forEach(result => {
    const statusIcon = result.status === 'SUCCESS' || result.status === 'UP_TO_DATE' || result.status === 'COMPLETED' ? '✅' : '❌';
    console.log(`${statusIcon} ${result.service.padEnd(25)} ${result.status.padEnd(15)} ${result.message}`);
  });

  console.log('\n');
}

runMigrations();

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { Client } from 'pg';
import { DataSource } from 'typeorm';

/**
 * Global setup script
 * Runs once before all tests
 * - Sets up test database
 * - Creates test users
 * - Prepares authentication state
 */

// Store test user tokens for later cleanup
export const testUserTokens: Map<string, string> = new Map();

async function globalSetup(config: FullConfig) {
  console.log('Running global setup...');

  const { baseURL } = config.projects[0].use;

  // Ensure auth directory exists
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Setup test database (if needed)
  await setupTestDatabase();

  // Create test users
  await createTestUsers();

  // Pre-authenticate user and save state
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);

    // Fill in login credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for successful login (dashboard page)
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Save authenticated state
    await context.storageState({ path: path.join(authDir, 'user.json') });

    console.log('Authentication state saved successfully');
  } catch (error) {
    console.error('Failed to setup authentication:', error);
    // Create empty auth file to avoid test failures
    await context.storageState({ path: path.join(authDir, 'user.json') });
  } finally {
    await browser.close();
  }

  console.log('Global setup completed');
}

/**
 * Setup test database
 * Creates/resets the test database schema
 */
async function setupTestDatabase() {
  console.log('Setting up test database...');

  const testDatabaseUrl = process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/jobpilot_test';

  try {
    // Parse database URL
    const dbUrl = new URL(testDatabaseUrl);
    const dbName = dbUrl.pathname.slice(1);
    const adminUrl = testDatabaseUrl.replace(`/${dbName}`, '/postgres');

    // Connect to PostgreSQL admin database
    const adminClient = new Client({ connectionString: adminUrl });

    try {
      await adminClient.connect();
      console.log('Connected to PostgreSQL');

      // Check if test database exists
      const dbCheckResult = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName]
      );

      if (dbCheckResult.rowCount === 0) {
        // Create test database if it doesn't exist
        console.log(`Creating test database: ${dbName}`);
        await adminClient.query(`CREATE DATABASE ${dbName}`);
        console.log(`Test database ${dbName} created`);
      } else {
        console.log(`Test database ${dbName} already exists`);
      }
    } finally {
      await adminClient.end();
    }

    // Connect to test database
    const testClient = new Client({ connectionString: testDatabaseUrl });

    try {
      await testClient.connect();
      console.log('Connected to test database');

      // Create TypeORM data source for migrations
      const dataSource = new DataSource({
        type: 'postgres',
        url: testDatabaseUrl,
        entities: [],
        migrations: [
          path.join(__dirname, '../services/auth-service/src/migrations/**/*.ts')
        ],
        synchronize: false,
        logging: false,
      });

      try {
        await dataSource.initialize();
        console.log('Running migrations...');

        // Run migrations
        const migrations = await dataSource.runMigrations({ transaction: 'all' });
        console.log(`Executed ${migrations.length} migrations`);
      } catch (migrationError) {
        console.log('Migration error (may be expected if using synchronize):', migrationError.message);
        // If migrations fail, we'll use synchronize mode instead
      } finally {
        await dataSource.destroy();
      }

      // Clear existing test data
      console.log('Clearing existing test data...');

      // Get all tables except migrations
      const tablesResult = await testClient.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename != 'migrations'
        AND tablename != 'typeorm_metadata'
      `);

      // Disable foreign key checks temporarily
      await testClient.query('SET session_replication_role = replica;');

      // Truncate all tables
      for (const row of tablesResult.rows) {
        const tableName = row.tablename;
        try {
          await testClient.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
          console.log(`Truncated table: ${tableName}`);
        } catch (truncateError) {
          console.warn(`Could not truncate ${tableName}:`, truncateError.message);
        }
      }

      // Re-enable foreign key checks
      await testClient.query('SET session_replication_role = DEFAULT;');

      console.log('Test data cleared successfully');

    } finally {
      await testClient.end();
    }

    console.log('Test database setup completed');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    console.error('Ensure PostgreSQL is running and TEST_DATABASE_URL is set correctly');
    throw error;
  }
}

/**
 * Create test users with different roles
 */
async function createTestUsers() {
  console.log('Creating test users...');

  const authServiceUrl = process.env.TEST_API_URL || 'http://localhost:3001/api/v1';

  const testUsers = [
    {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
    },
    {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      firstName: 'Admin',
      lastName: 'User',
      username: 'adminuser',
    },
  ];

  try {
    for (const user of testUsers) {
      try {
        // Register user via API
        const registerResponse = await fetch(`${authServiceUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
        });

        if (registerResponse.ok) {
          const data = await registerResponse.json();
          console.log(`Created test user: ${user.email}`);

          // Store access token for later cleanup
          if (data.accessToken) {
            testUserTokens.set(user.email, data.accessToken);
          }
        } else if (registerResponse.status === 409) {
          // User already exists, try to login
          console.log(`User ${user.email} already exists, logging in...`);

          const loginResponse = await fetch(`${authServiceUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              password: user.password,
            }),
          });

          if (loginResponse.ok) {
            const data = await loginResponse.json();
            testUserTokens.set(user.email, data.accessToken);
            console.log(`Logged in existing user: ${user.email}`);
          }
        } else {
          const errorText = await registerResponse.text();
          console.warn(`Failed to create user ${user.email}: ${registerResponse.status} - ${errorText}`);
        }
      } catch (userError) {
        console.error(`Error creating user ${user.email}:`, userError.message);
      }
    }

    console.log(`Test users setup completed (${testUserTokens.size} users ready)`);
  } catch (error) {
    console.error('Failed to create test users:', error);
    console.warn('Tests may fail if authentication service is not available');
  }
}

export default globalSetup;

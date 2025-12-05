import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

/**
 * Global teardown script
 * Runs once after all tests complete
 * - Cleans up test data
 * - Removes temporary files
 * - Closes database connections
 */
async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');

  // Clean up test database
  await cleanupTestDatabase();

  // Clean up authentication files
  await cleanupAuthFiles();

  // Clean up temporary test files
  await cleanupTempFiles();

  console.log('Global teardown completed');
}

/**
 * Remove authentication state files
 */
async function cleanupAuthFiles() {
  console.log('Cleaning up authentication files...');

  const authDir = path.join(__dirname, '.auth');

  try {
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
      console.log('Authentication files cleaned up');
    }
  } catch (error) {
    console.error('Failed to cleanup authentication files:', error);
  }
}

/**
 * Clean up test database
 * Removes test data and resets sequences
 */
async function cleanupTestDatabase() {
  console.log('Cleaning up test database...');

  const testDatabaseUrl = process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/jobpilot_test';

  // Skip cleanup if SKIP_DB_CLEANUP is set (useful for debugging)
  if (process.env.SKIP_DB_CLEANUP === 'true') {
    console.log('Skipping database cleanup (SKIP_DB_CLEANUP=true)');
    return;
  }

  try {
    const client = new Client({ connectionString: testDatabaseUrl });

    try {
      await client.connect();
      console.log('Connected to test database for cleanup');

      // Get all tables
      const tablesResult = await client.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename != 'migrations'
        AND tablename != 'typeorm_metadata'
      `);

      if (tablesResult.rows.length === 0) {
        console.log('No tables to clean up');
        return;
      }

      // Disable foreign key checks temporarily
      await client.query('SET session_replication_role = replica;');

      // Clear test data from all tables
      console.log(`Clearing test data from ${tablesResult.rows.length} tables...`);

      for (const row of tablesResult.rows) {
        const tableName = row.tablename;
        try {
          // Truncate table and restart identity sequences
          await client.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
          console.log(`Cleared table: ${tableName}`);
        } catch (truncateError) {
          console.warn(`Could not clear ${tableName}:`, truncateError.message);
        }
      }

      // Re-enable foreign key checks
      await client.query('SET session_replication_role = DEFAULT;');

      // Reset all sequences to start value
      console.log('Resetting sequences...');

      const sequencesResult = await client.query(`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
      `);

      for (const row of sequencesResult.rows) {
        const sequenceName = row.sequence_name;
        try {
          await client.query(`ALTER SEQUENCE "${sequenceName}" RESTART WITH 1`);
          console.log(`Reset sequence: ${sequenceName}`);
        } catch (seqError) {
          console.warn(`Could not reset sequence ${sequenceName}:`, seqError.message);
        }
      }

      // Verify cleanup
      const totalRowsResult = await client.query(`
        SELECT
          schemaname,
          tablename,
          (SELECT COUNT(*) FROM "${tablename}") as row_count
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename != 'migrations'
        AND tablename != 'typeorm_metadata'
      `);

      let totalRows = 0;
      for (const row of totalRowsResult.rows) {
        totalRows += parseInt(row.row_count);
        if (parseInt(row.row_count) > 0) {
          console.log(`Warning: Table ${row.tablename} still has ${row.row_count} rows`);
        }
      }

      console.log(`Database cleanup completed. Total rows remaining: ${totalRows}`);

    } finally {
      await client.end();
      console.log('Database connection closed');
    }

  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    console.warn('Database cleanup failed, but tests completed');
    // Don't throw - teardown should continue even if cleanup fails
  }
}

/**
 * Clean up temporary files created during tests
 */
async function cleanupTempFiles() {
  console.log('Cleaning up temporary files...');

  const tempDirs = [
    path.join(__dirname, '../test-results'),
    path.join(__dirname, '../downloads'),
    path.join(__dirname, '../playwright-report'),
  ];

  for (const dir of tempDirs) {
    try {
      if (fs.existsSync(dir)) {
        // Option 1: Remove entire directory (uncomment if desired)
        // fs.rmSync(dir, { recursive: true, force: true });
        // console.log(`Removed directory: ${dir}`);

        // Option 2: Keep directories but remove old files (default)
        const files = fs.readdirSync(dir);
        let removedCount = 0;

        for (const file of files) {
          const filePath = path.join(dir, file);
          try {
            const stat = fs.statSync(filePath);

            // Remove files older than 7 days
            const ageInDays = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24);
            if (ageInDays > 7) {
              if (stat.isFile()) {
                fs.unlinkSync(filePath);
                removedCount++;
              } else if (stat.isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
                removedCount++;
              }
            }
          } catch (fileError) {
            console.warn(`Could not remove ${filePath}:`, fileError.message);
          }
        }

        if (removedCount > 0) {
          console.log(`Removed ${removedCount} old items from ${dir}`);
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup ${dir}:`, error);
    }
  }

  console.log('Temporary files cleaned up');
}

export default globalTeardown;

/**
 * Database utility functions for E2E tests
 * Provides helper methods for database operations during testing
 */

import { Client, Pool } from 'pg';

/**
 * Database connection pool for test operations
 */
let pool: Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getTestDatabasePool(): Pool {
  if (!pool) {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/jobpilot_test';

    pool = new Pool({
      connectionString: testDatabaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  return pool;
}

/**
 * Close database connection pool
 */
export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Execute a raw SQL query
 */
export async function executeQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const pool = getTestDatabasePool();
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Clear all data from a specific table
 */
export async function clearTable(tableName: string): Promise<void> {
  const pool = getTestDatabasePool();
  await pool.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
}

/**
 * Clear data from multiple tables
 */
export async function clearTables(tableNames: string[]): Promise<void> {
  const pool = getTestDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SET session_replication_role = replica;');

    for (const tableName of tableNames) {
      await client.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
    }

    await client.query('SET session_replication_role = DEFAULT;');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get count of rows in a table
 */
export async function getTableRowCount(tableName: string): Promise<number> {
  const pool = getTestDatabasePool();
  const result = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
  return parseInt(result.rows[0].count);
}

/**
 * Check if a record exists in a table
 */
export async function recordExists(
  tableName: string,
  conditions: Record<string, any>
): Promise<boolean> {
  const pool = getTestDatabasePool();

  const whereClause = Object.keys(conditions)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(' AND ');

  const values = Object.values(conditions);

  const result = await pool.query(
    `SELECT 1 FROM "${tableName}" WHERE ${whereClause} LIMIT 1`,
    values
  );

  return result.rowCount > 0;
}

/**
 * Insert a test record into a table
 */
export async function insertTestRecord<T = any>(
  tableName: string,
  data: Record<string, any>
): Promise<T> {
  const pool = getTestDatabasePool();

  const columns = Object.keys(data).map(col => `"${col}"`).join(', ');
  const values = Object.values(data);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

  const result = await pool.query(
    `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * Update a test record in a table
 */
export async function updateTestRecord<T = any>(
  tableName: string,
  id: string | number,
  data: Record<string, any>
): Promise<T> {
  const pool = getTestDatabasePool();

  const setClause = Object.keys(data)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(', ');

  const values = [...Object.values(data), id];

  const result = await pool.query(
    `UPDATE "${tableName}" SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * Delete a test record from a table
 */
export async function deleteTestRecord(
  tableName: string,
  id: string | number
): Promise<void> {
  const pool = getTestDatabasePool();
  await pool.query(`DELETE FROM "${tableName}" WHERE id = $1`, [id]);
}

/**
 * Find records in a table with conditions
 */
export async function findRecords<T = any>(
  tableName: string,
  conditions: Record<string, any> = {}
): Promise<T[]> {
  const pool = getTestDatabasePool();

  if (Object.keys(conditions).length === 0) {
    const result = await pool.query(`SELECT * FROM "${tableName}"`);
    return result.rows;
  }

  const whereClause = Object.keys(conditions)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(' AND ');

  const values = Object.values(conditions);

  const result = await pool.query(
    `SELECT * FROM "${tableName}" WHERE ${whereClause}`,
    values
  );

  return result.rows;
}

/**
 * Find a single record in a table
 */
export async function findOneRecord<T = any>(
  tableName: string,
  conditions: Record<string, any>
): Promise<T | null> {
  const records = await findRecords<T>(tableName, conditions);
  return records.length > 0 ? records[0] : null;
}

/**
 * Reset a specific sequence
 */
export async function resetSequence(
  sequenceName: string,
  startValue: number = 1
): Promise<void> {
  const pool = getTestDatabasePool();
  await pool.query(`ALTER SEQUENCE "${sequenceName}" RESTART WITH ${startValue}`);
}

/**
 * Get all table names in the public schema
 */
export async function getAllTableNames(): Promise<string[]> {
  const pool = getTestDatabasePool();

  const result = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename != 'migrations'
    AND tablename != 'typeorm_metadata'
  `);

  return result.rows.map(row => row.tablename);
}

/**
 * Create a database transaction for test isolation
 */
export async function withTransaction<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const pool = getTestDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Seed test data into database
 */
export async function seedTestData(
  tableName: string,
  records: Record<string, any>[]
): Promise<void> {
  const pool = getTestDatabasePool();

  for (const record of records) {
    await insertTestRecord(tableName, record);
  }
}

/**
 * Get database statistics for debugging
 */
export async function getDatabaseStats(): Promise<{
  tables: Array<{ name: string; rowCount: number }>;
  totalRows: number;
}> {
  const tableNames = await getAllTableNames();
  const tables = [];
  let totalRows = 0;

  for (const tableName of tableNames) {
    const count = await getTableRowCount(tableName);
    tables.push({ name: tableName, rowCount: count });
    totalRows += count;
  }

  return { tables, totalRows };
}

/**
 * Verify database connection
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    const pool = getTestDatabasePool();
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

# E2E Test Database Setup Implementation

This document summarizes the complete implementation of the E2E test database setup and teardown functionality.

## Files Modified

### 1. `e2e/global-setup.ts`

**Location**: Line 70 (setupTestDatabase function)

**Implemented Features**:

- **Database Connection**: Connects to PostgreSQL using `TEST_DATABASE_URL` environment variable
- **Database Creation**: Automatically creates test database if it doesn't exist
- **Migration Execution**: Runs TypeORM migrations using DataSource
- **Data Cleanup**: Clears all existing test data from tables
- **Foreign Key Management**: Temporarily disables foreign key constraints during cleanup
- **Error Handling**: Graceful error handling with informative logging

**Key Functions**:

```typescript
async function setupTestDatabase() {
  // Creates test database if needed
  // Runs migrations
  // Clears existing test data
}

async function createTestUsers() {
  // Creates test users via API calls
  // Stores authentication tokens
  // Handles existing users gracefully
}
```

**Test Users Created**:
- `test@example.com` / `TestPassword123!`
- `admin@example.com` / `AdminPassword123!`

### 2. `e2e/global-teardown.ts`

**Location**: Line 52 (cleanupTestDatabase function)

**Implemented Features**:

- **Data Removal**: Truncates all tables with CASCADE
- **Sequence Reset**: Resets all database sequences to start values
- **Connection Cleanup**: Properly closes database connections
- **Verification**: Verifies cleanup by counting remaining rows
- **Skip Option**: Optional cleanup skip via `SKIP_DB_CLEANUP` env var
- **Non-Blocking**: Errors don't prevent teardown completion

**Key Functions**:

```typescript
async function cleanupTestDatabase() {
  // Truncates all tables
  // Resets sequences
  // Verifies cleanup
  // Closes connections
}

async function cleanupTempFiles() {
  // Removes old test artifacts
  // Keeps recent files
}
```

### 3. `e2e/.env.example`

**New File**: Complete environment configuration template

**Sections Included**:

1. **Database Configuration**
   - `TEST_DATABASE_URL`
   - `SKIP_DB_CLEANUP`

2. **API Configuration**
   - `TEST_API_URL`
   - `BASE_URL`
   - All service URLs

3. **Test User Configuration**
   - Test user credentials
   - Admin user credentials

4. **Test Execution Configuration**
   - `HEADLESS`
   - `WORKERS`
   - `TEST_TIMEOUT`
   - `RETRIES`

5. **Debugging and Logging**
   - `DEBUG`
   - `SHOW_BROWSER_CONSOLE`
   - `RECORD_VIDEO`
   - `SCREENSHOT`

6. **CI/CD Configuration**
   - `CI`
   - `CI_PROVIDER`

7. **Feature Flags**
   - Individual test suite toggles

8. **Performance Testing**
   - Response time limits
   - Page load time limits

## New Utility Files

### 4. `e2e/utils/database.ts`

**Purpose**: Database utility functions for E2E tests

**Key Functions**:

```typescript
// Connection management
getTestDatabasePool(): Pool
closeDatabasePool(): Promise<void>

// Data manipulation
clearTable(tableName: string): Promise<void>
clearTables(tableNames: string[]): Promise<void>
insertTestRecord(tableName: string, data: Record<string, any>): Promise<T>
updateTestRecord(tableName: string, id: string | number, data: Record<string, any>): Promise<T>
deleteTestRecord(tableName: string, id: string | number): Promise<void>

// Queries
findRecords<T>(tableName: string, conditions: Record<string, any>): Promise<T[]>
findOneRecord<T>(tableName: string, conditions: Record<string, any>): Promise<T | null>
executeQuery<T>(query: string, params?: any[]): Promise<T[]>

// Utilities
getTableRowCount(tableName: string): Promise<number>
recordExists(tableName: string, conditions: Record<string, any>): Promise<boolean>
resetSequence(sequenceName: string, startValue?: number): Promise<void>
getAllTableNames(): Promise<string[]>
getDatabaseStats(): Promise<{tables: Array<{name: string; rowCount: number}>; totalRows: number}>

// Transactions
withTransaction<T>(callback: (client: Client) => Promise<T>): Promise<T>

// Seeding
seedTestData(tableName: string, records: Record<string, any>[]): Promise<void>

// Health check
verifyDatabaseConnection(): Promise<boolean>
```

### 5. `e2e/utils/api.ts`

**Purpose**: API utility functions for E2E tests

**Key Functions**:

```typescript
// Generic API calls
apiRequest<T>(method: string, endpoint: string, options: {...}): Promise<ApiResponse<T>>
apiGet<T>(endpoint: string, options?: {...}): Promise<ApiResponse<T>>
apiPost<T>(endpoint: string, data?: any, options?: {...}): Promise<ApiResponse<T>>
apiPut<T>(endpoint: string, data?: any, options?: {...}): Promise<ApiResponse<T>>
apiPatch<T>(endpoint: string, data?: any, options?: {...}): Promise<ApiResponse<T>>
apiDelete<T>(endpoint: string, options?: {...}): Promise<ApiResponse<T>>

// Authentication helpers
authApi.register(userData: {...}): Promise<ApiResponse<{...}>>
authApi.login(credentials: {...}): Promise<ApiResponse<{...}>>
authApi.logout(token: string): Promise<ApiResponse<{...}>>
authApi.getProfile(token: string): Promise<ApiResponse<any>>
authApi.refreshToken(refreshToken: string): Promise<ApiResponse<{...}>>
authApi.verifyEmail(token: string): Promise<ApiResponse<{...}>>
authApi.forgotPassword(email: string): Promise<ApiResponse<{...}>>
authApi.resetPassword(token: string, newPassword: string): Promise<ApiResponse<{...}>>

// User helpers
userApi.getUser(userId: string, token: string): Promise<ApiResponse<any>>
userApi.updateUser(userId: string, data: any, token: string): Promise<ApiResponse<any>>
userApi.deleteUser(userId: string, token: string): Promise<ApiResponse<void>>

// Test utilities
waitForApi(maxAttempts?: number, interval?: number): Promise<boolean>
createTestUser(overrides?: {...}): Promise<{...}>
deleteTestUser(email: string, token: string): Promise<void>

// Assertions
assertApiStatus(response: ApiResponse, expectedStatus: number, message?: string): void
assertApiSuccess(response: ApiResponse, message?: string): void
assertApiData<T>(response: ApiResponse<T>, message?: string): asserts response
```

### 6. `e2e/README.md`

**Purpose**: Comprehensive documentation for E2E testing

**Sections**:

1. Overview
2. Setup instructions
3. Configuration guide
4. Running tests
5. Database management
6. Test utilities
7. Writing tests
8. Debugging
9. CI/CD integration
10. Troubleshooting
11. Best practices

## Technical Implementation Details

### Database Connection

- Uses `pg` (node-postgres) library for PostgreSQL connections
- Connection pooling for efficient resource usage
- Automatic connection cleanup in teardown
- Support for environment variable configuration

### Migration Handling

- Uses TypeORM DataSource for migration execution
- Graceful fallback if migrations fail
- Supports both migration-based and synchronize-based schemas
- Transaction support for atomic operations

### Data Cleanup Strategy

1. **Setup Phase**:
   - Connect to admin database (postgres)
   - Check if test database exists
   - Create database if needed
   - Run migrations on test database
   - Truncate all existing data

2. **Teardown Phase**:
   - Connect to test database
   - Disable foreign key constraints
   - Truncate all tables with CASCADE
   - Reset all sequences to 1
   - Re-enable foreign key constraints
   - Verify cleanup by counting rows
   - Close connections

### Test User Management

1. **User Creation**:
   - Makes API calls to auth service register endpoint
   - Stores access tokens for later use
   - Handles existing users gracefully
   - Supports both new registration and existing login

2. **User Cleanup**:
   - Automatic cleanup via table truncation
   - Optional manual cleanup via API

### Error Handling

- Try-catch blocks for all database operations
- Informative error messages with context
- Non-blocking errors in teardown
- Connection cleanup in finally blocks
- Graceful degradation if services unavailable

## Environment Variables

### Required

- `TEST_DATABASE_URL`: PostgreSQL connection string for test database
  - Default: `postgresql://postgres:postgres@localhost:5432/jobpilot_test`

- `TEST_API_URL`: Base URL for API calls
  - Default: `http://localhost:3001/api/v1`

### Optional

- `BASE_URL`: Base URL for web application
  - Default: `http://localhost:3000`

- `SKIP_DB_CLEANUP`: Skip database cleanup after tests
  - Default: `false`
  - Set to `true` for debugging

## Usage Examples

### Basic Setup

```bash
# 1. Copy environment file
cp e2e/.env.example e2e/.env

# 2. Update TEST_DATABASE_URL if needed
# Edit e2e/.env

# 3. Run tests
npx playwright test
```

### Using Database Utilities in Tests

```typescript
import { test, expect } from '@playwright/test';
import { clearTable, insertTestRecord, findRecords } from '../utils/database';

test('should create and find user', async () => {
  // Clear users table
  await clearTable('users');

  // Insert test user
  const user = await insertTestRecord('users', {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  });

  // Find user
  const users = await findRecords('users', { email: 'test@example.com' });

  expect(users).toHaveLength(1);
  expect(users[0].email).toBe('test@example.com');
});
```

### Using API Utilities in Tests

```typescript
import { test, expect } from '@playwright/test';
import { authApi, createTestUser, assertApiSuccess } from '../utils/api';

test('should register and login user', async () => {
  // Create test user
  const testUser = await createTestUser({
    email: 'test@example.com',
    password: 'TestPassword123!',
  });

  // User is already logged in with token
  expect(testUser.accessToken).toBeDefined();

  // Get profile
  const profile = await authApi.getProfile(testUser.accessToken);

  assertApiSuccess(profile);
  expect(profile.data.email).toBe('test@example.com');
});
```

### Debugging with Database Inspection

```bash
# Run tests without cleanup
SKIP_DB_CLEANUP=true npx playwright test

# Inspect database
psql -U postgres jobpilot_test

# Check user table
SELECT * FROM users;

# Check all tables
\dt
```

## Dependencies Required

The following npm packages are required (should already be in package.json):

```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "typeorm": "^0.3.19"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/pg": "^8.10.9"
  }
}
```

## Benefits

1. **Automated Setup**: No manual database preparation needed
2. **Test Isolation**: Each test run starts with clean state
3. **Reproducibility**: Consistent test environment
4. **Debugging Support**: Optional cleanup skip for investigation
5. **Error Resilience**: Graceful error handling
6. **Comprehensive Utilities**: Rich set of helper functions
7. **Documentation**: Clear usage examples and guides
8. **CI/CD Ready**: Works in automated environments
9. **Type Safety**: Full TypeScript support
10. **Performance**: Connection pooling and optimized queries

## Next Steps

1. **Install Dependencies** (if not already installed):
   ```bash
   npm install pg @types/pg typeorm
   ```

2. **Configure Environment**:
   ```bash
   cp e2e/.env.example e2e/.env
   # Edit e2e/.env with your configuration
   ```

3. **Run Tests**:
   ```bash
   npx playwright test
   ```

4. **Check Results**:
   ```bash
   npx playwright show-report
   ```

## Troubleshooting

### Issue: "Database does not exist"

**Solution**: The setup script will create it automatically, but ensure PostgreSQL is running:

```bash
# Check PostgreSQL status
pg_isready

# Start PostgreSQL if needed
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
```

### Issue: "Connection refused"

**Solution**: Verify PostgreSQL is accessible:

```bash
psql -U postgres -h localhost -p 5432
```

Update `TEST_DATABASE_URL` if using different credentials.

### Issue: "Migration failed"

**Solution**: This is expected if using synchronize mode. The setup handles this gracefully.

### Issue: "Test users not created"

**Solution**: Ensure auth service is running:

```bash
curl http://localhost:3001/api/v1/health
```

Start auth service if needed:

```bash
cd services/auth-service
npm run start:dev
```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review `e2e/README.md` for detailed documentation
3. Inspect test logs for specific errors
4. Use `SKIP_DB_CLEANUP=true` to debug database state
5. Enable verbose logging with `DEBUG=pw:api`

## Summary

The E2E test database setup and teardown has been fully implemented with:

- Automatic database creation and migration
- Test user creation via API
- Comprehensive cleanup and reset
- Rich utility functions for database and API operations
- Complete documentation and examples
- Robust error handling
- CI/CD ready configuration

All TODOs in the original files have been replaced with working implementations.

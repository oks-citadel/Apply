/**
 * Group Reconciliation Script
 *
 * This script reconciles user subscription tiers with B2C security groups.
 * It fetches all users from the database, compares their subscription status
 * with their B2C group memberships, and fixes any discrepancies.
 *
 * Usage:
 *   npx ts-node scripts/self-healing/reconcile-groups.ts [--dry-run] [--user <userId>]
 *
 * Options:
 *   --dry-run   Show what would be changed without making changes
 *   --user      Reconcile a specific user only
 */

import { Logger } from '@nestjs/common';

// Type definitions
interface User {
  id: string;
  oid: string; // Azure AD Object ID
  email: string;
  subscriptionTier: SubscriptionTier;
  isVerified: boolean;
  isSuspended: boolean;
  subscription?: {
    status: 'active' | 'cancelled' | 'expired' | 'past_due';
    endDate?: Date;
  };
}

enum SubscriptionTier {
  FREEMIUM = 'FREEMIUM',
  STARTER = 'STARTER',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ADVANCED_CAREER = 'ADVANCED_CAREER',
  EXECUTIVE_ELITE = 'EXECUTIVE_ELITE',
}

interface GroupConfig {
  [key: string]: string;
}

interface ReconciliationResult {
  userId: string;
  email: string;
  expectedTier: string;
  actualGroups: string[];
  actions: string[];
  status: 'ok' | 'fixed' | 'error';
  error?: string;
}

class GroupReconciliationService {
  private readonly logger = new Logger('GroupReconciliation');
  private readonly dryRun: boolean;
  private readonly graphBaseUrl = 'https://graph.microsoft.com/v1.0';
  private accessToken: string | null = null;
  private readonly groupConfig: GroupConfig;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;

    // Load group IDs from environment
    this.groupConfig = {
      freemium: process.env.GROUP_ID_FREEMIUM || '',
      starter: process.env.GROUP_ID_STARTER || '',
      basic: process.env.GROUP_ID_BASIC || '',
      professional: process.env.GROUP_ID_PROFESSIONAL || '',
      advanced_career: process.env.GROUP_ID_ADVANCED_CAREER || '',
      executive_elite: process.env.GROUP_ID_EXECUTIVE_ELITE || '',
      verified: process.env.GROUP_ID_VERIFIED || '',
      suspended: process.env.GROUP_ID_SUSPENDED || '',
    };
  }

  /**
   * Run reconciliation for all users or a specific user
   */
  async reconcile(specificUserId?: string): Promise<ReconciliationResult[]> {
    this.logger.log('Starting group reconciliation...');
    this.logger.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}`);

    const results: ReconciliationResult[] = [];

    try {
      // Get access token
      await this.getAccessToken();

      // Fetch users from database
      const users = await this.fetchUsers(specificUserId);
      this.logger.log(`Found ${users.length} user(s) to reconcile`);

      for (const user of users) {
        const result = await this.reconcileUser(user);
        results.push(result);

        // Log progress
        const status = result.status === 'ok' ? '✓' : result.status === 'fixed' ? '⚡' : '✗';
        this.logger.log(`${status} ${user.email}: ${result.status}`);
        if (result.actions.length > 0) {
          result.actions.forEach((action) => this.logger.log(`  - ${action}`));
        }
      }

      // Summary
      const summary = {
        total: results.length,
        ok: results.filter((r) => r.status === 'ok').length,
        fixed: results.filter((r) => r.status === 'fixed').length,
        errors: results.filter((r) => r.status === 'error').length,
      };

      this.logger.log('');
      this.logger.log('=== Reconciliation Summary ===');
      this.logger.log(`Total users: ${summary.total}`);
      this.logger.log(`Already correct: ${summary.ok}`);
      this.logger.log(`Fixed: ${summary.fixed}`);
      this.logger.log(`Errors: ${summary.errors}`);

      return results;
    } catch (error) {
      this.logger.error('Reconciliation failed', error);
      throw error;
    }
  }

  /**
   * Reconcile a single user's group memberships
   */
  private async reconcileUser(user: User): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
      userId: user.id,
      email: user.email,
      expectedTier: user.subscriptionTier,
      actualGroups: [],
      actions: [],
      status: 'ok',
    };

    try {
      // Get user's current group memberships
      const currentGroups = await this.getUserGroups(user.oid);
      result.actualGroups = currentGroups;

      // Determine expected group
      const expectedTierKey = user.subscriptionTier.toLowerCase();
      const expectedGroupId = this.groupConfig[expectedTierKey];

      // Check suspended status
      const suspendedGroupId = this.groupConfig.suspended;
      const isInSuspendedGroup = suspendedGroupId && currentGroups.includes(suspendedGroupId);

      if (user.isSuspended) {
        // User should be in suspended group, not in any tier group
        if (!isInSuspendedGroup) {
          result.actions.push(`Add to suspended group`);
          if (!this.dryRun) {
            await this.addUserToGroup(user.oid, suspendedGroupId);
          }
          result.status = 'fixed';
        }

        // Remove from all tier groups
        for (const [tier, groupId] of Object.entries(this.groupConfig)) {
          if (groupId && tier !== 'suspended' && tier !== 'verified' && currentGroups.includes(groupId)) {
            result.actions.push(`Remove from ${tier} group`);
            if (!this.dryRun) {
              await this.removeUserFromGroup(user.oid, groupId);
            }
            result.status = 'fixed';
          }
        }
      } else {
        // User should NOT be in suspended group
        if (isInSuspendedGroup) {
          result.actions.push(`Remove from suspended group`);
          if (!this.dryRun) {
            await this.removeUserFromGroup(user.oid, suspendedGroupId);
          }
          result.status = 'fixed';
        }

        // User should be in their tier group
        if (expectedGroupId && !currentGroups.includes(expectedGroupId)) {
          result.actions.push(`Add to ${expectedTierKey} group`);
          if (!this.dryRun) {
            await this.addUserToGroup(user.oid, expectedGroupId);
          }
          result.status = 'fixed';
        }

        // Remove from wrong tier groups
        for (const [tier, groupId] of Object.entries(this.groupConfig)) {
          if (
            groupId &&
            tier !== expectedTierKey &&
            tier !== 'verified' &&
            tier !== 'suspended' &&
            currentGroups.includes(groupId)
          ) {
            result.actions.push(`Remove from ${tier} group (wrong tier)`);
            if (!this.dryRun) {
              await this.removeUserFromGroup(user.oid, groupId);
            }
            result.status = 'fixed';
          }
        }
      }

      // Handle verified status
      const verifiedGroupId = this.groupConfig.verified;
      const isInVerifiedGroup = verifiedGroupId && currentGroups.includes(verifiedGroupId);

      if (user.isVerified && !isInVerifiedGroup && !user.isSuspended) {
        result.actions.push(`Add to verified group`);
        if (!this.dryRun) {
          await this.addUserToGroup(user.oid, verifiedGroupId);
        }
        result.status = 'fixed';
      } else if (!user.isVerified && isInVerifiedGroup) {
        result.actions.push(`Remove from verified group`);
        if (!this.dryRun) {
          await this.removeUserFromGroup(user.oid, verifiedGroupId);
        }
        result.status = 'fixed';
      }

      return result;
    } catch (error) {
      result.status = 'error';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Fetch users from the database
   * Connects to PostgreSQL to fetch user subscription data
   */
  private async fetchUsers(specificUserId?: string): Promise<User[]> {
    const databaseUrl = process.env.DATABASE_URL || process.env.AUTH_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL or AUTH_DATABASE_URL not configured');
    }

    // Parse database URL
    const dbConfig = this.parseDatabaseUrl(databaseUrl);

    // Use native pg for direct database access (no ORM dependency in scripts)
    const { Client } = await import('pg');
    const client = new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    try {
      await client.connect();
      this.logger.log('Connected to database');

      // Build query based on whether we're fetching a specific user or all users
      let query = `
        SELECT
          u.id,
          u.oid,
          u.email,
          COALESCE(s.tier, 'FREEMIUM') as "subscriptionTier",
          COALESCE(u.is_verified, false) as "isVerified",
          COALESCE(u.is_suspended, false) as "isSuspended",
          s.status as "subscriptionStatus",
          s.current_period_end as "subscriptionEndDate"
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
      `;

      const params: string[] = [];
      if (specificUserId) {
        query += ' WHERE u.id = $1';
        params.push(specificUserId);
      }

      query += ' ORDER BY u.created_at DESC';

      const result = await client.query(query, params);

      const users: User[] = result.rows.map((row) => ({
        id: row.id,
        oid: row.oid,
        email: row.email,
        subscriptionTier: row.subscriptionTier as SubscriptionTier,
        isVerified: row.isVerified,
        isSuspended: row.isSuspended,
        subscription: row.subscriptionStatus ? {
          status: row.subscriptionStatus,
          endDate: row.subscriptionEndDate ? new Date(row.subscriptionEndDate) : undefined,
        } : undefined,
      }));

      this.logger.log(`Fetched ${users.length} users from database`);
      return users;
    } finally {
      await client.end();
    }
  }

  /**
   * Parse database URL into connection config
   */
  private parseDatabaseUrl(url: string): {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  } {
    // Handle postgres:// or postgresql:// URLs
    const match = url.match(
      /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/
    );

    if (!match) {
      throw new Error('Invalid DATABASE_URL format. Expected: postgres://user:password@host:port/database');
    }

    return {
      user: decodeURIComponent(match[1]),
      password: decodeURIComponent(match[2]),
      host: match[3],
      port: parseInt(match[4], 10),
      database: match[5].split('?')[0], // Remove query params if present
    };
  }

  /**
   * Get user's current B2C group memberships
   */
  private async getUserGroups(userOid: string): Promise<string[]> {
    const response = await fetch(
      `${this.graphBaseUrl}/users/${userOid}/memberOf?$select=id`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get user groups: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value.map((g: { id: string }) => g.id);
  }

  /**
   * Add user to a group
   */
  private async addUserToGroup(userOid: string, groupId: string): Promise<void> {
    if (this.dryRun) return;

    const response = await fetch(`${this.graphBaseUrl}/groups/${groupId}/members/$ref`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        '@odata.id': `${this.graphBaseUrl}/directoryObjects/${userOid}`,
      }),
    });

    if (!response.ok && response.status !== 400) {
      throw new Error(`Failed to add user to group: ${response.statusText}`);
    }
  }

  /**
   * Remove user from a group
   */
  private async removeUserFromGroup(userOid: string, groupId: string): Promise<void> {
    if (this.dryRun) return;

    const response = await fetch(
      `${this.graphBaseUrl}/groups/${groupId}/members/${userOid}/$ref`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to remove user from group: ${response.statusText}`);
    }
  }

  /**
   * Get access token for Microsoft Graph API
   */
  private async getAccessToken(): Promise<void> {
    const tenantId = process.env.AUTOMATION_TENANT_ID;
    const clientId = process.env.AUTOMATION_CLIENT_ID;
    const clientSecret = process.env.AUTOMATION_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Missing Graph API credentials');
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const userIndex = args.indexOf('--user');
  const specificUserId = userIndex !== -1 ? args[userIndex + 1] : undefined;

  const service = new GroupReconciliationService(dryRun);

  try {
    await service.reconcile(specificUserId);
  } catch (error) {
    console.error('Reconciliation failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { GroupReconciliationService };

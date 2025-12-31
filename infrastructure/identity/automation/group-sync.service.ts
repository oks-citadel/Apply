/**
 * B2C Group Sync Service
 *
 * This service synchronizes user subscription tier changes with Azure AD B2C security groups.
 * It uses Microsoft Graph API to add/remove users from groups.
 *
 * Prerequisites:
 * - Azure AD app registration with following Graph API permissions:
 *   - Group.ReadWrite.All (Application)
 *   - User.Read.All (Application)
 * - Admin consent granted for the permissions
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Microsoft Graph API types
interface GraphUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail?: string;
}

interface GraphGroup {
  id: string;
  displayName: string;
  description?: string;
  members?: GraphUser[];
}

interface GraphApiError {
  error: {
    code: string;
    message: string;
    innerError?: {
      'request-id': string;
      date: string;
    };
  };
}

/**
 * Subscription tier names - must match Terraform identity module
 */
export type SubscriptionTierName =
  | 'freemium'
  | 'starter'
  | 'basic'
  | 'professional'
  | 'advanced_career'
  | 'executive_elite';

/**
 * Special group names
 */
export type SpecialGroupName = 'verified' | 'support' | 'admin' | 'super_admin' | 'suspended';

/**
 * Group sync event types
 */
export enum GroupSyncEventType {
  TIER_UPGRADE = 'tier_upgrade',
  TIER_DOWNGRADE = 'tier_downgrade',
  SUBSCRIPTION_CANCEL = 'subscription_cancel',
  VERIFICATION_APPROVED = 'verification_approved',
  VERIFICATION_REVOKED = 'verification_revoked',
  ACCOUNT_SUSPENDED = 'account_suspended',
  ACCOUNT_RESTORED = 'account_restored',
  ADMIN_PROMOTION = 'admin_promotion',
  ADMIN_DEMOTION = 'admin_demotion',
}

/**
 * Group sync event payload
 */
export interface GroupSyncEvent {
  type: GroupSyncEventType;
  userId: string; // Azure AD Object ID (OID)
  email?: string;
  previousTier?: SubscriptionTierName;
  newTier?: SubscriptionTierName;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  correlationId: string;
}

/**
 * Group configuration loaded from environment
 */
interface GroupConfiguration {
  tiers: Record<SubscriptionTierName, string>;
  special: Record<SpecialGroupName, string>;
}

@Injectable()
export class GroupSyncService implements OnModuleInit {
  private readonly logger = new Logger(GroupSyncService.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  // Azure AD / Graph API configuration
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly graphBaseUrl = 'https://graph.microsoft.com/v1.0';

  // Group IDs from Terraform outputs
  private groups: GroupConfiguration;

  constructor(private readonly configService: ConfigService) {
    this.tenantId = this.configService.get<string>('AUTOMATION_TENANT_ID', '');
    this.clientId = this.configService.get<string>('AUTOMATION_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('AUTOMATION_CLIENT_SECRET', '');

    // Load group IDs from environment
    this.groups = {
      tiers: {
        freemium: this.configService.get<string>('GROUP_ID_FREEMIUM', ''),
        starter: this.configService.get<string>('GROUP_ID_STARTER', ''),
        basic: this.configService.get<string>('GROUP_ID_BASIC', ''),
        professional: this.configService.get<string>('GROUP_ID_PROFESSIONAL', ''),
        advanced_career: this.configService.get<string>('GROUP_ID_ADVANCED_CAREER', ''),
        executive_elite: this.configService.get<string>('GROUP_ID_EXECUTIVE_ELITE', ''),
      },
      special: {
        verified: this.configService.get<string>('GROUP_ID_VERIFIED', ''),
        support: this.configService.get<string>('GROUP_ID_SUPPORT', ''),
        admin: this.configService.get<string>('GROUP_ID_ADMIN', ''),
        super_admin: this.configService.get<string>('GROUP_ID_SUPER_ADMIN', ''),
        suspended: this.configService.get<string>('GROUP_ID_SUSPENDED', ''),
      },
    };
  }

  async onModuleInit(): Promise<void> {
    // Validate configuration on startup
    if (!this.tenantId || !this.clientId || !this.clientSecret) {
      this.logger.warn(
        'Group sync service not configured. Set AUTOMATION_TENANT_ID, AUTOMATION_CLIENT_ID, and AUTOMATION_CLIENT_SECRET.',
      );
      return;
    }

    // Validate group IDs
    const missingGroups = Object.entries(this.groups.tiers)
      .filter(([, id]) => !id)
      .map(([name]) => name);

    if (missingGroups.length > 0) {
      this.logger.warn(`Missing group IDs for tiers: ${missingGroups.join(', ')}`);
    }

    // Test authentication
    try {
      await this.getAccessToken();
      this.logger.log('Group sync service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to authenticate with Graph API', error);
    }
  }

  /**
   * Process a group sync event
   */
  async processEvent(event: GroupSyncEvent): Promise<void> {
    this.logger.log(`Processing group sync event: ${event.type} for user ${event.userId}`);

    try {
      switch (event.type) {
        case GroupSyncEventType.TIER_UPGRADE:
        case GroupSyncEventType.TIER_DOWNGRADE:
          await this.handleTierChange(event);
          break;

        case GroupSyncEventType.SUBSCRIPTION_CANCEL:
          await this.handleSubscriptionCancel(event);
          break;

        case GroupSyncEventType.VERIFICATION_APPROVED:
          await this.addUserToGroup(event.userId, this.groups.special.verified);
          break;

        case GroupSyncEventType.VERIFICATION_REVOKED:
          await this.removeUserFromGroup(event.userId, this.groups.special.verified);
          break;

        case GroupSyncEventType.ACCOUNT_SUSPENDED:
          await this.handleAccountSuspension(event);
          break;

        case GroupSyncEventType.ACCOUNT_RESTORED:
          await this.handleAccountRestoration(event);
          break;

        case GroupSyncEventType.ADMIN_PROMOTION:
          if (event.metadata?.role === 'super_admin') {
            await this.addUserToGroup(event.userId, this.groups.special.super_admin);
          } else {
            await this.addUserToGroup(event.userId, this.groups.special.admin);
          }
          break;

        case GroupSyncEventType.ADMIN_DEMOTION:
          await this.removeUserFromGroup(event.userId, this.groups.special.admin);
          await this.removeUserFromGroup(event.userId, this.groups.special.super_admin);
          break;

        default:
          this.logger.warn(`Unknown event type: ${event.type}`);
      }

      this.logger.log(`Successfully processed event ${event.correlationId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process event ${event.correlationId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Handle subscription tier change
   */
  private async handleTierChange(event: GroupSyncEvent): Promise<void> {
    if (!event.previousTier || !event.newTier) {
      throw new Error('Tier change event requires previousTier and newTier');
    }

    const previousGroupId = this.groups.tiers[event.previousTier];
    const newGroupId = this.groups.tiers[event.newTier];

    if (!previousGroupId || !newGroupId) {
      throw new Error(`Invalid tier: ${event.previousTier} or ${event.newTier}`);
    }

    // Remove from old tier group
    await this.removeUserFromGroup(event.userId, previousGroupId);

    // Add to new tier group
    await this.addUserToGroup(event.userId, newGroupId);

    this.logger.log(
      `User ${event.userId} moved from ${event.previousTier} to ${event.newTier}`,
    );
  }

  /**
   * Handle subscription cancellation
   */
  private async handleSubscriptionCancel(event: GroupSyncEvent): Promise<void> {
    if (!event.previousTier) {
      throw new Error('Subscription cancel event requires previousTier');
    }

    const previousGroupId = this.groups.tiers[event.previousTier];
    const freemiumGroupId = this.groups.tiers.freemium;

    if (previousGroupId && previousGroupId !== freemiumGroupId) {
      await this.removeUserFromGroup(event.userId, previousGroupId);
    }

    // Add to freemium group
    await this.addUserToGroup(event.userId, freemiumGroupId);

    this.logger.log(`User ${event.userId} subscription cancelled, moved to freemium`);
  }

  /**
   * Handle account suspension
   */
  private async handleAccountSuspension(event: GroupSyncEvent): Promise<void> {
    // Remove from all tier groups
    for (const groupId of Object.values(this.groups.tiers)) {
      if (groupId) {
        await this.removeUserFromGroup(event.userId, groupId);
      }
    }

    // Remove from verified group if applicable
    if (this.groups.special.verified) {
      await this.removeUserFromGroup(event.userId, this.groups.special.verified);
    }

    // Add to suspended group
    await this.addUserToGroup(event.userId, this.groups.special.suspended);

    this.logger.log(`User ${event.userId} suspended and removed from all access groups`);
  }

  /**
   * Handle account restoration after suspension
   */
  private async handleAccountRestoration(event: GroupSyncEvent): Promise<void> {
    // Remove from suspended group
    await this.removeUserFromGroup(event.userId, this.groups.special.suspended);

    // Restore to appropriate tier (default to freemium if not specified)
    const tier = event.newTier || 'freemium';
    const groupId = this.groups.tiers[tier];

    if (groupId) {
      await this.addUserToGroup(event.userId, groupId);
    }

    this.logger.log(`User ${event.userId} restored and added to ${tier} group`);
  }

  /**
   * Get user's current group memberships
   */
  async getUserGroups(userId: string): Promise<string[]> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.graphBaseUrl}/users/${userId}/memberOf?$select=id,displayName`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as GraphApiError;
      throw new Error(`Failed to get user groups: ${error.error.message}`);
    }

    const data = await response.json();
    return data.value.map((group: GraphGroup) => group.id);
  }

  /**
   * Add user to a security group
   */
  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    if (!groupId) {
      this.logger.warn(`Skipping add to group - group ID not configured`);
      return;
    }

    const token = await this.getAccessToken();

    const response = await fetch(`${this.graphBaseUrl}/groups/${groupId}/members/$ref`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        '@odata.id': `${this.graphBaseUrl}/directoryObjects/${userId}`,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as GraphApiError;

      // Ignore if user is already a member
      if (error.error.code === 'Request_BadRequest' && error.error.message.includes('already exist')) {
        this.logger.debug(`User ${userId} is already a member of group ${groupId}`);
        return;
      }

      throw new Error(`Failed to add user to group: ${error.error.message}`);
    }

    this.logger.debug(`Added user ${userId} to group ${groupId}`);
  }

  /**
   * Remove user from a security group
   */
  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    if (!groupId) {
      this.logger.warn(`Skipping remove from group - group ID not configured`);
      return;
    }

    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.graphBaseUrl}/groups/${groupId}/members/${userId}/$ref`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as GraphApiError;

      // Ignore if user is not a member
      if (error.error.code === 'Request_ResourceNotFound') {
        this.logger.debug(`User ${userId} is not a member of group ${groupId}`);
        return;
      }

      throw new Error(`Failed to remove user from group: ${error.error.message}`);
    }

    this.logger.debug(`Removed user ${userId} from group ${groupId}`);
  }

  /**
   * Reconcile user's group memberships based on their subscription
   */
  async reconcileUserGroups(
    userId: string,
    expectedTier: SubscriptionTierName,
    isVerified: boolean = false,
    isSuspended: boolean = false,
  ): Promise<void> {
    this.logger.log(`Reconciling groups for user ${userId}`);

    const currentGroups = await this.getUserGroups(userId);
    const expectedGroupId = this.groups.tiers[expectedTier];

    // Handle suspended users
    if (isSuspended) {
      await this.processEvent({
        type: GroupSyncEventType.ACCOUNT_SUSPENDED,
        userId,
        timestamp: new Date(),
        correlationId: `reconcile-${userId}-${Date.now()}`,
      });
      return;
    }

    // Remove from wrong tier groups
    for (const [tier, groupId] of Object.entries(this.groups.tiers)) {
      if (groupId && groupId !== expectedGroupId && currentGroups.includes(groupId)) {
        await this.removeUserFromGroup(userId, groupId);
      }
    }

    // Add to correct tier group if not already member
    if (expectedGroupId && !currentGroups.includes(expectedGroupId)) {
      await this.addUserToGroup(userId, expectedGroupId);
    }

    // Handle verified status
    const verifiedGroupId = this.groups.special.verified;
    if (verifiedGroupId) {
      if (isVerified && !currentGroups.includes(verifiedGroupId)) {
        await this.addUserToGroup(userId, verifiedGroupId);
      } else if (!isVerified && currentGroups.includes(verifiedGroupId)) {
        await this.removeUserFromGroup(userId, verifiedGroupId);
      }
    }

    // Ensure not in suspended group
    const suspendedGroupId = this.groups.special.suspended;
    if (suspendedGroupId && currentGroups.includes(suspendedGroupId)) {
      await this.removeUserFromGroup(userId, suspendedGroupId);
    }

    this.logger.log(`Group reconciliation complete for user ${userId}`);
  }

  /**
   * Get access token for Microsoft Graph API
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
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
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000); // Refresh 1 min early

    return this.accessToken as string;
  }

  /**
   * Get group configuration (for debugging/testing)
   */
  getGroupConfiguration(): GroupConfiguration {
    return { ...this.groups };
  }
}

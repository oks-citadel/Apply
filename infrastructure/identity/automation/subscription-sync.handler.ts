/**
 * Subscription Sync Handler
 *
 * This handler listens to subscription-related events from the payment service
 * and triggers group sync operations to keep B2C groups in sync.
 *
 * Integration points:
 * - Payment service webhook events
 * - RabbitMQ/Service Bus message queue
 * - Direct API calls from payment service
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GroupSyncService,
  GroupSyncEvent,
  GroupSyncEventType,
  SubscriptionTierName,
} from './group-sync.service';

/**
 * Subscription event from payment service
 */
export interface SubscriptionEvent {
  eventType: 'subscription.created' | 'subscription.updated' | 'subscription.cancelled' | 'subscription.expired';
  subscriptionId: string;
  userId: string;
  userOid: string; // Azure AD Object ID
  email: string;
  previousTier?: string;
  currentTier: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
  timestamp: string;
  correlationId: string;
  metadata?: Record<string, unknown>;
}

/**
 * User verification event
 */
export interface VerificationEvent {
  eventType: 'verification.approved' | 'verification.revoked' | 'verification.pending';
  userId: string;
  userOid: string;
  email: string;
  verificationType: 'identity' | 'email' | 'phone' | 'employer';
  timestamp: string;
  correlationId: string;
}

/**
 * Account status event
 */
export interface AccountStatusEvent {
  eventType: 'account.suspended' | 'account.restored' | 'account.deleted';
  userId: string;
  userOid: string;
  email: string;
  reason?: string;
  restoredTier?: string;
  timestamp: string;
  correlationId: string;
}

/**
 * Admin role event
 */
export interface AdminRoleEvent {
  eventType: 'admin.promoted' | 'admin.demoted';
  userId: string;
  userOid: string;
  email: string;
  role: 'support' | 'admin' | 'super_admin';
  grantedBy: string;
  timestamp: string;
  correlationId: string;
}

@Injectable()
export class SubscriptionSyncHandler implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionSyncHandler.name);
  private readonly enableSync: boolean;

  constructor(
    private readonly groupSyncService: GroupSyncService,
    private readonly configService: ConfigService,
  ) {
    this.enableSync = this.configService.get<boolean>('ENABLE_GROUP_SYNC', true);
  }

  async onModuleInit(): Promise<void> {
    if (!this.enableSync) {
      this.logger.warn('Group sync is disabled. Set ENABLE_GROUP_SYNC=true to enable.');
      return;
    }

    this.logger.log('Subscription sync handler initialized');
  }

  /**
   * Handle subscription events from payment service
   */
  async handleSubscriptionEvent(event: SubscriptionEvent): Promise<void> {
    if (!this.enableSync) {
      this.logger.debug('Group sync disabled, skipping subscription event');
      return;
    }

    this.logger.log(`Processing subscription event: ${event.eventType} for user ${event.userId}`);

    try {
      const syncEvent = this.mapSubscriptionEvent(event);
      if (syncEvent) {
        await this.groupSyncService.processEvent(syncEvent);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process subscription event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { event },
      );
      throw error;
    }
  }

  /**
   * Handle verification events
   */
  async handleVerificationEvent(event: VerificationEvent): Promise<void> {
    if (!this.enableSync) {
      this.logger.debug('Group sync disabled, skipping verification event');
      return;
    }

    this.logger.log(`Processing verification event: ${event.eventType} for user ${event.userId}`);

    try {
      const syncEvent: GroupSyncEvent = {
        type:
          event.eventType === 'verification.approved'
            ? GroupSyncEventType.VERIFICATION_APPROVED
            : GroupSyncEventType.VERIFICATION_REVOKED,
        userId: event.userOid,
        email: event.email,
        timestamp: new Date(event.timestamp),
        correlationId: event.correlationId,
        metadata: { verificationType: event.verificationType },
      };

      await this.groupSyncService.processEvent(syncEvent);
    } catch (error) {
      this.logger.error(
        `Failed to process verification event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { event },
      );
      throw error;
    }
  }

  /**
   * Handle account status events
   */
  async handleAccountStatusEvent(event: AccountStatusEvent): Promise<void> {
    if (!this.enableSync) {
      this.logger.debug('Group sync disabled, skipping account status event');
      return;
    }

    this.logger.log(`Processing account status event: ${event.eventType} for user ${event.userId}`);

    try {
      const syncEvent: GroupSyncEvent = {
        type:
          event.eventType === 'account.suspended'
            ? GroupSyncEventType.ACCOUNT_SUSPENDED
            : GroupSyncEventType.ACCOUNT_RESTORED,
        userId: event.userOid,
        email: event.email,
        newTier: event.restoredTier as SubscriptionTierName | undefined,
        timestamp: new Date(event.timestamp),
        correlationId: event.correlationId,
        metadata: { reason: event.reason },
      };

      await this.groupSyncService.processEvent(syncEvent);
    } catch (error) {
      this.logger.error(
        `Failed to process account status event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { event },
      );
      throw error;
    }
  }

  /**
   * Handle admin role events
   */
  async handleAdminRoleEvent(event: AdminRoleEvent): Promise<void> {
    if (!this.enableSync) {
      this.logger.debug('Group sync disabled, skipping admin role event');
      return;
    }

    this.logger.log(`Processing admin role event: ${event.eventType} for user ${event.userId}`);

    try {
      const syncEvent: GroupSyncEvent = {
        type:
          event.eventType === 'admin.promoted'
            ? GroupSyncEventType.ADMIN_PROMOTION
            : GroupSyncEventType.ADMIN_DEMOTION,
        userId: event.userOid,
        email: event.email,
        timestamp: new Date(event.timestamp),
        correlationId: event.correlationId,
        metadata: { role: event.role, grantedBy: event.grantedBy },
      };

      await this.groupSyncService.processEvent(syncEvent);
    } catch (error) {
      this.logger.error(
        `Failed to process admin role event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { event },
      );
      throw error;
    }
  }

  /**
   * Map subscription event to group sync event
   */
  private mapSubscriptionEvent(event: SubscriptionEvent): GroupSyncEvent | null {
    const baseSyncEvent: Omit<GroupSyncEvent, 'type'> = {
      userId: event.userOid,
      email: event.email,
      timestamp: new Date(event.timestamp),
      correlationId: event.correlationId,
      metadata: event.metadata,
    };

    switch (event.eventType) {
      case 'subscription.created':
      case 'subscription.updated':
        if (event.status !== 'active' && event.status !== 'trialing') {
          return null;
        }

        const previousTier = this.normalizeTierName(event.previousTier);
        const newTier = this.normalizeTierName(event.currentTier);

        if (!newTier) {
          this.logger.warn(`Unknown tier: ${event.currentTier}`);
          return null;
        }

        const tierOrder = [
          'freemium',
          'starter',
          'basic',
          'professional',
          'advanced_career',
          'executive_elite',
        ];
        const previousIndex = previousTier ? tierOrder.indexOf(previousTier) : 0;
        const newIndex = tierOrder.indexOf(newTier);

        return {
          ...baseSyncEvent,
          type: newIndex > previousIndex ? GroupSyncEventType.TIER_UPGRADE : GroupSyncEventType.TIER_DOWNGRADE,
          previousTier: previousTier || 'freemium',
          newTier,
        };

      case 'subscription.cancelled':
      case 'subscription.expired':
        return {
          ...baseSyncEvent,
          type: GroupSyncEventType.SUBSCRIPTION_CANCEL,
          previousTier: this.normalizeTierName(event.currentTier) || 'freemium',
        };

      default:
        this.logger.warn(`Unknown subscription event type: ${event.eventType}`);
        return null;
    }
  }

  /**
   * Normalize tier name to match our enum
   */
  private normalizeTierName(tier?: string): SubscriptionTierName | null {
    if (!tier) return null;

    const normalized = tier.toLowerCase().replace(/[-\s]/g, '_');

    const tierMap: Record<string, SubscriptionTierName> = {
      free: 'freemium',
      freemium: 'freemium',
      starter: 'starter',
      basic: 'basic',
      pro: 'professional',
      professional: 'professional',
      advanced: 'advanced_career',
      advanced_career: 'advanced_career',
      advancedcareer: 'advanced_career',
      executive: 'executive_elite',
      executive_elite: 'executive_elite',
      executiveelite: 'executive_elite',
      elite: 'executive_elite',
    };

    return tierMap[normalized] || null;
  }

  /**
   * Manually trigger group reconciliation for a user
   * (Used for admin operations or recovery)
   */
  async reconcileUser(
    userOid: string,
    expectedTier: string,
    isVerified: boolean = false,
    isSuspended: boolean = false,
  ): Promise<void> {
    const tier = this.normalizeTierName(expectedTier);
    if (!tier) {
      throw new Error(`Invalid tier: ${expectedTier}`);
    }

    await this.groupSyncService.reconcileUserGroups(userOid, tier, isVerified, isSuspended);
  }

  /**
   * Bulk reconciliation (for periodic consistency checks)
   */
  async bulkReconcile(
    users: Array<{
      userOid: string;
      tier: string;
      isVerified: boolean;
      isSuspended: boolean;
    }>,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const user of users) {
      try {
        await this.reconcileUser(user.userOid, user.tier, user.isVerified, user.isSuspended);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `User ${user.userOid}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    this.logger.log(`Bulk reconciliation complete: ${results.success} success, ${results.failed} failed`);
    return results;
  }
}

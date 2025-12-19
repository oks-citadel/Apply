/**
 * Feature flag types and interfaces
 */

export enum FeatureFlagType {
  BOOLEAN = 'boolean',
  PERCENTAGE = 'percentage',
  USER_LIST = 'user_list',
}

export enum FeatureFlagStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  DEPRECATED = 'deprecated',
}

export interface FeatureFlagConfig {
  name: string;
  key: string;
  description: string;
  type: FeatureFlagType;
  status: FeatureFlagStatus;
  defaultValue: boolean;

  // For percentage rollout
  rolloutPercentage?: number | null;

  // For user-specific flags
  enabledUserIds?: string[];
  disabledUserIds?: string[];

  // Metadata
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeatureFlagEvaluationContext {
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  environment?: string;
  customAttributes?: Record<string, any>;
}

export interface FeatureFlagEvaluationResult {
  enabled: boolean;
  flagKey: string;
  reason: string;
  context?: FeatureFlagEvaluationContext;
}

export interface FeatureFlagServiceOptions {
  cacheEnabled?: boolean;
  cacheTTL?: number; // in seconds
  refreshInterval?: number; // in milliseconds
  defaultEnabled?: boolean;
}

export interface AdminFeatureFlagUpdate {
  status?: FeatureFlagStatus;
  defaultValue?: boolean;
  rolloutPercentage?: number | null;
  enabledUserIds?: string[];
  disabledUserIds?: string[];
  description?: string;
}

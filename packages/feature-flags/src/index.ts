/**
 * Feature Flags Package
 * Comprehensive feature flag system for ApplyForUs AI Platform
 */

// Modules
export { FeatureFlagsModule } from './feature-flags.module';
export { FeatureGatedModule, FeatureGatedModuleOptions, FeatureGatedModuleAsyncOptions } from './feature-gated.module';

// Services
export { FeatureFlagService } from './services/feature-flag.service';
export { FeatureFlagAdminService } from './services/feature-flag-admin.service';
export {
  FeatureGatingService,
  FeatureGatingUserContext,
  FeatureAvailabilityResult,
} from './services/feature-gating.service';

// Entity
export { FeatureFlagEntity } from './entities/feature-flag.entity';

// Guards
export { FeatureFlagGuard } from './guards/feature-flag.guard';
export {
  FeatureGatedGuard,
  FeatureAccessLogger,
  FEATURE_ACCESS_LOGGER,
  RequestWithUser,
  FeatureGatingDeniedResponse,
  InMemoryFeatureAccessLogger,
} from './guards/feature-gated.guard';

// Decorators - Feature Flags
export {
  FeatureFlag,
  RequireAllFlags,
  RequireAnyFlag,
  FEATURE_FLAG_KEY,
} from './decorators/feature-flag.decorator';

// Decorators - Feature Gating (Comprehensive)
export {
  FeatureGated,
  RequireTier,
  RequireFlag,
  RequireAllGatedFlags,
  RequireAnyGatedFlag,
  FEATURE_GATED_KEY,
  SubscriptionTier,
  TIER_HIERARCHY,
  FeatureEntitlement,
  FeatureGatedConfig,
  FeatureGatingResult,
  FEATURE_ENTITLEMENTS,
  hasRequiredTier,
  getTierDisplayName,
} from './decorators/feature-gated.decorator';

// Types
export {
  FeatureFlagType,
  FeatureFlagStatus,
  FeatureFlagConfig,
  FeatureFlagEvaluationContext,
  FeatureFlagEvaluationResult,
  FeatureFlagServiceOptions,
  AdminFeatureFlagUpdate,
} from './types';

// Constants
export {
  FEATURE_FLAGS,
  FeatureFlagKey,
  FEATURE_FLAG_DESCRIPTIONS,
  DEFAULT_CACHE_TTL,
  DEFAULT_REFRESH_INTERVAL,
} from './constants';

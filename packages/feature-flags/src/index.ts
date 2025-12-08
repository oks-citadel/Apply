/**
 * Feature Flags Package
 * Comprehensive feature flag system for JobPilot AI Platform
 */

// Module
export { FeatureFlagsModule } from './feature-flags.module';

// Services
export { FeatureFlagService } from './services/feature-flag.service';
export { FeatureFlagAdminService } from './services/feature-flag-admin.service';

// Entity
export { FeatureFlagEntity } from './entities/feature-flag.entity';

// Guards
export { FeatureFlagGuard } from './guards/feature-flag.guard';

// Decorators
export {
  FeatureFlag,
  RequireAllFlags,
  RequireAnyFlag,
} from './decorators/feature-flag.decorator';

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

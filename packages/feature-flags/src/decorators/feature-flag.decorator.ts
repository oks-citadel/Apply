import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'feature_flag';

/**
 * Decorator to protect routes with feature flags
 * Usage: @FeatureFlag('FEATURE_AUTO_APPLY')
 */
export const FeatureFlag = (flagKey: string) => SetMetadata(FEATURE_FLAG_KEY, flagKey);

/**
 * Multiple feature flags (all must be enabled)
 * Usage: @RequireAllFlags(['FLAG_1', 'FLAG_2'])
 */
export const RequireAllFlags = (flagKeys: string[]) =>
  SetMetadata(FEATURE_FLAG_KEY, { all: flagKeys });

/**
 * Multiple feature flags (at least one must be enabled)
 * Usage: @RequireAnyFlag(['FLAG_1', 'FLAG_2'])
 */
export const RequireAnyFlag = (flagKeys: string[]) =>
  SetMetadata(FEATURE_FLAG_KEY, { any: flagKeys });

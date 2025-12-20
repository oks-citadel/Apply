import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';

interface FeatureFlagProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * FeatureFlag Component
 * Conditionally renders children based on feature flag status
 *
 * @example
 * <FeatureFlag flag="FEATURE_AUTO_APPLY">
 *   <AutoApplyButton />
 * </FeatureFlag>
 */
export function FeatureFlag({
  flag,
  children,
  fallback = null,
  loading = null,
}: FeatureFlagProps) {
  const { isEnabled, isLoading } = useFeatureFlag(flag);

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RequireAllFlagsProps {
  flags: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * RequireAllFlags Component
 * Renders children only if ALL specified flags are enabled
 */
export function RequireAllFlags({
  flags,
  children,
  fallback = null,
  loading = null,
}: RequireAllFlagsProps) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const flagResults = flags.map((flag) => useFeatureFlag(flag));

  const isLoading = flagResults.some((result) => result.isLoading);
  const allEnabled = flagResults.every((result) => result.isEnabled);

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!allEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RequireAnyFlagProps {
  flags: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * RequireAnyFlag Component
 * Renders children if ANY of the specified flags are enabled
 */
export function RequireAnyFlag({
  flags,
  children,
  fallback = null,
  loading = null,
}: RequireAnyFlagProps) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const flagResults = flags.map((flag) => useFeatureFlag(flag));

  const isLoading = flagResults.some((result) => result.isLoading);
  const anyEnabled = flagResults.some((result) => result.isEnabled);

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!anyEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

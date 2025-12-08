import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';

interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
}

interface FeatureFlagEvaluation {
  flagKey: string;
  enabled: boolean;
  reason?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Fetch all enabled features for the current user
 */
async function fetchEnabledFeatures(): Promise<FeatureFlag[]> {
  const response = await axios.get(`${API_URL}/api/features`);
  return response.data;
}

/**
 * Check if a specific feature is enabled
 */
async function checkFeatureEnabled(flagKey: string): Promise<boolean> {
  try {
    const response = await axios.get(`${API_URL}/api/features/${flagKey}`);
    return response.data.enabled;
  } catch (error) {
    logger.error(`Error checking feature ${flagKey}`, error as Error, { flagKey });
    return false;
  }
}

/**
 * Get detailed evaluation for a feature
 */
async function evaluateFeature(flagKey: string): Promise<FeatureFlagEvaluation> {
  const response = await axios.get(`${API_URL}/api/features/${flagKey}/evaluate`);
  return response.data;
}

/**
 * Hook to get all enabled features for the current user
 */
export function useFeatureFlags() {
  const { data, isLoading, error, refetch } = useQuery<FeatureFlag[]>({
    queryKey: ['featureFlags'],
    queryFn: fetchEnabledFeatures,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const isEnabled = useCallback(
    (flagKey: string): boolean => {
      if (!data) return false;
      return data.some((flag) => flag.key === flagKey);
    },
    [data],
  );

  return {
    features: data || [],
    isLoading,
    error,
    isEnabled,
    refetch,
  };
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(flagKey: string) {
  const { data, isLoading, error, refetch } = useQuery<boolean>({
    queryKey: ['featureFlag', flagKey],
    queryFn: () => checkFeatureEnabled(flagKey),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!flagKey,
  });

  return {
    isEnabled: data ?? false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get detailed feature evaluation
 */
export function useFeatureFlagEvaluation(flagKey: string) {
  const { data, isLoading, error, refetch } = useQuery<FeatureFlagEvaluation>({
    queryKey: ['featureFlagEvaluation', flagKey],
    queryFn: () => evaluateFeature(flagKey),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!flagKey,
  });

  return {
    evaluation: data,
    isEnabled: data?.enabled ?? false,
    reason: data?.reason,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Feature flag constants - matches backend
 */
export const FEATURE_FLAGS = {
  // Core Features
  AUTO_APPLY: 'FEATURE_AUTO_APPLY',
  AI_RESUME_BUILDER: 'FEATURE_AI_RESUME_BUILDER',
  ANALYTICS_DASHBOARD: 'FEATURE_ANALYTICS_DASHBOARD',
  CHROME_EXTENSION: 'FEATURE_CHROME_EXTENSION',

  // AI Features
  AI_SUGGESTIONS: 'AI_SUGGESTIONS_ENABLED',
  RESUME_OPTIMIZATION: 'RESUME_OPTIMIZATION_ENABLED',
  SALARY_PREDICTION: 'SALARY_PREDICTION_ENABLED',

  // Platform-specific Auto-Apply
  LINKEDIN_AUTO_APPLY: 'LINKEDIN_AUTO_APPLY_ENABLED',
  INDEED_AUTO_APPLY: 'INDEED_AUTO_APPLY_ENABLED',
  GLASSDOOR_AUTO_APPLY: 'GLASSDOOR_AUTO_APPLY_ENABLED',

  // Additional Features
  EMAIL_NOTIFICATIONS: 'EMAIL_NOTIFICATIONS_ENABLED',
  PUSH_NOTIFICATIONS: 'PUSH_NOTIFICATIONS_ENABLED',
  VERSION_CONTROL: 'ENABLE_VERSION_CONTROL',
  ANALYTICS: 'ENABLE_ANALYTICS',
  VIRUS_SCANNING: 'VIRUS_SCAN_ENABLED',
  AUTO_BACKUP: 'AUTO_BACKUP_ENABLED',

  // Admin Features
  ADMIN_DASHBOARD: 'ADMIN_DASHBOARD_ENABLED',
  USER_IMPERSONATION: 'USER_IMPERSONATION_ENABLED',

  // Premium Features
  PREMIUM_TEMPLATES: 'PREMIUM_TEMPLATES_ENABLED',
  ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS_ENABLED',
  PRIORITY_SUPPORT: 'PRIORITY_SUPPORT_ENABLED',
} as const;

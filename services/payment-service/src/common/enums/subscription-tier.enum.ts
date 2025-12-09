export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export interface SubscriptionTierLimits {
  jobApplicationsPerMonth: number;
  aiGeneratedCoverLetters: number;
  resumeTemplates: number;
  savedJobs: number;
  emailAlerts: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
}

export const SUBSCRIPTION_TIER_LIMITS: Record<SubscriptionTier, SubscriptionTierLimits> = {
  [SubscriptionTier.FREE]: {
    jobApplicationsPerMonth: 10,
    aiGeneratedCoverLetters: 3,
    resumeTemplates: 2,
    savedJobs: 20,
    emailAlerts: false,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
  },
  [SubscriptionTier.BASIC]: {
    jobApplicationsPerMonth: 50,
    aiGeneratedCoverLetters: 20,
    resumeTemplates: 10,
    savedJobs: 100,
    emailAlerts: true,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
  },
  [SubscriptionTier.PRO]: {
    jobApplicationsPerMonth: 200,
    aiGeneratedCoverLetters: 100,
    resumeTemplates: -1, // unlimited
    savedJobs: 500,
    emailAlerts: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: false,
  },
  [SubscriptionTier.ENTERPRISE]: {
    jobApplicationsPerMonth: -1, // unlimited
    aiGeneratedCoverLetters: -1, // unlimited
    resumeTemplates: -1, // unlimited
    savedJobs: -1, // unlimited
    emailAlerts: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: true,
  },
};

export const SUBSCRIPTION_TIER_PRICES = {
  [SubscriptionTier.FREE]: { monthly: 0, yearly: 0 },
  [SubscriptionTier.BASIC]: { monthly: 9.99, yearly: 99.99 },
  [SubscriptionTier.PRO]: { monthly: 29.99, yearly: 299.99 },
  [SubscriptionTier.ENTERPRISE]: { monthly: 99.99, yearly: 999.99 },
};

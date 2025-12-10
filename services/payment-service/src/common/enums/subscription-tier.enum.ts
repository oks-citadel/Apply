export enum SubscriptionTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  BASIC = 'BASIC',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
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
  virtualCoinsPerMonth: number;
  boostVisibilitySlots: number;
  autoApplyEnabled: boolean;
  interviewPrepAccess: boolean;
  salaryInsights: boolean;
  companyInsights: boolean;
  dedicatedAccountManager: boolean;
  apiAccess: boolean;
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
    virtualCoinsPerMonth: 50,
    boostVisibilitySlots: 0,
    autoApplyEnabled: false,
    interviewPrepAccess: false,
    salaryInsights: false,
    companyInsights: false,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  [SubscriptionTier.STARTER]: {
    jobApplicationsPerMonth: 25,
    aiGeneratedCoverLetters: 10,
    resumeTemplates: 5,
    savedJobs: 50,
    emailAlerts: true,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
    virtualCoinsPerMonth: 200,
    boostVisibilitySlots: 1,
    autoApplyEnabled: false,
    interviewPrepAccess: false,
    salaryInsights: false,
    companyInsights: false,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  [SubscriptionTier.BASIC]: {
    jobApplicationsPerMonth: 50,
    aiGeneratedCoverLetters: 25,
    resumeTemplates: 10,
    savedJobs: 100,
    emailAlerts: true,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
    virtualCoinsPerMonth: 500,
    boostVisibilitySlots: 3,
    autoApplyEnabled: true,
    interviewPrepAccess: false,
    salaryInsights: true,
    companyInsights: false,
    dedicatedAccountManager: false,
    apiAccess: false,
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
    virtualCoinsPerMonth: 1500,
    boostVisibilitySlots: 10,
    autoApplyEnabled: true,
    interviewPrepAccess: true,
    salaryInsights: true,
    companyInsights: true,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  [SubscriptionTier.BUSINESS]: {
    jobApplicationsPerMonth: 500,
    aiGeneratedCoverLetters: 300,
    resumeTemplates: -1, // unlimited
    savedJobs: -1, // unlimited
    emailAlerts: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: true,
    virtualCoinsPerMonth: 5000,
    boostVisibilitySlots: 25,
    autoApplyEnabled: true,
    interviewPrepAccess: true,
    salaryInsights: true,
    companyInsights: true,
    dedicatedAccountManager: false,
    apiAccess: true,
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
    virtualCoinsPerMonth: -1, // unlimited
    boostVisibilitySlots: -1, // unlimited
    autoApplyEnabled: true,
    interviewPrepAccess: true,
    salaryInsights: true,
    companyInsights: true,
    dedicatedAccountManager: true,
    apiAccess: true,
  },
};

export const SUBSCRIPTION_TIER_PRICES = {
  [SubscriptionTier.FREE]: { monthly: 0, yearly: 0 },
  [SubscriptionTier.STARTER]: { monthly: 4.99, yearly: 49.99 },
  [SubscriptionTier.BASIC]: { monthly: 9.99, yearly: 99.99 },
  [SubscriptionTier.PRO]: { monthly: 29.99, yearly: 299.99 },
  [SubscriptionTier.BUSINESS]: { monthly: 59.99, yearly: 599.99 },
  [SubscriptionTier.ENTERPRISE]: { monthly: 149.99, yearly: 1499.99 },
};

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  FLUTTERWAVE = 'FLUTTERWAVE',
  PAYSTACK = 'PAYSTACK',
}

export const SUPPORTED_CURRENCIES = {
  [PaymentProvider.STRIPE]: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  [PaymentProvider.FLUTTERWAVE]: ['NGN', 'USD', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'XOF', 'XAF'],
  [PaymentProvider.PAYSTACK]: ['NGN', 'GHS', 'ZAR', 'USD'],
};

export const VIRTUAL_COIN_PACKAGES = [
  { coins: 100, price: 0.99, currency: 'USD', bonus: 0 },
  { coins: 500, price: 4.49, currency: 'USD', bonus: 50 },
  { coins: 1000, price: 7.99, currency: 'USD', bonus: 150 },
  { coins: 2500, price: 17.99, currency: 'USD', bonus: 500 },
  { coins: 5000, price: 32.99, currency: 'USD', bonus: 1250 },
  { coins: 10000, price: 59.99, currency: 'USD', bonus: 3000 },
];

export const BOOST_VISIBILITY_COSTS = {
  basic: { coins: 50, durationHours: 24 },
  premium: { coins: 150, durationHours: 72 },
  featured: { coins: 300, durationHours: 168 }, // 1 week
};

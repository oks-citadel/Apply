export enum SubscriptionTier {
  // Tier 1: Free tier - limited functionality
  FREEMIUM = 'FREEMIUM',
  // Tier 2: Entry paid tier
  STARTER = 'STARTER',
  // Tier 3: Basic paid tier
  BASIC = 'BASIC',
  // Tier 4: Professional tier
  PROFESSIONAL = 'PROFESSIONAL',
  // Tier 5: Advanced Career tier
  ADVANCED_CAREER = 'ADVANCED_CAREER',
  // Tier 6: Executive Elite tier
  EXECUTIVE_ELITE = 'EXECUTIVE_ELITE',
}

// Backwards compatibility aliases (deprecated - use new names)
export const SubscriptionTierAlias = {
  FREE: SubscriptionTier.FREEMIUM,
  PRO: SubscriptionTier.PROFESSIONAL,
  BUSINESS: SubscriptionTier.ADVANCED_CAREER,
  ENTERPRISE: SubscriptionTier.EXECUTIVE_ELITE,
} as const;

// Display names for UI
export const SUBSCRIPTION_TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  [SubscriptionTier.FREEMIUM]: 'Freemium',
  [SubscriptionTier.STARTER]: 'Starter',
  [SubscriptionTier.BASIC]: 'Basic',
  [SubscriptionTier.PROFESSIONAL]: 'Professional',
  [SubscriptionTier.ADVANCED_CAREER]: 'Advanced Career',
  [SubscriptionTier.EXECUTIVE_ELITE]: 'Executive Elite',
};

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
  // Tier 1: Freemium - $0/month
  [SubscriptionTier.FREEMIUM]: {
    jobApplicationsPerMonth: 5,
    aiGeneratedCoverLetters: 2,
    resumeTemplates: 2,
    savedJobs: 10,
    emailAlerts: false,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
    virtualCoinsPerMonth: 25,
    boostVisibilitySlots: 0,
    autoApplyEnabled: false,
    interviewPrepAccess: false,
    salaryInsights: false,
    companyInsights: false,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  // Tier 2: Starter - $23.99/month ($239.99/year)
  [SubscriptionTier.STARTER]: {
    jobApplicationsPerMonth: 30,
    aiGeneratedCoverLetters: 15,
    resumeTemplates: 5,
    savedJobs: 50,
    emailAlerts: true,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
    virtualCoinsPerMonth: 300,
    boostVisibilitySlots: 2,
    autoApplyEnabled: false,
    interviewPrepAccess: false,
    salaryInsights: false,
    companyInsights: false,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  // Tier 3: Basic - $49.99/month ($499.99/year)
  [SubscriptionTier.BASIC]: {
    jobApplicationsPerMonth: 75,
    aiGeneratedCoverLetters: 40,
    resumeTemplates: 10,
    savedJobs: 150,
    emailAlerts: true,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
    virtualCoinsPerMonth: 750,
    boostVisibilitySlots: 5,
    autoApplyEnabled: true,
    interviewPrepAccess: false,
    salaryInsights: true,
    companyInsights: false,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  // Tier 4: Professional - $89.99/month ($899.99/year)
  [SubscriptionTier.PROFESSIONAL]: {
    jobApplicationsPerMonth: 200,
    aiGeneratedCoverLetters: 100,
    resumeTemplates: -1, // unlimited
    savedJobs: 500,
    emailAlerts: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: false,
    virtualCoinsPerMonth: 2000,
    boostVisibilitySlots: 15,
    autoApplyEnabled: true,
    interviewPrepAccess: true,
    salaryInsights: true,
    companyInsights: true,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  // Tier 5: Advanced Career - $149.99/month ($1,499.99/year)
  [SubscriptionTier.ADVANCED_CAREER]: {
    jobApplicationsPerMonth: 500,
    aiGeneratedCoverLetters: 300,
    resumeTemplates: -1, // unlimited
    savedJobs: -1, // unlimited
    emailAlerts: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: true,
    virtualCoinsPerMonth: 5000,
    boostVisibilitySlots: 30,
    autoApplyEnabled: true,
    interviewPrepAccess: true,
    salaryInsights: true,
    companyInsights: true,
    dedicatedAccountManager: false,
    apiAccess: true,
  },
  // Tier 6: Executive Elite - $299.99/month ($2,999.99/year)
  [SubscriptionTier.EXECUTIVE_ELITE]: {
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

// New pricing structure - 2025 rebrand
export const SUBSCRIPTION_TIER_PRICES: Record<SubscriptionTier, { monthly: number; yearly: number }> = {
  [SubscriptionTier.FREEMIUM]: { monthly: 0, yearly: 0 },
  [SubscriptionTier.STARTER]: { monthly: 23.99, yearly: 239.99 },
  [SubscriptionTier.BASIC]: { monthly: 49.99, yearly: 499.99 },
  [SubscriptionTier.PROFESSIONAL]: { monthly: 89.99, yearly: 899.99 },
  [SubscriptionTier.ADVANCED_CAREER]: { monthly: 149.99, yearly: 1499.99 },
  [SubscriptionTier.EXECUTIVE_ELITE]: { monthly: 299.99, yearly: 2999.99 },
};

// Stripe Price IDs - Update these after creating products in Stripe Dashboard
export const STRIPE_PRICE_IDS: Record<SubscriptionTier, { monthly: string; yearly: string }> = {
  [SubscriptionTier.FREEMIUM]: { monthly: '', yearly: '' }, // Free tier - no Stripe price
  [SubscriptionTier.STARTER]: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
  },
  [SubscriptionTier.BASIC]: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || 'price_basic_monthly',
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY || 'price_basic_yearly',
  },
  [SubscriptionTier.PROFESSIONAL]: {
    monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_professional_monthly',
    yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || 'price_professional_yearly',
  },
  [SubscriptionTier.ADVANCED_CAREER]: {
    monthly: process.env.STRIPE_PRICE_ADVANCED_MONTHLY || 'price_advanced_monthly',
    yearly: process.env.STRIPE_PRICE_ADVANCED_YEARLY || 'price_advanced_yearly',
  },
  [SubscriptionTier.EXECUTIVE_ELITE]: {
    monthly: process.env.STRIPE_PRICE_EXECUTIVE_MONTHLY || 'price_executive_monthly',
    yearly: process.env.STRIPE_PRICE_EXECUTIVE_YEARLY || 'price_executive_yearly',
  },
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

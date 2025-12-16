// Subscription Tiers - Synced with backend payment-service
export enum SubscriptionTier {
  FREEMIUM = 'FREEMIUM',
  STARTER = 'STARTER',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ADVANCED_CAREER = 'ADVANCED_CAREER',
  EXECUTIVE_ELITE = 'EXECUTIVE_ELITE',
}

export interface SubscriptionTierConfig {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  features: {
    jobApplicationsPerMonth: number | 'Unlimited';
    aiGeneratedCoverLetters: number | 'Unlimited';
    resumeTemplates: number | 'Unlimited';
    savedJobs: number | 'Unlimited';
    emailAlerts: boolean;
    prioritySupport: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
    virtualCoinsPerMonth: number | 'Unlimited';
    boostVisibilitySlots: number | 'Unlimited';
    autoApplyEnabled: boolean;
    interviewPrepAccess: boolean;
    salaryInsights: boolean;
    companyInsights: boolean;
    dedicatedAccountManager: boolean;
    apiAccess: boolean;
  };
  highlights: string[];
}

export const SUBSCRIPTION_TIERS: SubscriptionTierConfig[] = [
  {
    id: SubscriptionTier.FREEMIUM,
    name: 'Freemium',
    description: 'Perfect for getting started with job applications',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
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
    highlights: [
      '5 job applications/month',
      '2 AI cover letters',
      '2 resume templates',
      'Basic job matching',
    ],
  },
  {
    id: SubscriptionTier.STARTER,
    name: 'Starter',
    description: 'For active job seekers ready to scale up',
    monthlyPrice: 23.99,
    yearlyPrice: 239.99,
    features: {
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
    highlights: [
      '30 job applications/month',
      '15 AI cover letters',
      '5 resume templates',
      'Email alerts',
      '300 virtual coins/month',
    ],
  },
  {
    id: SubscriptionTier.BASIC,
    name: 'Basic',
    description: 'Accelerate your job search with automation',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    features: {
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
    highlights: [
      '75 job applications/month',
      '40 AI cover letters',
      'Auto-apply enabled',
      'Salary insights',
      '750 virtual coins/month',
    ],
  },
  {
    id: SubscriptionTier.PROFESSIONAL,
    name: 'Professional',
    description: 'Maximize your chances with premium features',
    monthlyPrice: 89.99,
    yearlyPrice: 899.99,
    popular: true,
    features: {
      jobApplicationsPerMonth: 200,
      aiGeneratedCoverLetters: 100,
      resumeTemplates: 'Unlimited',
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
    highlights: [
      '200 job applications/month',
      '100 AI cover letters',
      'Unlimited resume templates',
      'Interview prep access',
      'Priority support',
      'Advanced analytics',
    ],
  },
  {
    id: SubscriptionTier.ADVANCED_CAREER,
    name: 'Advanced Career',
    description: 'For serious professionals seeking executive roles',
    monthlyPrice: 149.99,
    yearlyPrice: 1499.99,
    features: {
      jobApplicationsPerMonth: 500,
      aiGeneratedCoverLetters: 300,
      resumeTemplates: 'Unlimited',
      savedJobs: 'Unlimited',
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
    highlights: [
      '500 job applications/month',
      '300 AI cover letters',
      'Custom branding',
      'API access',
      '5,000 virtual coins/month',
      'Unlimited saved jobs',
    ],
  },
  {
    id: SubscriptionTier.EXECUTIVE_ELITE,
    name: 'Executive Elite',
    description: 'White-glove service for C-suite and leadership',
    monthlyPrice: 299.99,
    yearlyPrice: 2999.99,
    features: {
      jobApplicationsPerMonth: 'Unlimited',
      aiGeneratedCoverLetters: 'Unlimited',
      resumeTemplates: 'Unlimited',
      savedJobs: 'Unlimited',
      emailAlerts: true,
      prioritySupport: true,
      advancedAnalytics: true,
      customBranding: true,
      virtualCoinsPerMonth: 'Unlimited',
      boostVisibilitySlots: 'Unlimited',
      autoApplyEnabled: true,
      interviewPrepAccess: true,
      salaryInsights: true,
      companyInsights: true,
      dedicatedAccountManager: true,
      apiAccess: true,
    },
    highlights: [
      'Unlimited applications',
      'Unlimited AI cover letters',
      'Dedicated account manager',
      'Full API access',
      'Unlimited virtual coins',
      'Custom branding',
    ],
  },
];

// Get tier by ID
export function getTierById(id: SubscriptionTier): SubscriptionTierConfig | undefined {
  return SUBSCRIPTION_TIERS.find((tier) => tier.id === id);
}

// Get yearly savings percentage
export function getYearlySavings(tier: SubscriptionTierConfig): number {
  if (tier.monthlyPrice === 0) return 0;
  const monthlyTotal = tier.monthlyPrice * 12;
  return Math.round(((monthlyTotal - tier.yearlyPrice) / monthlyTotal) * 100);
}

// Format price display
export function formatPrice(price: number): string {
  return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
}

// Format feature value
export function formatFeatureValue(value: number | 'Unlimited' | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === 'Unlimited') return 'Unlimited';
  if (value === -1) return 'Unlimited';
  return value.toString();
}

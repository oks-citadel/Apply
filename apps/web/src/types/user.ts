export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  timezone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  mfaEnabled: boolean;
  preferences: UserPreferences;
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  notifications: {
    email: {
      newJobs: boolean;
      applicationUpdates: boolean;
      weeklyDigest: boolean;
      marketingEmails: boolean;
    };
    push: {
      newJobs: boolean;
      applicationUpdates: boolean;
      interviews: boolean;
    };
  };
  jobAlerts: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    filters: {
      jobTitle?: string[];
      location?: string[];
      experienceLevel?: string[];
      employmentType?: string[];
      salaryMin?: number;
    };
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'connections';
    showActivity: boolean;
    allowMessages: boolean;
  };
  autoApply: {
    enabled: boolean;
    maxPerDay: number;
    requireReview: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialEnd?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  usage: {
    resumesUsed: number;
    resumesLimit: number;
    applicationsUsed: number;
    applicationsLimit: number;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: {
    resumes: number | 'unlimited';
    applications: number | 'unlimited';
    aiCredits: number | 'unlimited';
    autoApply: boolean;
    prioritySupport: boolean;
    advancedAnalytics: boolean;
    customTemplates: boolean;
    apiAccess: boolean;
  };
  stripePriceId?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface UpdatePreferencesData {
  notifications?: Partial<UserPreferences['notifications']>;
  jobAlerts?: Partial<UserPreferences['jobAlerts']>;
  privacy?: Partial<UserPreferences['privacy']>;
  autoApply?: Partial<UserPreferences['autoApply']>;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
}

export interface UploadPhotoResponse {
  avatarUrl: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface MfaSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MfaVerification {
  code: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

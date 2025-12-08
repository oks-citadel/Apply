/**
 * Feature flag constants and predefined flags
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

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

export const FEATURE_FLAG_DESCRIPTIONS: Record<string, string> = {
  [FEATURE_FLAGS.AUTO_APPLY]: 'Enable automated job application functionality',
  [FEATURE_FLAGS.AI_RESUME_BUILDER]: 'Enable AI-powered resume building and optimization',
  [FEATURE_FLAGS.ANALYTICS_DASHBOARD]: 'Enable analytics dashboard for job search insights',
  [FEATURE_FLAGS.CHROME_EXTENSION]: 'Enable Chrome extension for quick-apply features',

  [FEATURE_FLAGS.AI_SUGGESTIONS]: 'Enable AI-powered job suggestions and recommendations',
  [FEATURE_FLAGS.RESUME_OPTIMIZATION]: 'Enable AI-powered resume optimization',
  [FEATURE_FLAGS.SALARY_PREDICTION]: 'Enable AI-powered salary prediction for job listings',

  [FEATURE_FLAGS.LINKEDIN_AUTO_APPLY]: 'Enable auto-apply for LinkedIn job postings',
  [FEATURE_FLAGS.INDEED_AUTO_APPLY]: 'Enable auto-apply for Indeed job postings',
  [FEATURE_FLAGS.GLASSDOOR_AUTO_APPLY]: 'Enable auto-apply for Glassdoor job postings',

  [FEATURE_FLAGS.EMAIL_NOTIFICATIONS]: 'Enable email notifications for application updates',
  [FEATURE_FLAGS.PUSH_NOTIFICATIONS]: 'Enable push notifications for real-time updates',
  [FEATURE_FLAGS.VERSION_CONTROL]: 'Enable version control for resumes',
  [FEATURE_FLAGS.ANALYTICS]: 'Enable analytics tracking and reporting',
  [FEATURE_FLAGS.VIRUS_SCANNING]: 'Enable virus scanning for uploaded files',
  [FEATURE_FLAGS.AUTO_BACKUP]: 'Enable automatic backup of user data',

  [FEATURE_FLAGS.ADMIN_DASHBOARD]: 'Enable admin dashboard for platform management',
  [FEATURE_FLAGS.USER_IMPERSONATION]: 'Enable user impersonation for admin support',

  [FEATURE_FLAGS.PREMIUM_TEMPLATES]: 'Enable premium resume templates',
  [FEATURE_FLAGS.ADVANCED_ANALYTICS]: 'Enable advanced analytics and insights',
  [FEATURE_FLAGS.PRIORITY_SUPPORT]: 'Enable priority customer support',
};

export const DEFAULT_CACHE_TTL = 300; // 5 minutes in seconds
export const DEFAULT_REFRESH_INTERVAL = 60000; // 1 minute in milliseconds

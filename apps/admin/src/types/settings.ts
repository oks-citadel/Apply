export interface GeneralSettings {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  timezone: string;
  language: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  maxLoginAttempts: number;
  requireStrongPassword: boolean;
}

export interface SettingsResponse {
  general?: GeneralSettings;
  notifications?: NotificationSettings;
  security?: SecuritySettings;
  message?: string;
}

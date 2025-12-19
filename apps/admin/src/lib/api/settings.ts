import type { GeneralSettings, NotificationSettings, SecuritySettings, SettingsResponse } from '@/types/settings';

// Storage keys
const STORAGE_KEYS = {
  GENERAL: 'admin_settings_general',
  NOTIFICATIONS: 'admin_settings_notifications',
  SECURITY: 'admin_settings_security',
};

// Helper to get settings from localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper to save settings to localStorage
const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    throw new Error('Failed to save settings');
  }
};

export const settingsApi = {
  /**
   * Get general settings
   */
  getGeneralSettings: async (): Promise<GeneralSettings> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return getFromStorage<GeneralSettings>(STORAGE_KEYS.GENERAL, {
      siteName: 'JobPilot Admin',
      siteUrl: 'https://admin.jobpilot.com',
      supportEmail: 'support@applyforus.com',
      timezone: 'America/New_York',
      language: 'en',
    });
  },

  /**
   * Save general settings
   */
  saveGeneralSettings: async (settings: GeneralSettings): Promise<SettingsResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    saveToStorage(STORAGE_KEYS.GENERAL, settings);

    return {
      general: settings,
      message: 'General settings saved successfully',
    };
  },

  /**
   * Get notification settings
   */
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return getFromStorage<NotificationSettings>(STORAGE_KEYS.NOTIFICATIONS, {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      weeklyReports: true,
      securityAlerts: true,
    });
  },

  /**
   * Save notification settings
   */
  saveNotificationSettings: async (settings: NotificationSettings): Promise<SettingsResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, settings);

    return {
      notifications: settings,
      message: 'Notification settings saved successfully',
    };
  },

  /**
   * Get security settings
   */
  getSecuritySettings: async (): Promise<SecuritySettings> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return getFromStorage<SecuritySettings>(STORAGE_KEYS.SECURITY, {
      twoFactorAuth: true,
      sessionTimeout: 30,
      passwordExpiry: 90,
      maxLoginAttempts: 5,
      requireStrongPassword: true,
    });
  },

  /**
   * Save security settings
   */
  saveSecuritySettings: async (settings: SecuritySettings): Promise<SettingsResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    saveToStorage(STORAGE_KEYS.SECURITY, settings);

    return {
      security: settings,
      message: 'Security settings saved successfully',
    };
  },

  /**
   * Get all settings
   */
  getAllSettings: async (): Promise<{
    general: GeneralSettings;
    notifications: NotificationSettings;
    security: SecuritySettings;
  }> => {
    const [general, notifications, security] = await Promise.all([
      settingsApi.getGeneralSettings(),
      settingsApi.getNotificationSettings(),
      settingsApi.getSecuritySettings(),
    ]);

    return { general, notifications, security };
  },
};

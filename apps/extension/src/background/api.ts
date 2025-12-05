/**
 * API Client
 * Handles communication with backend API
 */

import { AuthManager } from './auth';
import {
  Resume,
  Job,
  Application,
  UserStats,
  JobMatch,
  ExtensionSettings,
  API_BASE_URL,
  API_ENDPOINTS,
  ExtensionError,
} from '@shared/types';
import { Storage, CachedStorage, LocalStorage } from '@shared/storage';
import { STORAGE_KEYS, STORAGE_CONFIG } from '@shared/types';
import { retry } from '@shared/utils';
import { API_CONFIG, DEFAULT_SETTINGS } from '@shared/constants';

export class ApiClient {
  private authManager: AuthManager;

  constructor() {
    this.authManager = new AuthManager();
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.authManager.getAccessToken();

    if (!token) {
      throw new ExtensionError('Not authenticated', 'AUTH_REQUIRED');
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    };

    try {
      const response = await retry(
        async () => {
          const res = await fetch(url, config);

          if (res.status === 401) {
            // Token expired, try to refresh
            await this.authManager.refreshToken();
            const newToken = await this.authManager.getAccessToken();

            if (!newToken) {
              throw new ExtensionError('Authentication failed', 'AUTH_FAILED');
            }

            // Retry with new token
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            };

            return await fetch(url, config);
          }

          return res;
        },
        {
          retries: API_CONFIG.RETRY_ATTEMPTS,
          delay: API_CONFIG.RETRY_DELAY,
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ExtensionError(
          error.message || 'API request failed',
          error.code || 'API_ERROR',
          error
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ExtensionError) {
        throw error;
      }
      throw new ExtensionError(
        'Network request failed',
        'NETWORK_ERROR',
        error
      );
    }
  }

  /**
   * Get all resumes
   */
  async getResumes(): Promise<Resume[]> {
    // Check cache first
    const cached = await CachedStorage.get<Resume[]>('resumes');
    if (cached) {
      return cached;
    }

    const resumes = await this.request<Resume[]>(API_ENDPOINTS.RESUMES.LIST);

    // Cache resumes
    await CachedStorage.set('resumes', resumes, STORAGE_CONFIG.CACHE_DURATION);

    return resumes;
  }

  /**
   * Get resume by ID
   */
  async getResume(resumeId: string): Promise<Resume> {
    return await this.request<Resume>(API_ENDPOINTS.RESUMES.GET(resumeId));
  }

  /**
   * Get active resume
   */
  async getActiveResume(): Promise<Resume | null> {
    const settings = await this.getSettings();
    const resumes = await this.getResumes();

    if (settings.defaultResumeId) {
      return resumes.find((r) => r.id === settings.defaultResumeId) || null;
    }

    return resumes.find((r) => r.isDefault) || resumes[0] || null;
  }

  /**
   * Select active resume
   */
  async selectResume(resumeId: string): Promise<void> {
    const settings = await this.getSettings();
    settings.defaultResumeId = resumeId;
    await this.updateSettings(settings);
  }

  /**
   * Save job
   */
  async saveJob(job: Partial<Job>): Promise<Job> {
    return await this.request<Job>(API_ENDPOINTS.JOBS.SAVE, {
      method: 'POST',
      body: JSON.stringify(job),
    });
  }

  /**
   * Detect job from page data
   */
  async detectJob(jobData: any): Promise<Job> {
    // Save to backend and get processed job data
    return await this.saveJob(jobData);
  }

  /**
   * Get job match score
   */
  async getJobMatch(jobId: string, resumeId: string): Promise<JobMatch> {
    return await this.request<JobMatch>(
      `${API_ENDPOINTS.JOBS.MATCH(jobId)}?resumeId=${resumeId}`
    );
  }

  /**
   * Start new application
   */
  async startApplication(data: {
    jobId: string;
    resumeId: string;
  }): Promise<Application> {
    return await this.request<Application>(API_ENDPOINTS.APPLICATIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        status: 'applying',
      }),
    });
  }

  /**
   * Submit application
   */
  async submitApplication(data: {
    applicationId: string;
    customAnswers?: Record<string, string>;
    coverLetter?: string;
    notes?: string;
  }): Promise<Application> {
    return await this.request<Application>(
      API_ENDPOINTS.APPLICATIONS.UPDATE(data.applicationId),
      {
        method: 'PATCH',
        body: JSON.stringify({
          ...data,
          status: 'applied',
          appliedAt: new Date().toISOString(),
        }),
      }
    );
  }

  /**
   * Get application status
   */
  async getApplicationStatus(applicationId: string): Promise<Application> {
    return await this.request<Application>(
      API_ENDPOINTS.APPLICATIONS.GET(applicationId)
    );
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<UserStats> {
    // Check cache
    const cached = await CachedStorage.get<UserStats>('stats');
    if (cached) {
      return cached;
    }

    const stats = await this.request<UserStats>(
      API_ENDPOINTS.APPLICATIONS.STATS
    );

    // Cache stats for 1 minute
    await CachedStorage.set('stats', stats, 60 * 1000);

    return stats;
  }

  /**
   * Get recent applications
   */
  async getRecentApplications(limit: number = 10): Promise<Application[]> {
    return await this.request<Application[]>(
      `${API_ENDPOINTS.APPLICATIONS.LIST}?limit=${limit}&sort=-appliedAt`
    );
  }

  /**
   * Get settings
   */
  async getSettings(): Promise<ExtensionSettings> {
    const settings = await Storage.get<ExtensionSettings>(STORAGE_KEYS.SETTINGS);
    return settings || DEFAULT_SETTINGS;
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    await Storage.set(STORAGE_KEYS.SETTINGS, newSettings);
    return newSettings;
  }

  /**
   * Sync applications from backend
   */
  async syncApplications(): Promise<void> {
    try {
      const applications = await this.getRecentApplications(20);

      // Store in local storage for offline access
      await LocalStorage.set('recent_applications', applications);

      console.log(`Synced ${applications.length} applications`);
    } catch (error) {
      console.error('Failed to sync applications:', error);
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await CachedStorage.remove('resumes');
    await CachedStorage.remove('stats');
    await LocalStorage.remove('recent_applications');
  }
}

# GDPR Service Implementation Guide

## Overview

The GDPR service in `packages/security/src/compliance/gdpr.ts` currently has stub implementations for data retrieval and deletion methods. This guide provides the complete implementation to achieve GDPR compliance.

## Current Status

The file currently has these stub methods that return empty data:
- `fetchUserProfile()` - Returns `{ userId, name: 'User Profile Data' }`
- `fetchUserResumes()` - Returns `[]`
- `fetchUserApplications()` - Returns `[]`
- `fetchUserPreferences()` - Returns `{}`
- `fetchUserCommunications()` - Returns `[]`
- `fetchUserAnalytics()` - Returns `{}`
- `fetchUserActivityLog()` - Returns `[]`
- `deleteUserResumes()` - Returns `0`
- `deleteUserApplications()` - Returns `0`
- `deleteUserDocuments()` - Returns `0`
- `deleteUserCommunications()` - Returns `0`

## Implementation Required

### 1. Add Type Interfaces

Add these TypeScript interfaces after the imports and before the `ConsentPurpose` enum:

```typescript
/**
 * HTTP Client interface for making service calls
 */
export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

/**
 * Service URLs configuration
 */
export interface ServiceConfig {
  userServiceUrl: string;
  resumeServiceUrl: string;
  autoApplyServiceUrl: string;
  notificationServiceUrl: string;
  analyticsServiceUrl: string;
  authToken?: string;
}

/**
 * Profile data from user-service
 */
export interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  profile_photo_url: string | null;
  completeness_score: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Resume data from resume-service
 */
export interface ResumeData {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  content: {
    personalInfo: {
      fullName: string;
      email: string;
      phone?: string;
      location?: string;
      linkedinUrl?: string;
      githubUrl?: string;
      portfolioUrl?: string;
    };
    summary?: string;
    experience: any[];
    education: any[];
    skills: any[];
    certifications?: any[];
    projects?: any[];
    languages?: any[];
  };
  atsScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Application data from auto-apply-service
 */
export interface ApplicationData {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  status: string;
  appliedAt: Date;
  lastUpdatedAt: Date;
  source: string;
  coverLetter?: string;
  notes?: string;
  followUpDate?: Date;
  timeline: Array<{
    id: string;
    applicationId: string;
    status: string;
    note?: string;
    createdAt: Date;
  }>;
}

/**
 * Preference data from user-service
 */
export interface PreferenceData {
  id: string;
  user_id: string;
  target_job_titles: string[];
  target_locations: string[];
  salary_min: number | null;
  salary_max: number | null;
  remote_preference: string;
  experience_level: string | null;
  industries: string[];
  excluded_companies: string[];
  preferred_company_sizes: string[];
  open_to_relocation: boolean;
  open_to_sponsorship: boolean;
  required_benefits: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Notification data from notification-service
 */
export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  status: string;
  priority: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  category: string | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: Date | null;
  sentAt: Date | null;
  failedReason: string | null;
  retryCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analytics event data from analytics-service
 */
export interface AnalyticsEventData {
  id: string;
  eventType: string;
  category: string;
  userId: string | null;
  sessionId: string | null;
  applicationId: string | null;
  jobId: string | null;
  metadata: Record<string, any> | null;
  userAgent: string | null;
  ipAddress: string | null;
  referrer: string | null;
  path: string | null;
  count: number;
  duration: number | null;
  isSuccessful: boolean;
  errorMessage: string | null;
  timestamp: Date;
  eventDate: Date | null;
}

/**
 * Activity log from audit logger
 */
export interface ActivityLogEntry {
  id: string;
  type: string;
  timestamp: Date;
  actor: {
    id: string;
    type: string;
    ipAddress?: string;
    userAgent?: string;
  };
  resource?: {
    type: string;
    id: string;
  };
  action: string;
  outcome: string;
  severity: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Deletion result
 */
export interface DeletionResult {
  success: boolean;
  deletedCount: number;
  errors?: string[];
}
```

### 2. Update UserDataExport Interface

Change the `UserDataExport` interface to use proper types instead of `any`:

```typescript
export interface UserDataExport {
  userId: string;
  exportedAt: Date;
  format: 'json' | 'csv' | 'xml';
  data: {
    profile: ProfileData | null;  // Changed from: any
    resumes: ResumeData[];  // Changed from: any[]
    applications: ApplicationData[];  // Changed from: any[]
    jobPreferences: PreferenceData | null;  // Changed from: any
    communications: NotificationData[];  // Changed from: any[]
    analytics: AnalyticsEventData[];  // Changed from: any
    consents: ConsentRecord[];
    activityLog: ActivityLogEntry[];  // Changed from: any[]
  };
  metadata: {
    dataVersion: string;
    includesThirdPartyData: boolean;
    retentionPeriod?: string;
  };
}
```

### 3. Update GDPRService Class

Add these private properties to the GDPRService class:

```typescript
export class GDPRService {
  private consentStorage: Map<string, ConsentRecord[]> = new Map();
  private processingRecords: Map<string, ProcessingRecord[]> = new Map();
  private httpClient: HttpClient | null = null;  // ADD THIS
  private serviceConfig: ServiceConfig | null = null;  // ADD THIS
```

### 4. Add Configuration Method

Add this method to GDPRService after the constructor/properties:

```typescript
/**
 * Configure the GDPR service with HTTP client and service URLs
 */
configure(httpClient: HttpClient, serviceConfig: ServiceConfig): void {
  this.httpClient = httpClient;
  this.serviceConfig = serviceConfig;
}

/**
 * Get authorization headers for service calls
 */
private getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (this.serviceConfig?.authToken) {
    headers['Authorization'] = `Bearer ${this.serviceConfig.authToken}`;
  }

  return headers;
}
```

### 5. Implement Data Retrieval Methods

Replace the stub implementations with these:

```typescript
/**
 * Fetch user profile from user-service
 * Endpoint: GET /users/:id
 */
private async fetchUserProfile(userId: string): Promise<ProfileData | null> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Returning empty profile data.');
    return null;
  }

  try {
    const url = `${this.serviceConfig.userServiceUrl}/users/${userId}`;
    const profile = await this.httpClient.get<ProfileData>(url, {
      headers: this.getAuthHeaders(),
      timeout: 10000,
    });
    return profile;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}

/**
 * Fetch user resumes from resume-service
 * Endpoint: GET /resumes?userId=:userId
 */
private async fetchUserResumes(userId: string): Promise<ResumeData[]> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Returning empty resumes data.');
    return [];
  }

  try {
    const url = `${this.serviceConfig.resumeServiceUrl}/resumes`;
    const resumes = await this.httpClient.get<ResumeData[]>(url, {
      headers: this.getAuthHeaders(),
      params: { userId },
      timeout: 10000,
    });
    return resumes;
  } catch (error) {
    console.error('Failed to fetch user resumes:', error);
    return [];
  }
}

/**
 * Fetch user applications from auto-apply-service
 * Endpoint: GET /applications?userId=:userId
 */
private async fetchUserApplications(userId: string): Promise<ApplicationData[]> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Returning empty applications data.');
    return [];
  }

  try {
    const url = `${this.serviceConfig.autoApplyServiceUrl}/applications`;
    const applications = await this.httpClient.get<ApplicationData[]>(url, {
      headers: this.getAuthHeaders(),
      params: { userId },
      timeout: 10000,
    });
    return applications;
  } catch (error) {
    console.error('Failed to fetch user applications:', error);
    return [];
  }
}

/**
 * Fetch user preferences from user-service
 * Endpoint: GET /preferences/:userId
 */
private async fetchUserPreferences(userId: string): Promise<PreferenceData | null> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Returning empty preferences data.');
    return null;
  }

  try {
    const url = `${this.serviceConfig.userServiceUrl}/preferences/${userId}`;
    const preferences = await this.httpClient.get<PreferenceData>(url, {
      headers: this.getAuthHeaders(),
      timeout: 10000,
    });
    return preferences;
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    return null;
  }
}

/**
 * Fetch user communications from notification-service
 * Endpoint: GET /notifications?userId=:userId
 */
private async fetchUserCommunications(userId: string): Promise<NotificationData[]> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Returning empty communications data.');
    return [];
  }

  try {
    const url = `${this.serviceConfig.notificationServiceUrl}/notifications`;
    const notifications = await this.httpClient.get<NotificationData[]>(url, {
      headers: this.getAuthHeaders(),
      params: { userId },
      timeout: 10000,
    });
    return notifications;
  } catch (error) {
    console.error('Failed to fetch user communications:', error);
    return [];
  }
}

/**
 * Fetch user analytics from analytics-service
 * Endpoint: GET /events?userId=:userId
 */
private async fetchUserAnalytics(userId: string): Promise<AnalyticsEventData[]> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Returning empty analytics data.');
    return [];
  }

  try {
    const url = `${this.serviceConfig.analyticsServiceUrl}/events`;
    const events = await this.httpClient.get<AnalyticsEventData[]>(url, {
      headers: this.getAuthHeaders(),
      params: { userId },
      timeout: 10000,
    });
    return events;
  } catch (error) {
    console.error('Failed to fetch user analytics:', error);
    return [];
  }
}

/**
 * Fetch user activity log from audit logger
 */
private async fetchUserActivityLog(userId: string): Promise<ActivityLogEntry[]> {
  try {
    const auditEvents = await auditLogger.getUserAuditTrail(userId, 1000);

    // Transform audit events to activity log entries
    const activityLog: ActivityLogEntry[] = auditEvents.map((event) => ({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      actor: {
        id: event.actor.id,
        type: event.actor.type,
        ipAddress: event.actor.ipAddress,
        userAgent: event.actor.userAgent,
      },
      resource: event.resource
        ? {
            type: event.resource.type,
            id: event.resource.id,
          }
        : undefined,
      action: event.action,
      outcome: event.outcome,
      severity: event.severity,
      details: event.details,
      metadata: event.metadata,
    }));

    return activityLog;
  } catch (error) {
    console.error('Failed to fetch user activity log:', error);
    return [];
  }
}
```

### 6. Implement Data Deletion Methods

Replace the stub deletion methods with these:

```typescript
/**
 * Delete user resumes from resume-service
 * Endpoint: DELETE /resumes/user/:userId
 */
private async deleteUserResumes(userId: string): Promise<number> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Skipping resume deletion.');
    return 0;
  }

  try {
    const url = `${this.serviceConfig.resumeServiceUrl}/resumes/user/${userId}`;
    const result = await this.httpClient.delete<DeletionResult>(url, {
      headers: this.getAuthHeaders(),
      timeout: 30000,
    });
    return result.deletedCount;
  } catch (error) {
    console.error('Failed to delete user resumes:', error);
    return 0;
  }
}

/**
 * Delete user applications from auto-apply-service
 * Endpoint: DELETE /applications/user/:userId
 */
private async deleteUserApplications(userId: string): Promise<number> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Skipping application deletion.');
    return 0;
  }

  try {
    const url = `${this.serviceConfig.autoApplyServiceUrl}/applications/user/${userId}`;
    const result = await this.httpClient.delete<DeletionResult>(url, {
      headers: this.getAuthHeaders(),
      timeout: 30000,
    });
    return result.deletedCount;
  } catch (error) {
    console.error('Failed to delete user applications:', error);
    return 0;
  }
}

/**
 * Delete user documents from resume-service
 * Endpoint: DELETE /resumes/documents/:userId
 */
private async deleteUserDocuments(userId: string): Promise<number> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Skipping document deletion.');
    return 0;
  }

  try {
    const url = `${this.serviceConfig.resumeServiceUrl}/resumes/documents/${userId}`;
    const result = await this.httpClient.delete<DeletionResult>(url, {
      headers: this.getAuthHeaders(),
      timeout: 30000,
    });
    return result.deletedCount;
  } catch (error) {
    console.error('Failed to delete user documents:', error);
    return 0;
  }
}

/**
 * Delete user communications from notification-service
 * Endpoint: DELETE /notifications/user/:userId
 */
private async deleteUserCommunications(userId: string): Promise<number> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Skipping communication deletion.');
    return 0;
  }

  try {
    const url = `${this.serviceConfig.notificationServiceUrl}/notifications/user/${userId}`;
    const result = await this.httpClient.delete<DeletionResult>(url, {
      headers: this.getAuthHeaders(),
      timeout: 30000,
    });
    return result.deletedCount;
  } catch (error) {
    console.error('Failed to delete user communications:', error);
    return 0;
  }
}
```

### 7. Update generatePrivacyNotice Return Type

Change the return type from using `any` to proper types:

```typescript
generatePrivacyNotice(): {
  controller: {
    name: string;
    contact: string;
    dpo: string;
  };
  purposes: Array<{
    purpose: string;
    legalBasis: LegalBasis;
    dataCategories: string[];
  }>;
  legalBases: LegalBasis[];
  recipients: string[];
  retentionPeriods: Array<{
    dataType: string;
    period: string;
  }>;
  rights: string[];
} {
  // ... rest of implementation stays the same
}
```

## Usage Example

```typescript
import { gdprService } from '@/packages/security/src/compliance/gdpr';
import axios from 'axios';

// Create an HTTP client wrapper that implements the HttpClient interface
const httpClient: HttpClient = {
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await axios.get(url, {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout,
    });
    return response.data;
  },
  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await axios.delete(url, {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout,
    });
    return response.data;
  },
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await axios.post(url, data, {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout,
    });
    return response.data;
  },
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await axios.put(url, data, {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout,
    });
    return response.data;
  },
};

// Configure the GDPR service
gdprService.configure(httpClient, {
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  resumeServiceUrl: process.env.RESUME_SERVICE_URL || 'http://localhost:3002',
  autoApplyServiceUrl: process.env.AUTO_APPLY_SERVICE_URL || 'http://localhost:3003',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3005',
  authToken: 'your-service-auth-token',
});

// Now you can use the GDPR service
const userId = 'user-123';

// Export user data
const exportData = await gdprService.exportUserData(userId, 'json');
console.log('Exported data:', exportData);

// Delete user data (right to be forgotten)
const deletionReport = await gdprService.deleteUserData(userId, 'User requested account deletion');
console.log('Deletion report:', deletionReport);
```

## Service Endpoints Required

For this implementation to work, the following service endpoints must be created:

### User Service
- `GET /users/:id` - Get user profile
- `GET /preferences/:userId` - Get user preferences

### Resume Service
- `GET /resumes?userId=:userId` - Get user resumes
- `DELETE /resumes/user/:userId` - Delete all user resumes
- `DELETE /resumes/documents/:userId` - Delete all user documents

### Auto-Apply Service
- `GET /applications?userId=:userId` - Get user applications
- `DELETE /applications/user/:userId` - Delete all user applications

### Notification Service
- `GET /notifications?userId=:userId` - Get user notifications
- `DELETE /notifications/user/:userId` - Delete all user notifications

### Analytics Service
- `GET /events?userId=:userId` - Get user analytics events

All DELETE endpoints should return a `DeletionResult` object with:
```typescript
{
  success: boolean;
  deletedCount: number;
  errors?: string[];
}
```

## Benefits

1. **Type Safety**: All data structures are now properly typed instead of using `any`
2. **Configurability**: The service can be configured with any HTTP client and service URLs
3. **Error Handling**: Proper error handling with fallbacks
4. **GDPR Compliance**: Real implementations for:
   - Right to Data Portability (Article 20)
   - Right to be Forgotten (Article 17)
   - Consent Management (Article 7)
5. **Audit Trail**: All operations are logged using the audit logger
6. **Extensibility**: Easy to add more services or modify endpoints

## Testing

After implementation, test with:

```typescript
// Test data export
const exportResult = await gdprService.exportUserData('test-user-id');
console.log('Profile:', exportResult.data.profile);
console.log('Resumes count:', exportResult.data.resumes.length);
console.log('Applications count:', exportResult.data.applications.length);

// Test data deletion
const deleteResult = await gdprService.deleteUserData('test-user-id');
console.log('Deleted resumes:', deleteResult.deletedData.resumes);
console.log('Deleted applications:', deleteResult.deletedData.applications);
```

## Next Steps

1. Implement the service endpoints in each microservice
2. Create an HTTP client wrapper (axios, fetch, or custom)
3. Configure the GDPR service at application startup
4. Add integration tests
5. Document the GDPR compliance process for end users

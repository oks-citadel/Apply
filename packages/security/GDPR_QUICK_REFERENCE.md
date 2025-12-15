# GDPR Implementation Quick Reference

## File Location
```
packages/security/src/compliance/gdpr.ts
```

## Stub Methods to Replace

### Data Retrieval
```typescript
// BEFORE (all return empty data)
fetchUserProfile(userId) → { userId, name: 'User Profile Data' }
fetchUserResumes(userId) → []
fetchUserApplications(userId) → []
fetchUserPreferences(userId) → {}
fetchUserCommunications(userId) → []
fetchUserAnalytics(userId) → {}
fetchUserActivityLog(userId) → []

// AFTER (make real HTTP calls)
fetchUserProfile(userId) → GET user-service/users/:id
fetchUserResumes(userId) → GET resume-service/resumes?userId=
fetchUserApplications(userId) → GET auto-apply-service/applications?userId=
fetchUserPreferences(userId) → GET user-service/preferences/:userId
fetchUserCommunications(userId) → GET notification-service/notifications?userId=
fetchUserAnalytics(userId) → GET analytics-service/events?userId=
fetchUserActivityLog(userId) → auditLogger.getUserAuditTrail(userId)
```

### Data Deletion
```typescript
// BEFORE (all return 0)
deleteUserResumes(userId) → 0
deleteUserApplications(userId) → 0
deleteUserDocuments(userId) → 0
deleteUserCommunications(userId) → 0

// AFTER (make real HTTP DELETE calls)
deleteUserResumes(userId) → DELETE resume-service/resumes/user/:userId
deleteUserApplications(userId) → DELETE auto-apply-service/applications/user/:userId
deleteUserDocuments(userId) → DELETE resume-service/resumes/documents/:userId
deleteUserCommunications(userId) → DELETE notification-service/notifications/user/:userId
```

## Service Endpoints Mapping

| Data Type | GET Endpoint | DELETE Endpoint | Service |
|-----------|-------------|-----------------|---------|
| Profile | `/users/:id` | N/A | user-service |
| Resumes | `/resumes?userId=` | `/resumes/user/:userId` | resume-service |
| Documents | N/A | `/resumes/documents/:userId` | resume-service |
| Applications | `/applications?userId=` | `/applications/user/:userId` | auto-apply-service |
| Preferences | `/preferences/:userId` | N/A | user-service |
| Notifications | `/notifications?userId=` | `/notifications/user/:userId` | notification-service |
| Analytics | `/events?userId=` | N/A | analytics-service |
| Activity Log | (audit logger) | N/A | audit logger |

## New Types to Add

```typescript
// 1. HTTP client interfaces
HttpClient
RequestConfig
ServiceConfig

// 2. Service response types
ProfileData          // user-service
ResumeData          // resume-service
ApplicationData     // auto-apply-service
PreferenceData      // user-service
NotificationData    // notification-service
AnalyticsEventData  // analytics-service
ActivityLogEntry    // audit logger
DeletionResult      // all DELETE endpoints
```

## Class Changes

```typescript
export class GDPRService {
  // ADD these properties:
  private httpClient: HttpClient | null = null;
  private serviceConfig: ServiceConfig | null = null;

  // ADD this method:
  configure(httpClient: HttpClient, serviceConfig: ServiceConfig): void { }

  // ADD this helper:
  private getAuthHeaders(): Record<string, string> { }
}
```

## Usage Pattern

```typescript
// 1. Create HTTP client
const httpClient = {
  get: async (url, config) => axios.get(url, config).then(r => r.data),
  delete: async (url, config) => axios.delete(url, config).then(r => r.data),
  // ... post, put
};

// 2. Configure service
gdprService.configure(httpClient, {
  userServiceUrl: 'http://localhost:3001',
  resumeServiceUrl: 'http://localhost:3002',
  autoApplyServiceUrl: 'http://localhost:3003',
  notificationServiceUrl: 'http://localhost:3004',
  analyticsServiceUrl: 'http://localhost:3005',
  authToken: 'token'
});

// 3. Use it
const data = await gdprService.exportUserData('user-id');
const report = await gdprService.deleteUserData('user-id');
```

## Error Handling Pattern

```typescript
private async fetchUserX(userId: string): Promise<XData | null> {
  if (!this.httpClient || !this.serviceConfig) {
    console.warn('GDPR Service not configured. Returning empty data.');
    return null; // or []
  }

  try {
    const url = `${this.serviceConfig.xServiceUrl}/endpoint`;
    const data = await this.httpClient.get<XData>(url, {
      headers: this.getAuthHeaders(),
      timeout: 10000,
    });
    return data;
  } catch (error) {
    console.error('Failed to fetch user X:', error);
    return null; // or []
  }
}
```

## DELETE Response Format

All DELETE endpoints should return:
```typescript
{
  success: boolean;
  deletedCount: number;
  errors?: string[];
}
```

## Type Replacements

### UserDataExport.data
```typescript
// BEFORE
data: {
  profile: any;
  resumes: any[];
  applications: any[];
  jobPreferences: any;
  communications: any[];
  analytics: any;
  consents: ConsentRecord[];
  activityLog: any[];
}

// AFTER
data: {
  profile: ProfileData | null;
  resumes: ResumeData[];
  applications: ApplicationData[];
  jobPreferences: PreferenceData | null;
  communications: NotificationData[];
  analytics: AnalyticsEventData[];
  consents: ConsentRecord[];
  activityLog: ActivityLogEntry[];
}
```

### generatePrivacyNotice return type
```typescript
// BEFORE
{
  controller: any;
  purposes: any[];
  legalBases: any[];
  recipients: any[];
  retentionPeriods: any[];
  rights: string[];
}

// AFTER
{
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
}
```

## Service Endpoints to CREATE

These DELETE endpoints don't exist yet and need to be created:

1. **Resume Service**
   - `DELETE /resumes/user/:userId` - Delete all user resumes
   - `DELETE /resumes/documents/:userId` - Delete all user documents

2. **Auto-Apply Service**
   - `DELETE /applications/user/:userId` - Delete all user applications

3. **Notification Service**
   - `DELETE /notifications/user/:userId` - Delete all user notifications

Each should:
- Verify authentication
- Check authorization (user owns the data)
- Delete all records for that user
- Return `DeletionResult` object
- Log the operation

## Implementation Checklist

- [ ] Add 11 new type interfaces to gdpr.ts
- [ ] Update UserDataExport interface types
- [ ] Add httpClient and serviceConfig properties to GDPRService
- [ ] Add configure() method
- [ ] Add getAuthHeaders() helper method
- [ ] Implement 7 fetch methods with real HTTP calls
- [ ] Implement 4 delete methods with real HTTP calls
- [ ] Update generatePrivacyNotice() return type
- [ ] Create 4 missing DELETE endpoints in services
- [ ] Create HTTP client wrapper
- [ ] Configure at application startup
- [ ] Add integration tests
- [ ] Document for end users

## For Complete Details

See `GDPR_IMPLEMENTATION_GUIDE.md` for full implementation with code examples.

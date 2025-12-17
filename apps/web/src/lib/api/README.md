# API Client Layer Documentation

This directory contains the complete API client implementation for the ApplyForUs frontend application. The API layer provides a robust, type-safe interface for communicating with backend services.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Usage](#usage)
- [Error Handling](#error-handling)
- [Caching](#caching)
- [API Endpoints](#api-endpoints)
- [Best Practices](#best-practices)

## Overview

The API client layer is built on Axios and provides:
- Single, consolidated HTTP client instance
- Automatic authentication with JWT tokens
- Token refresh mechanism
- Request/response interceptors
- Retry logic for transient failures
- Comprehensive error handling
- Request/response logging (development mode)
- Type-safe API methods
- Caching utilities

## Features

### 1. Automatic Authentication

The API client automatically:
- Attaches Bearer tokens to requests
- Refreshes expired tokens using refresh token
- Redirects to login on authentication failure
- Persists tokens in localStorage

```typescript
import { setTokens, clearTokens } from '@/lib/api';

// After login
setTokens(accessToken, refreshToken);

// On logout
clearTokens();
```

### 2. Retry Logic

Automatically retries failed requests with exponential backoff:
- Network errors (ECONNABORTED, ENOTFOUND, ECONNRESET, ETIMEDOUT)
- Server errors (500, 502, 503, 504)
- Rate limiting (429)
- Request timeout (408)

Default configuration:
- Max retries: 3
- Initial delay: 1 second
- Exponential backoff: 1s → 2s → 4s

### 3. Error Categorization

Errors are categorized into types for better handling:

```typescript
export enum ErrorType {
  NETWORK = 'NETWORK',           // Connection issues
  AUTHENTICATION = 'AUTHENTICATION', // 401 - Login required
  AUTHORIZATION = 'AUTHORIZATION',   // 403 - Permission denied
  VALIDATION = 'VALIDATION',         // 400, 422 - Invalid input
  NOT_FOUND = 'NOT_FOUND',          // 404 - Resource not found
  SERVER = 'SERVER',                 // 5xx - Server error
  TIMEOUT = 'TIMEOUT',              // Request timeout
  RATE_LIMIT = 'RATE_LIMIT',        // 429 - Too many requests
  UNKNOWN = 'UNKNOWN',              // Other errors
}
```

Usage:

```typescript
import { isErrorType, ErrorType } from '@/lib/api';

try {
  await jobsApi.searchJobs(filters);
} catch (error) {
  if (isErrorType(error, ErrorType.NETWORK)) {
    // Show offline message
  } else if (isErrorType(error, ErrorType.VALIDATION)) {
    // Show validation errors
  } else {
    // Show generic error
  }
}
```

### 4. User-Friendly Error Messages

All errors are converted to user-friendly messages:

| Error Type | User Message |
|-----------|--------------|
| NETWORK | "Unable to connect to the server. Please check your internet connection and try again." |
| AUTHENTICATION | "Your session has expired. Please log in again." |
| AUTHORIZATION | "You do not have permission to perform this action." |
| VALIDATION | Shows server validation message |
| NOT_FOUND | "The requested resource was not found." |
| TIMEOUT | "The request took too long to complete. Please try again." |
| RATE_LIMIT | "Too many requests. Please wait a moment and try again." |
| SERVER | "A server error occurred. Our team has been notified. Please try again later." |

### 5. Request/Response Logging

In development mode, all requests and responses are logged to the console:

```
[API Request] GET /jobs/search { params: { query: 'developer' } }
[API Response] GET /jobs/search { status: 200, duration: '245ms' }
```

### 6. Caching

Built-in caching with TTL and stale-while-revalidate pattern:

```typescript
import { cachedApiCall, apiCache } from '@/lib/api';

// Cache with 5-minute TTL
const jobs = await cachedApiCall(
  'jobs-search-developer',
  () => jobsApi.searchJobs({ query: 'developer' }),
  { ttl: 5 * 60 * 1000 }
);

// Invalidate specific cache
apiCache.invalidate('jobs-search-developer');

// Invalidate by pattern
apiCache.invalidatePattern(/^jobs-/);

// Clear all cache
apiCache.clear();
```

## Architecture

```
apps/web/src/lib/api/
├── client.ts              # Core Axios client with interceptors
├── auth.ts                # Authentication API
├── jobs.ts                # Jobs API
├── resumes.ts             # Resumes API
├── applications.ts        # Applications API
├── user.ts                # User profile API
├── ai.ts                  # AI features API
├── analytics.ts           # Analytics API
├── alerts.ts              # Job alerts API
├── utils.ts               # Utility functions
├── hooks.example.ts       # Example React hooks
├── index.ts               # Main export file
├── API_ENDPOINTS.md       # Complete endpoint reference
└── README.md              # This file
```

## Usage

### Basic API Calls

```typescript
import { jobsApi, authApi, resumesApi } from '@/lib/api';

// Authentication
const response = await authApi.login({ email, password });
setTokens(response.accessToken, response.refreshToken);

// Search jobs
const jobs = await jobsApi.searchJobs({
  query: 'Software Engineer',
  location: 'Remote',
  experience: 'mid-level',
});

// Get user profile
const profile = await userApi.getProfile();

// Create resume
const resume = await resumesApi.createResume({
  title: 'Software Engineer Resume',
  content: { /* resume data */ },
});
```

### With Error Handling

```typescript
import { jobsApi, handleApiError, ErrorType } from '@/lib/api';

async function searchJobs(filters: JobSearchFilters) {
  try {
    const result = await jobsApi.searchJobs(filters);
    return result;
  } catch (err) {
    const error = handleApiError(err);

    // Check error type
    if (error.type === ErrorType.NETWORK) {
      showNotification('No internet connection', 'error');
    } else if (error.type === ErrorType.VALIDATION) {
      // Show validation errors
      Object.entries(error.errors || {}).forEach(([field, messages]) => {
        showFieldError(field, messages[0]);
      });
    } else {
      showNotification(error.message, 'error');
    }

    throw error;
  }
}
```

### With React Hooks (see hooks.example.ts)

```typescript
import { useApi, useMutation } from '@/lib/api/hooks.example';
import { jobsApi } from '@/lib/api';

function JobsList() {
  const {
    data: jobs,
    loading,
    error,
    refetch,
  } = useApi(
    () => jobsApi.searchJobs({ query: 'developer' }),
    {
      cache: true,
      cacheKey: 'jobs-developer',
      onError: (error) => toast.error(error.message),
    }
  );

  const { mutate: saveJob, loading: saving } = useMutation(
    (jobId: string) => jobsApi.saveJob(jobId),
    {
      onSuccess: () => {
        toast.success('Job saved!');
        refetch();
      },
      invalidateCache: ['saved-jobs'],
    }
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {jobs?.jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onSave={() => saveJob(job.id)}
          saving={saving}
        />
      ))}
    </div>
  );
}
```

### File Uploads

```typescript
import { resumesApi, userApi } from '@/lib/api';

// Upload profile photo
const file = document.querySelector('input[type="file"]').files[0];
const result = await userApi.uploadPhoto(file);

// Import resume
const resumeFile = document.querySelector('input[type="file"]').files[0];
const resume = await resumesApi.importResume(resumeFile);
```

### File Downloads

```typescript
import { resumesApi, downloadBlob } from '@/lib/api';

// Export resume as PDF
const pdfBlob = await resumesApi.exportResume(resumeId, 'pdf');
downloadBlob(pdfBlob, 'my-resume.pdf');

// Export applications
const csvBlob = await applicationsApi.exportApplications('csv', filters);
downloadBlob(csvBlob, 'applications.csv');
```

## Error Handling

### ApiError Class

```typescript
class ApiError extends Error {
  message: string;           // User-friendly error message
  status?: number;          // HTTP status code
  errors?: Record<string, string[]>; // Validation errors
  code?: string;            // Error code (e.g., 'ECONNABORTED')
  type?: ErrorType;         // Categorized error type
  isApiError: boolean;      // Always true for ApiError instances
}
```

### Error Handling Patterns

#### Pattern 1: Try-Catch

```typescript
try {
  const data = await apiCall();
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API error
    console.error(error.message);
  } else {
    // Handle unexpected error
    console.error('Unexpected error:', error);
  }
}
```

#### Pattern 2: Type-Based Handling

```typescript
import { isErrorType, ErrorType } from '@/lib/api';

try {
  const data = await apiCall();
} catch (error) {
  if (isErrorType(error, ErrorType.NETWORK)) {
    // Show retry button
  } else if (isErrorType(error, ErrorType.VALIDATION)) {
    // Show validation errors
  } else if (isErrorType(error, ErrorType.AUTHENTICATION)) {
    // Redirect to login (usually handled automatically)
  }
}
```

#### Pattern 3: Validation Errors

```typescript
try {
  await resumesApi.createResume(data);
} catch (error) {
  if (error instanceof ApiError && error.errors) {
    // error.errors = { email: ['Email is required'], ... }
    Object.entries(error.errors).forEach(([field, messages]) => {
      setFieldError(field, messages[0]);
    });
  }
}
```

## Caching

### Simple Cache

```typescript
import { apiCache } from '@/lib/api';

// Manual caching
const data = apiCache.get('my-key');
if (!data) {
  const fresh = await fetchData();
  apiCache.set('my-key', fresh, 5 * 60 * 1000); // 5 minutes
}
```

### Cached API Call

```typescript
import { cachedApiCall } from '@/lib/api';

const data = await cachedApiCall(
  'cache-key',
  () => apiCall(),
  {
    ttl: 5 * 60 * 1000,        // 5 minutes
    forceRefresh: false,        // Use cache if available
    onError: (error) => {       // Error callback
      console.error(error);
    },
  }
);
```

### Cache Invalidation

```typescript
import { apiCache } from '@/lib/api';

// Invalidate specific key
apiCache.invalidate('jobs-search-developer');

// Invalidate by pattern
apiCache.invalidatePattern(/^jobs-/);
apiCache.invalidatePattern('user-profile-*');

// Clear all
apiCache.clear();
```

## API Endpoints

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete endpoint reference.

## Utility Functions

See [utils.ts](./utils.ts) for available utilities:

- `cachedApiCall()` - Cache API responses
- `debounce()` - Debounce function calls
- `throttle()` - Throttle function calls
- `buildQueryString()` - Build URL query strings
- `downloadBlob()` - Download files
- `formatFileSize()` - Format bytes to human-readable
- `isValidFileType()` - Validate file types
- `batchApiCalls()` - Batch multiple API calls
- `retryApiCall()` - Retry failed calls
- `pollUntil()` - Poll endpoint until condition met

## Best Practices

### 1. Always Handle Errors

```typescript
// ❌ Bad
const data = await apiCall();

// ✅ Good
try {
  const data = await apiCall();
  // Handle success
} catch (error) {
  // Handle error
}
```

### 2. Use Type Guards

```typescript
// ❌ Bad
catch (error: any) {
  showError(error.message);
}

// ✅ Good
catch (error) {
  if (error instanceof ApiError) {
    showError(error.message);
  }
}
```

### 3. Cache Static/Slow Data

```typescript
// ❌ Bad - Fetches on every render
useEffect(() => {
  jobsApi.getSubscriptionPlans().then(setPlans);
}, []);

// ✅ Good - Caches for 1 hour
useEffect(() => {
  cachedApiCall(
    'subscription-plans',
    () => jobsApi.getSubscriptionPlans(),
    { ttl: 60 * 60 * 1000 }
  ).then(setPlans);
}, []);
```

### 4. Invalidate Cache on Mutations

```typescript
// ✅ Good
const saveJob = async (jobId: string) => {
  await jobsApi.saveJob(jobId);

  // Invalidate related caches
  apiCache.invalidatePattern(/^jobs-/);
  apiCache.invalidate('saved-jobs');
};
```

### 5. Show User-Friendly Messages

```typescript
// ❌ Bad
catch (error) {
  alert(error); // Shows technical error
}

// ✅ Good
catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.message); // Shows user-friendly message
  }
}
```

### 6. Use Loading States

```typescript
// ✅ Good
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await apiCall();
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false);
  }
};
```

### 7. Debounce Search Inputs

```typescript
import { debounce } from '@/lib/api';

// ✅ Good
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    jobsApi.searchJobs({ query }).then(setResults);
  }, 500),
  []
);
```

## Migration Guide

### From Direct Axios to API Client

```typescript
// ❌ Before
import axios from 'axios';

const response = await axios.get('/api/jobs', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ✅ After
import { jobsApi } from '@/lib/api';

const response = await jobsApi.searchJobs();
// Token automatically attached
```

### Adding New Endpoints

1. Add types to appropriate type file in `apps/web/src/types/`
2. Add method to appropriate API file (e.g., `jobs.ts`)
3. Export from `index.ts`
4. Document in `API_ENDPOINTS.md`

Example:

```typescript
// In jobs.ts
export const jobsApi = {
  // ... existing methods

  /**
   * Get job analytics
   */
  getJobAnalytics: async (jobId: string): Promise<JobAnalytics> => {
    try {
      const response = await apiClient.get<JobAnalytics>(`/jobs/${jobId}/analytics`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
```

## Troubleshooting

### Token Not Being Sent

Check that tokens are set:
```typescript
import { getAccessToken } from '@/lib/api';
console.log('Token:', getAccessToken());
```

### Cache Not Working

Ensure you're using the same cache key:
```typescript
// Must use exact same key
cachedApiCall('jobs-dev', ...); // ✅
cachedApiCall('jobs-developer', ...); // ❌ Different key
```

### Requests Failing in Development

Check CORS and API base URL:
```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Types Not Matching

Ensure types match backend DTOs:
```typescript
// Check response in network tab
// Update type definitions in apps/web/src/types/
```

## Support

For issues or questions:
1. Check [API_ENDPOINTS.md](./API_ENDPOINTS.md) for endpoint reference
2. Review [hooks.example.ts](./hooks.example.ts) for usage patterns
3. Check error logs in browser console (development mode)
4. Review network tab in browser DevTools

## Future Improvements

Potential enhancements:
- [ ] Integrate React Query for advanced caching
- [ ] Add request deduplication
- [ ] Add optimistic updates
- [ ] Add request cancellation
- [ ] Add WebSocket support
- [ ] Add GraphQL client option
- [ ] Add request/response transformers
- [ ] Add API mocking for tests

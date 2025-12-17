# API Client Quick Start Guide

A quick reference for using the ApplyForUs API client layer.

## Table of Contents
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)
- [Caching](#caching)
- [File Operations](#file-operations)

---

## Installation

The API client is already set up. Just import what you need:

```typescript
import { jobsApi, authApi, resumesApi, userApi } from '@/lib/api';
```

---

## Basic Usage

### Authentication

```typescript
import { authApi, setTokens, clearTokens } from '@/lib/api';

// Login
const response = await authApi.login({ email, password });
setTokens(response.accessToken, response.refreshToken);

// Register
const user = await authApi.register({ email, password, firstName, lastName });

// Logout
await authApi.logout();
clearTokens();
```

### Fetching Data

```typescript
import { jobsApi, resumesApi, userApi } from '@/lib/api';

// Get user profile
const profile = await userApi.getProfile();

// Search jobs
const jobs = await jobsApi.searchJobs({
  query: 'developer',
  location: 'Remote',
  experience: 'mid-level',
});

// Get resumes
const resumes = await resumesApi.getResumes();
```

### Creating/Updating

```typescript
// Create resume
const resume = await resumesApi.createResume({
  title: 'Software Engineer Resume',
  content: { /* data */ },
});

// Update profile
const updated = await userApi.updateProfile({
  firstName: 'John',
  lastName: 'Doe',
});

// Save job
const saved = await jobsApi.saveJob(jobId, {
  notes: 'Interesting position',
  tags: ['remote', 'senior'],
});
```

---

## Common Patterns

### Pattern 1: Simple Fetch with Error Handling

```typescript
import { jobsApi, ApiError, ErrorType } from '@/lib/api';

async function loadJobs() {
  try {
    const result = await jobsApi.searchJobs({ query: 'developer' });
    setJobs(result.jobs);
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message); // User-friendly message
    }
  }
}
```

### Pattern 2: Form Submission with Validation Errors

```typescript
import { resumesApi, ApiError, ErrorType } from '@/lib/api';

async function handleSubmit(data: ResumeData) {
  try {
    const resume = await resumesApi.createResume(data);
    navigate(`/resumes/${resume.id}`);
  } catch (error) {
    if (error instanceof ApiError && error.type === ErrorType.VALIDATION) {
      // Show field-specific errors
      Object.entries(error.errors || {}).forEach(([field, messages]) => {
        setFieldError(field, messages[0]);
      });
    } else if (error instanceof ApiError) {
      toast.error(error.message);
    }
  }
}
```

### Pattern 3: Cached Data Loading

```typescript
import { cachedApiCall, userApi } from '@/lib/api';

async function loadSubscriptionPlans() {
  const plans = await cachedApiCall(
    'subscription-plans',
    () => userApi.getSubscriptionPlans(),
    { ttl: 60 * 60 * 1000 } // Cache for 1 hour
  );
  setPlans(plans);
}
```

### Pattern 4: React Hook with Loading State

```typescript
import { useApi } from '@/lib/api/hooks.example';
import { jobsApi } from '@/lib/api';

function JobsList() {
  const { data, loading, error, refetch } = useApi(
    () => jobsApi.searchJobs({ query: 'developer' }),
    {
      cache: true,
      cacheKey: 'jobs-developer',
      onError: (error) => toast.error(error.message),
    }
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {data?.jobs.map(job => <JobCard key={job.id} job={job} />)}
    </div>
  );
}
```

### Pattern 5: Mutation with Cache Invalidation

```typescript
import { useMutation } from '@/lib/api/hooks.example';
import { jobsApi } from '@/lib/api';

function SaveJobButton({ jobId }: { jobId: string }) {
  const { mutate: saveJob, loading } = useMutation(
    (id: string) => jobsApi.saveJob(id),
    {
      onSuccess: () => toast.success('Job saved!'),
      invalidateCache: ['jobs-list', 'saved-jobs'],
    }
  );

  return (
    <button onClick={() => saveJob(jobId)} disabled={loading}>
      {loading ? 'Saving...' : 'Save Job'}
    </button>
  );
}
```

---

## Error Handling

### Error Types

```typescript
import { ErrorType, isErrorType } from '@/lib/api';

try {
  await apiCall();
} catch (error) {
  if (isErrorType(error, ErrorType.NETWORK)) {
    // No internet - show retry button
  } else if (isErrorType(error, ErrorType.VALIDATION)) {
    // Show validation errors
  } else if (isErrorType(error, ErrorType.AUTHENTICATION)) {
    // Redirect to login (usually automatic)
  } else if (isErrorType(error, ErrorType.AUTHORIZATION)) {
    // Show permission denied message
  } else if (isErrorType(error, ErrorType.SERVER)) {
    // Show "something went wrong" message
  }
}
```

### Validation Errors

```typescript
import { ApiError, ErrorType } from '@/lib/api';

try {
  await resumesApi.createResume(data);
} catch (error) {
  if (error instanceof ApiError && error.type === ErrorType.VALIDATION) {
    // error.errors = { email: ['Invalid email'], ... }
    console.log(error.errors);
  }
}
```

---

## Caching

### Simple Cache

```typescript
import { apiCache, cachedApiCall } from '@/lib/api';

// Cached call
const data = await cachedApiCall(
  'cache-key',
  () => apiCall(),
  { ttl: 5 * 60 * 1000 } // 5 minutes
);

// Invalidate cache
apiCache.invalidate('cache-key');

// Invalidate by pattern
apiCache.invalidatePattern(/^jobs-/);

// Clear all
apiCache.clear();
```

### Cache Invalidation After Mutation

```typescript
import { apiCache } from '@/lib/api';

async function saveJob(jobId: string) {
  await jobsApi.saveJob(jobId);

  // Invalidate related caches
  apiCache.invalidate('jobs-list');
  apiCache.invalidate('saved-jobs');
  apiCache.invalidatePattern(/^jobs-/);
}
```

---

## File Operations

### Upload Files

```typescript
import { userApi, resumesApi } from '@/lib/api';

// Upload profile photo
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const result = await userApi.uploadPhoto(file);

// Import resume
const resumeFile = files[0];
const resume = await resumesApi.importResume(resumeFile);
```

### Download Files

```typescript
import { resumesApi, downloadBlob } from '@/lib/api';

// Export resume as PDF
const pdfBlob = await resumesApi.exportResume(resumeId, 'pdf');
downloadBlob(pdfBlob, 'my-resume.pdf');

// Export applications
const csvBlob = await applicationsApi.exportApplications('csv');
downloadBlob(csvBlob, 'applications.csv');
```

---

## Debounced Search

```typescript
import { debounce } from '@/lib/api';
import { useMemo } from 'react';

function SearchInput() {
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      jobsApi.searchJobs({ query }).then(setResults);
    }, 500), // 500ms delay
    []
  );

  return (
    <input
      type="text"
      onChange={(e) => debouncedSearch(e.target.value)}
    />
  );
}
```

---

## Pagination

```typescript
import { usePagination } from '@/lib/api/hooks.example';
import { jobsApi } from '@/lib/api';

function PaginatedJobs() {
  const {
    data,
    loading,
    page,
    nextPage,
    prevPage,
    hasMore,
    hasPrev,
    totalPages,
  } = usePagination(
    (page, limit) => jobsApi.searchJobs({ page, limit }),
    { limit: 20 }
  );

  return (
    <div>
      {data?.data.map(job => <JobCard key={job.id} job={job} />)}

      <button onClick={prevPage} disabled={!hasPrev}>
        Previous
      </button>
      <span>Page {page} of {totalPages}</span>
      <button onClick={nextPage} disabled={!hasMore}>
        Next
      </button>
    </div>
  );
}
```

---

## Infinite Scroll

```typescript
import { useInfiniteScroll } from '@/lib/api/hooks.example';
import { jobsApi } from '@/lib/api';

function InfiniteJobList() {
  const { data, loading, loadMore, hasMore } = useInfiniteScroll(
    (page) => jobsApi.searchJobs({ page, limit: 20 })
  );

  return (
    <div>
      {data.map(job => <JobCard key={job.id} job={job} />)}

      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

---

## Batch Operations

```typescript
import { batchApiCalls } from '@/lib/api';

// Fetch multiple jobs in parallel
const jobCalls = jobIds.map(id => () => jobsApi.getJob(id));
const results = await batchApiCalls(jobCalls, {
  concurrency: 5, // Max 5 concurrent requests
  continueOnError: true, // Continue even if some fail
});

results.forEach(result => {
  if (result instanceof Error) {
    console.error('Failed:', result);
  } else {
    console.log('Success:', result);
  }
});
```

---

## Polling

```typescript
import { pollUntil } from '@/lib/api';

// Poll until job application status changes
const application = await pollUntil(
  () => applicationsApi.getApplication(id),
  (app) => app.status === 'reviewed',
  {
    interval: 2000,  // Check every 2 seconds
    timeout: 60000,  // Max 60 seconds
    onUpdate: (app) => console.log('Status:', app.status),
  }
);
```

---

## Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001  # Development
# NEXT_PUBLIC_API_URL=https://api.applyforus.com  # Production
```

---

## Tips

1. **Always handle errors** - The API can fail for many reasons
2. **Use TypeScript** - Types are your friend
3. **Cache static data** - Subscription plans, categories, etc.
4. **Invalidate cache** - After mutations that affect cached data
5. **Debounce search** - Don't hit the API on every keystroke
6. **Show loading states** - Users need feedback
7. **Use user-friendly messages** - `error.message` is already user-friendly

---

## Common Issues

### Token not attached to requests
```typescript
import { setTokens } from '@/lib/api';

// After login
setTokens(accessToken, refreshToken);
```

### Cache not working
```typescript
// Use the SAME cache key
cachedApiCall('my-key', ...); // ✅
cachedApiCall('my-different-key', ...); // ❌
```

### CORS errors in development
```typescript
// Check .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Need More Help?

- Full docs: [README.md](./README.md)
- Endpoint reference: [API_ENDPOINTS.md](./API_ENDPOINTS.md)
- Hook examples: [hooks.example.ts](./hooks.example.ts)
- Utility functions: [utils.ts](./utils.ts)

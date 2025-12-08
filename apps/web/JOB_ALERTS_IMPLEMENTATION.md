# Job Alerts UI Implementation

This document describes the complete implementation of the Job Alerts feature for the ApplyforUs platform.

## Overview

The Job Alerts feature allows users to create, manage, and receive notifications for job opportunities that match their specified criteria. The implementation includes:

- Full CRUD operations for job alerts
- Customizable search criteria (keywords, location, salary, job type, etc.)
- Flexible notification frequencies (instant, daily, weekly)
- Toggle alerts on/off without deletion
- Quick alert creation from job search
- Dedicated alerts management page

## Architecture

### File Structure

```
apps/web/src/
├── types/
│   └── alert.ts                          # TypeScript types for job alerts
├── lib/api/
│   ├── alerts.ts                         # API client for alerts endpoints
│   └── index.ts                          # Updated to export alerts API
├── hooks/
│   └── useJobAlerts.ts                   # React Query hooks for alerts
├── components/features/alerts/
│   ├── AlertForm.tsx                     # Create/edit alert form
│   ├── AlertListItem.tsx                 # Individual alert display
│   ├── QuickAlertModal.tsx              # Quick alert creation modal
│   └── index.ts                          # Barrel export
└── app/(dashboard)/
    ├── jobs/
    │   ├── alerts/
    │   │   └── page.tsx                  # Main alerts management page
    │   ├── page.tsx                      # Original jobs page
    │   └── page-with-alerts.tsx         # Enhanced jobs page with alerts
```

## Components

### 1. Alert Types (`types/alert.ts`)

Defines TypeScript interfaces:

```typescript
- JobAlert                    # Complete alert object
- CreateJobAlertInput        # Input for creating alerts
- UpdateJobAlertInput        # Input for updating alerts
- JobAlertListResponse       # API response structure
```

### 2. API Client (`lib/api/alerts.ts`)

Provides functions for:

- `getAlerts()` - Fetch all user alerts
- `getAlert(id)` - Get single alert
- `createAlert(data)` - Create new alert
- `updateAlert(id, data)` - Update existing alert
- `deleteAlert(id)` - Delete alert
- `toggleAlert(id, isActive)` - Enable/disable alert

### 3. React Query Hooks (`hooks/useJobAlerts.ts`)

Custom hooks with optimistic updates and error handling:

- `useJobAlerts()` - Get all alerts
- `useJobAlert(id)` - Get single alert
- `useCreateJobAlert()` - Create alert mutation
- `useUpdateJobAlert()` - Update alert mutation
- `useDeleteJobAlert()` - Delete alert mutation
- `useToggleJobAlert()` - Toggle alert mutation

### 4. AlertForm Component

**Location:** `components/features/alerts/AlertForm.tsx`

**Features:**
- React Hook Form with Zod validation
- Support for all alert criteria:
  - Alert name (required)
  - Keywords (comma-separated)
  - Job title
  - Location (with remote option)
  - Salary range (min/max)
  - Employment types (multi-select)
  - Experience levels (multi-select)
  - Notification frequency
  - Active/inactive toggle
- Real-time validation
- Error handling
- Edit mode support

**Props:**
```typescript
{
  alert?: JobAlert;           // Optional for edit mode
  onSubmit: (data) => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

### 5. AlertListItem Component

**Location:** `components/features/alerts/AlertListItem.tsx`

**Features:**
- Display all alert criteria
- Visual indicators for active/paused state
- Toggle switch for enabling/disabling
- Edit and delete actions
- Delete confirmation
- Last triggered date
- Badge displays for keywords, employment types, experience levels

**Props:**
```typescript
{
  alert: JobAlert;
  onEdit: (alert) => void;
  onDelete: (id) => void;
  onToggle: (id, isActive) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}
```

### 6. QuickAlertModal Component

**Location:** `components/features/alerts/QuickAlertModal.tsx`

**Features:**
- Simplified alert creation
- Pre-populated with current search criteria
- Quick access from job search page
- Essential fields only (name, keywords, location, frequency)

**Props:**
```typescript
{
  open: boolean;
  onClose: () => void;
  defaultKeywords?: string;
  defaultLocation?: string;
}
```

### 7. Job Alerts Page

**Location:** `app/(dashboard)/jobs/alerts/page.tsx`

**Features:**
- List of all alerts (active and paused separately)
- Stats dashboard (total, active, paused)
- Create new alert button
- Inline editing and deletion
- Toggle alerts on/off
- Empty state with CTA
- Help text explaining how alerts work

**URL:** `/jobs/alerts`

### 8. Enhanced Job Search Page

**Location:** `app/(dashboard)/jobs/page-with-alerts.tsx`

**Enhancements:**
- "My Alerts" button in header
- "Create Alert for This Search" button in filter section
- Quick alert creation modal
- Alert creation option in empty state

## Usage Examples

### Creating an Alert

```typescript
import { useCreateJobAlert } from '@/hooks/useJobAlerts';

const createAlert = useCreateJobAlert();

const handleSubmit = async (data) => {
  await createAlert.mutateAsync({
    name: 'Senior React Developer in SF',
    keywords: ['React', 'TypeScript', 'Next.js'],
    location: 'San Francisco',
    isRemote: true,
    salaryMin: 120000,
    salaryMax: 180000,
    employmentType: ['full-time'],
    experienceLevel: ['senior', 'lead'],
    notificationFrequency: 'daily',
    isActive: true,
  });
};
```

### Updating an Alert

```typescript
import { useUpdateJobAlert } from '@/hooks/useJobAlerts';

const updateAlert = useUpdateJobAlert();

await updateAlert.mutateAsync({
  id: 'alert-123',
  data: {
    notificationFrequency: 'weekly',
    salaryMin: 150000,
  },
});
```

### Toggling Alert Status

```typescript
import { useToggleJobAlert } from '@/hooks/useJobAlerts';

const toggleAlert = useToggleJobAlert();

await toggleAlert.mutateAsync({
  id: 'alert-123',
  isActive: false,  // Pause the alert
});
```

## Form Validation

The AlertForm uses Zod schema validation:

- **Name:** Required, 1-100 characters
- **Salary Range:** Min must be ≤ Max
- **Keywords:** Optional, comma-separated
- **Notification Frequency:** Required, one of instant/daily/weekly

## State Management

- **React Query** for server state management
- Automatic cache invalidation on mutations
- Optimistic updates for better UX
- 2-minute stale time for lists
- 5-minute stale time for individual alerts

## User Experience Features

1. **Toast Notifications:** Success/error messages for all operations
2. **Loading States:** Spinners during API calls
3. **Optimistic UI:** Immediate feedback on actions
4. **Empty States:** Helpful CTAs when no alerts exist
5. **Confirmation Dialogs:** Prevent accidental deletions
6. **Inline Editing:** Edit alerts without page navigation
7. **Visual Indicators:** Clear active/paused states
8. **Responsive Design:** Mobile-friendly layouts

## Integration Points

### Backend API Endpoints

The frontend expects these endpoints in the job-service:

```
POST   /jobs/alerts          # Create alert
GET    /jobs/alerts          # List alerts
GET    /jobs/alerts/:id      # Get alert
PUT    /jobs/alerts/:id      # Update alert
DELETE /jobs/alerts/:id      # Delete alert
PATCH  /jobs/alerts/:id      # Toggle alert (partial update)
```

### Navigation

Add to navigation menu:
```typescript
{
  name: 'Job Alerts',
  href: '/jobs/alerts',
  icon: Bell,
}
```

## Testing Recommendations

### Unit Tests
- Form validation logic
- Date formatting utilities
- Salary formatting

### Integration Tests
- Create alert flow
- Edit alert flow
- Delete alert flow
- Toggle alert status
- Quick alert from search

### E2E Tests
- Complete alert management workflow
- Navigation between pages
- Empty states and CTAs

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Focus management in modals
- Screen reader announcements
- Color contrast compliance

## Performance Considerations

- React Hook Form for performant forms
- Debounced search inputs
- Lazy loading of modal components
- Optimized re-renders with useCallback
- Query result caching

## Future Enhancements

1. **Alert Preview:** Test alert criteria before saving
2. **Alert Templates:** Quick-start templates for common searches
3. **Alert Analytics:** Track alert performance and match rates
4. **Bulk Actions:** Enable/disable multiple alerts at once
5. **Alert Sharing:** Share alert criteria with team members
6. **Smart Suggestions:** AI-powered alert recommendations
7. **Advanced Filters:** Industry, company size, benefits, etc.
8. **Notification Preferences:** Email, SMS, push notifications
9. **Alert History:** View jobs matched by each alert
10. **Duplicate Detection:** Warn when creating similar alerts

## Migration Guide

To enable the job alerts feature in the existing app:

1. **Replace the job search page:**
   ```bash
   # Backup current page
   mv apps/web/src/app/(dashboard)/jobs/page.tsx apps/web/src/app/(dashboard)/jobs/page.tsx.backup

   # Use the enhanced version
   mv apps/web/src/app/(dashboard)/jobs/page-with-alerts.tsx apps/web/src/app/(dashboard)/jobs/page.tsx
   ```

2. **Update navigation** to include link to `/jobs/alerts`

3. **Install dependencies** (if not already installed):
   ```bash
   npm install react-hook-form @hookform/resolvers zod
   ```

4. **Verify backend endpoints** are available and match the expected API contract

## Support

For issues or questions:
- Check backend API availability
- Verify environment variables
- Review browser console for errors
- Check network tab for API responses

## License

Part of the ApplyforUs platform.

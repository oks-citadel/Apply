# Job Reporting Feature

## Overview

The job reporting feature allows users to report inappropriate, spam, or misleading job listings. Administrators can review and manage these reports through a dedicated admin interface.

## User Flow

### Reporting a Job

1. User navigates to a job detail page
2. User clicks the "Report" button in the action bar
3. A modal opens with a report form
4. User selects a reason from the dropdown:
   - Spam/Scam
   - Misleading information
   - Discriminatory content
   - Expired/Closed position
   - Duplicate listing
   - Other
5. User optionally provides additional details
6. User submits the report
7. A success confirmation is shown
8. The job is marked as "Reported" and the report button is disabled

### Already Reported State

Once a user has reported a job, the "Report" button changes to show "Reported" and becomes disabled. This prevents duplicate reports from the same user.

## Admin Management

Administrators can access the job reports management page at `/admin/job-reports`.

### Features

- **Dashboard Overview**: View statistics on total, pending, reviewing, and resolved reports
- **Filtering**: Filter reports by status and reason
- **Report Details**: View full details of each report including:
  - Job information (title, company, location)
  - Report reason and details
  - Reporter information
  - Timestamps
- **Status Management**: Update report status:
  - Pending → Reviewing
  - Reviewing → Resolved or Dismissed
- **Direct Job Access**: Link to view the reported job listing

## Components

### `ReportJobModal.tsx`

Main component for the job reporting interface.

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal is closed
- `jobId: string` - ID of the job being reported
- `jobTitle: string` - Title of the job (for display)

**Features:**
- Form validation using Zod schema
- React Hook Form integration
- Loading states during submission
- Success confirmation screen
- Auto-close after successful submission

**Usage:**
```tsx
import { ReportJobModal } from '@/components/features/jobs/ReportJobModal';

<ReportJobModal
  isOpen={showReportModal}
  onClose={() => setShowReportModal(false)}
  jobId={job.id}
  jobTitle={job.title}
/>
```

## API Endpoints

### User Endpoints

**POST** `/jobs/:id/report`
- Report a job posting
- Request body:
  ```json
  {
    "reason": "spam" | "misleading" | "discriminatory" | "expired" | "duplicate" | "other",
    "details": "Optional additional information"
  }
  ```
- Response: `{ "message": "Report submitted successfully" }`

### Admin Endpoints

**GET** `/jobs/reports`
- Get all job reports (Admin only)
- Query parameters:
  - `page?: number`
  - `limit?: number`
  - `status?: "pending" | "reviewing" | "resolved" | "dismissed"`
  - `reason?: string`
- Response:
  ```json
  {
    "reports": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
  ```

**PUT** `/jobs/reports/:id/status`
- Update report status (Admin only)
- Request body:
  ```json
  {
    "status": "reviewing" | "resolved" | "dismissed",
    "adminNotes": "Optional admin notes"
  }
  ```

## Hooks

### `useReportJob()`

Hook for submitting job reports.

```tsx
const reportJob = useReportJob();

await reportJob.mutateAsync({
  jobId: 'job-123',
  reason: 'spam',
  details: 'This job is clearly a scam',
});
```

### `useJobReports(params)`

Hook for fetching job reports (Admin only).

```tsx
const { data, isLoading, error } = useJobReports({
  page: 1,
  limit: 20,
  status: 'pending',
});
```

### `useUpdateReportStatus()`

Hook for updating report status (Admin only).

```tsx
const updateStatus = useUpdateReportStatus();

await updateStatus.mutateAsync({
  reportId: 'report-123',
  status: 'resolved',
  adminNotes: 'Job listing removed',
});
```

## Types

### `JobReport`

```typescript
interface JobReport {
  id: string;
  jobId: string;
  userId: string;
  reason: 'spam' | 'misleading' | 'discriminatory' | 'expired' | 'duplicate' | 'other';
  details?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  job?: Job;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}
```

## Styling

The components use Tailwind CSS and follow the existing design system:
- Primary color for actions
- Warning/error colors for report-related UI
- Success colors for confirmations
- Proper dark mode support

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Error messages properly associated with form fields
- Focus management in modals

## Security Considerations

1. **Rate Limiting**: Backend should implement rate limiting to prevent abuse
2. **Authentication**: Users must be authenticated to submit reports
3. **Authorization**: Admin endpoints require admin role
4. **Validation**: All inputs are validated on both client and server
5. **Anti-Spam**: Prevent duplicate reports from same user for same job

## Testing

To test the reporting feature:

1. **User Flow**:
   - Navigate to any job detail page
   - Click "Report" button
   - Fill out and submit the form
   - Verify success message
   - Refresh page and verify "Reported" state

2. **Admin Flow**:
   - Navigate to `/admin/job-reports`
   - Verify reports list loads
   - Test filters
   - Click on a report to view details
   - Update report status
   - Verify changes persist

## Future Enhancements

- Email notifications to admins for new reports
- Automatic job removal after multiple reports
- Report history for each job
- User report history/reputation system
- Bulk actions for managing multiple reports
- Analytics dashboard for report trends

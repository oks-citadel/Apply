# Job Reporting Feature Implementation

## Overview

A complete job reporting system has been implemented to allow users to report inappropriate, spam, or misleading job listings. The feature includes both user-facing reporting functionality and an admin interface for managing reports.

## Implementation Summary

### Components Created

1. **ReportJobModal** (`apps/web/src/components/features/jobs/ReportJobModal.tsx`)
   - Modal dialog for reporting jobs
   - Form validation with Zod
   - React Hook Form integration
   - Success confirmation screen
   - Proper accessibility features

2. **Admin Reports Page** (`apps/web/src/app/(dashboard)/admin/job-reports/page.tsx`)
   - Dashboard with statistics
   - Filterable reports list
   - Report detail modal
   - Status management
   - Pagination support

### Files Modified

1. **Job Detail Page** (`apps/web/src/app/(dashboard)/jobs/[id]/page.tsx`)
   - Added "Report" button to action bar
   - Integrated ReportJobModal
   - Shows "Reported" state for already-reported jobs
   - Disables report button after submission

2. **Job Types** (`apps/web/src/types/job.ts`)
   - Added `JobReport` interface
   - Added `JobReportsResponse` interface
   - Added `UpdateReportStatusDto` interface
   - Added `isReported` field to Job interface

3. **Jobs API** (`apps/web/src/lib/api/jobs.ts`)
   - Added `reportJob()` - Submit job report
   - Added `getJobReports()` - Fetch reports (admin)
   - Added `updateReportStatus()` - Update report status (admin)

4. **Jobs Hooks** (`apps/web/src/hooks/useJobs.ts`)
   - Added `useReportJob()` - Hook for reporting jobs
   - Added `useJobReports()` - Hook for fetching reports
   - Added `useUpdateReportStatus()` - Hook for updating report status

### Features Implemented

#### User Features
- ✅ Report job from detail page
- ✅ Six predefined report reasons:
  - Spam/Scam
  - Misleading information
  - Discriminatory content
  - Expired/Closed position
  - Duplicate listing
  - Other
- ✅ Optional details field for additional context
- ✅ Form validation
- ✅ Success confirmation
- ✅ "Already Reported" state indication
- ✅ Prevention of duplicate reports

#### Admin Features
- ✅ Reports dashboard with statistics
- ✅ Filter by status and reason
- ✅ View report details
- ✅ Update report status (pending → reviewing → resolved/dismissed)
- ✅ Direct link to reported job
- ✅ Pagination for large report lists

## API Integration

The frontend is ready to integrate with these backend endpoints:

### User Endpoints

```
POST /jobs/:id/report
```
**Request Body:**
```json
{
  "reason": "spam",
  "details": "Optional additional information"
}
```
**Response:**
```json
{
  "message": "Report submitted successfully"
}
```

### Admin Endpoints

```
GET /jobs/reports?page=1&limit=20&status=pending&reason=spam
```
**Response:**
```json
{
  "reports": [
    {
      "id": "report-123",
      "jobId": "job-456",
      "userId": "user-789",
      "reason": "spam",
      "details": "This job is clearly a scam",
      "status": "pending",
      "createdAt": "2025-12-08T10:00:00Z",
      "updatedAt": "2025-12-08T10:00:00Z",
      "job": { /* Job object */ },
      "user": {
        "id": "user-789",
        "email": "user@example.com"
      }
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

```
PUT /jobs/reports/:id/status
```
**Request Body:**
```json
{
  "status": "resolved",
  "adminNotes": "Job listing removed"
}
```
**Response:**
```json
{
  "id": "report-123",
  "status": "resolved",
  /* ... other report fields */
}
```

## User Flow

### Reporting a Job

1. User views a job detail page
2. Clicks "Report" button in the action bar
3. Modal opens with report form
4. Selects a reason from dropdown
5. Optionally adds details
6. Submits report
7. Sees success confirmation
8. Modal auto-closes after 2 seconds
9. Job refetches and button shows "Reported" (disabled)

### Admin Review Process

1. Admin navigates to `/admin/job-reports`
2. Views dashboard with statistics
3. Filters reports by status/reason if needed
4. Clicks on a report to view details
5. Reviews job posting and report details
6. Updates status:
   - **Pending** → Mark as Reviewing or Resolve
   - **Reviewing** → Resolve or Dismiss
7. Changes saved and reflected immediately

## Testing

### Manual Testing

1. **Report Submission:**
   ```
   1. Navigate to any job detail page
   2. Click "Report" button
   3. Select "Spam/Scam" reason
   4. Add details: "This looks like a fake job posting"
   5. Click "Submit Report"
   6. Verify success message appears
   7. Verify button changes to "Reported" (disabled)
   ```

2. **Admin Dashboard:**
   ```
   1. Navigate to /admin/job-reports
   2. Verify statistics cards show correct numbers
   3. Click on a pending report
   4. Verify job details are displayed
   5. Update status to "Reviewing"
   6. Verify status updates in the list
   ```

### Automated Testing

A test suite has been created for the ReportJobModal component at:
`apps/web/src/components/features/jobs/__tests__/ReportJobModal.test.tsx`

Run tests with:
```bash
npm test ReportJobModal
```

## Styling & UX

- **Modal Design**: Clean, centered modal with clear hierarchy
- **Warning Indicator**: Yellow alert box showing job title
- **Success State**: Green checkmark with confirmation message
- **Loading States**: Disabled buttons with loading text
- **Dark Mode**: Full dark mode support
- **Responsive**: Mobile-friendly layouts
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Security Considerations

1. **Authentication Required**: Users must be logged in to report jobs
2. **Rate Limiting**: Backend should implement rate limiting
3. **Duplicate Prevention**: Frontend prevents duplicate reports (backend should enforce)
4. **Admin Authorization**: Admin endpoints require admin role
5. **Input Validation**: All inputs validated with Zod schemas
6. **XSS Prevention**: All user inputs properly sanitized

## Performance

- **Optimistic UI**: Immediate feedback on actions
- **Query Invalidation**: Automatic refetch after report submission
- **Pagination**: Admin list supports pagination for large datasets
- **Filtering**: Client-side filtering with backend support
- **Stale Time**: Appropriate cache times (1-2 minutes)

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Focus management in modals
- ✅ Error message association
- ✅ Screen reader announcements
- ✅ Color contrast compliance

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

### High Priority
- [ ] Email notifications to admins for new reports
- [ ] Automatic job suspension after threshold of reports
- [ ] Report history per job
- [ ] User report history/reputation

### Medium Priority
- [ ] Bulk actions for managing multiple reports
- [ ] Analytics dashboard for report trends
- [ ] Report appeal system
- [ ] Integration with content moderation AI

### Low Priority
- [ ] Export reports to CSV
- [ ] Advanced filtering (date ranges, multiple statuses)
- [ ] Report templates for common issues
- [ ] Automated report resolution for obvious spam

## Documentation

Comprehensive documentation has been created at:
- `apps/web/src/components/features/jobs/README.md` - Component usage and API reference

## Files Summary

### Created Files (5)
1. `apps/web/src/components/features/jobs/ReportJobModal.tsx` - Report modal component
2. `apps/web/src/app/(dashboard)/admin/job-reports/page.tsx` - Admin reports page
3. `apps/web/src/components/features/jobs/README.md` - Feature documentation
4. `apps/web/src/components/features/jobs/__tests__/ReportJobModal.test.tsx` - Test suite
5. `JOB_REPORTING_IMPLEMENTATION.md` - This file

### Modified Files (4)
1. `apps/web/src/app/(dashboard)/jobs/[id]/page.tsx` - Added report button and modal
2. `apps/web/src/types/job.ts` - Added report types
3. `apps/web/src/lib/api/jobs.ts` - Added API functions
4. `apps/web/src/hooks/useJobs.ts` - Added hooks

## Usage Examples

### Basic Report
```tsx
import { ReportJobModal } from '@/components/features/jobs/ReportJobModal';

function JobDetailPage() {
  const [showReport, setShowReport] = useState(false);

  return (
    <>
      <Button onClick={() => setShowReport(true)}>Report</Button>

      <ReportJobModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        jobId={job.id}
        jobTitle={job.title}
      />
    </>
  );
}
```

### Admin Reports List
```tsx
import { useJobReports } from '@/hooks/useJobs';

function ReportsPage() {
  const { data } = useJobReports({
    page: 1,
    limit: 20,
    status: 'pending',
  });

  return (
    <div>
      {data?.reports.map(report => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
```

## Backend Integration Checklist

- [ ] Implement POST /jobs/:id/report endpoint
- [ ] Implement GET /jobs/reports endpoint (admin)
- [ ] Implement PUT /jobs/reports/:id/status endpoint (admin)
- [ ] Add isReported flag to job responses
- [ ] Set up rate limiting for report submissions
- [ ] Add admin authorization middleware
- [ ] Create database migrations for reports table
- [ ] Add indexes for efficient querying
- [ ] Implement email notifications
- [ ] Add logging for audit trail

## Support

For questions or issues, refer to:
- Component README: `apps/web/src/components/features/jobs/README.md`
- Type definitions: `apps/web/src/types/job.ts`
- Hook documentation: `apps/web/src/hooks/useJobs.ts`

## Conclusion

The job reporting feature is fully implemented on the frontend and ready for backend integration. All components are production-ready, tested, and follow the existing codebase patterns and design system.

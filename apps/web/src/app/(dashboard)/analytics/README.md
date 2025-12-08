# Analytics Dashboard

Comprehensive analytics and visualizations for job search performance tracking.

## Overview

The Analytics Dashboard provides users with detailed insights into their job application performance, including:

- Application trends over time
- Response rate metrics
- Interview and offer statistics
- Company-specific analytics
- Category distribution
- Weekly activity patterns
- Success metrics with industry benchmarks

## Features

### 1. Summary Statistics Cards

Four key metrics displayed at the top:
- **Total Applications**: Total number of applications submitted
- **Response Rate**: Percentage of applications that received responses
- **Interview Rate**: Percentage of responses leading to interviews
- **Offers Received**: Total number of job offers

Each card includes trend indicators (up/down) comparing to the previous period.

### 2. Success Metrics

Visual representation of conversion rates:
- **Application to Response**: % of applications receiving responses
- **Response to Interview**: % of responses leading to interviews
- **Interview to Offer**: % of interviews resulting in offers

Each metric shows:
- Current value
- Industry benchmark target
- Progress bar
- Above/below target indicator
- Overall success score (0-100)

### 3. Application Timeline Charts

**Line/Bar Chart** showing applications, interviews, and offers over time:
- Switchable between line and bar chart views
- Color-coded metrics (blue, green, purple)
- Interactive tooltips
- Responsive design

### 4. Application Status Distribution

**Donut Chart** showing breakdown of applications by status:
- Pending, Reviewed, Interview, Offer, Rejected
- Percentage labels on chart
- Total applications count
- Color-coded categories
- Legend with counts

### 5. Response Rate Trends

**Bar Chart** displaying response metrics over time:
- Response rate percentage
- Average response time in days
- Total responses per period
- Summary statistics below chart

### 6. Top Companies

**Horizontal Bar Chart** with detailed company data:
- Top 8-10 companies by application volume
- Color-coded bars
- Detailed table showing:
  - Applications sent
  - Responses received
  - Response rate percentage
- Truncated long company names

### 7. Job Category Distribution

**Pie Chart** showing applications by job category:
- Color-coded categories
- Percentage distribution
- Total applications count
- Top 5 categories list with counts

### 8. Weekly Activity Heatmap

**Heatmap** showing user activity patterns:
- 7 days (Mon-Sun) by 24 hours
- Color intensity based on activity level
- Hover tooltips with activity counts
- Hour markers (every 3 hours)
- Legend showing intensity scale

### 9. Date Range Filtering

**Date Range Picker** with:
- **Quick Presets**:
  - Last 7 days
  - Last 30 days
  - Last 90 days
  - This week
  - This month
  - This year
- **Custom Range**:
  - Start date selector
  - End date selector
  - Validation (start < end)
- Apply/Cancel actions

### 10. Data Export

**Export Button** supporting:
- **CSV Export**: Spreadsheet format for data analysis
- **PDF Export**: Report format for sharing
- Downloads include filtered date range
- Timestamped filenames

### 11. Insights and Tips

Two informational cards:
- **Improve Your Success Rate**: Actionable tips
- **Your Analytics Insights**: Personalized recommendations based on data

## Component Structure

```
analytics/
├── page.tsx                      # Main analytics page
├── README.md                     # This file
└── components/
    ├── ApplicationsChart.tsx     # Timeline line/bar chart
    ├── ApplicationsPieChart.tsx  # Status donut chart
    ├── ResponseRateChart.tsx     # Response trends bar chart
    ├── TopCompaniesChart.tsx     # Horizontal bar chart
    ├── JobCategoryChart.tsx      # Category pie chart
    ├── SuccessMetrics.tsx        # Conversion rate metrics
    ├── WeeklyActivityHeatmap.tsx # Activity heatmap
    ├── DateRangePicker.tsx       # Date range selector
    ├── ExportButton.tsx          # Export functionality
    └── StatsCards.tsx            # Summary stat cards
```

## API Integration

### Endpoints Used

1. **GET /analytics/dashboard** - Dashboard summary stats
   ```typescript
   {
     totalApplications: number;
     responseRate: number;
     interviewRate: number;
     offerCount: number;
     applicationsTrend?: number;
     responseTrend?: number;
     interviewTrend?: number;
     offerTrend?: number;
   }
   ```

2. **GET /analytics/applications** - Application analytics
   ```typescript
   {
     timeline: TimelineData[];
     statusBreakdown: StatusData[];
     conversionRates: ConversionRates;
   }
   ```

3. **GET /analytics/jobs** - Job search analytics
   ```typescript
   {
     topCompanies: CompanyData[];
     categoryDistribution: CategoryData[];
     locationDistribution: LocationData[];
     salaryRanges: SalaryRangeData[];
   }
   ```

4. **GET /analytics/activity** - User activity metrics
   ```typescript
   {
     weeklyActivity: ActivityData[];
     peakHours: PeakHourData[];
     productivityScore: number;
   }
   ```

5. **GET /analytics/response-trends** - Response rate trends
   ```typescript
   ResponseTrend[] {
     period: string;
     responseRate: number;
     avgResponseTime: number;
     totalResponses: number;
   }
   ```

6. **GET /analytics/export/:format** - Export data (CSV/PDF)

### Query Parameters

All endpoints support optional filters:
```typescript
{
  startDate?: string;  // ISO date string
  endDate?: string;    // ISO date string
  status?: string[];
  companies?: string[];
  categories?: string[];
}
```

## State Management

Uses React Query for data fetching with:
- 5-minute stale time
- Automatic background refetching
- Loading states per query
- Error handling per query
- Manual refetch capability

## Responsive Design

### Desktop (lg: 1024px+)
- 2-column layouts for charts
- Full-width heatmap
- 4-column stats grid

### Tablet (md: 768px)
- 2-column chart layouts
- 2-column stats grid
- Stacked insights cards

### Mobile (< 768px)
- Single-column layouts
- Stacked date picker and export
- Scrollable heatmap
- Full-width charts

## Loading States

All components include skeleton loaders:
- **Stat Cards**: Pulsing rectangular placeholders
- **Charts**: Full-height pulsing backgrounds
- **Heatmap**: Pulsing grid placeholder
- **Export Button**: Spinner icon while exporting

## Empty States

Graceful handling when no data available:
- Friendly messages
- Suggestions for next steps
- Maintains component structure
- No layout shifts

## Colors and Theme

### Chart Colors
- Primary Blue: `#3b82f6` (Applications, Main metrics)
- Green: `#10b981` (Interviews, Positive trends)
- Purple: `#8b5cf6` (Offers, Premium features)
- Orange: `#f59e0b` (Pending, Warnings)
- Red: `#ef4444` (Rejected, Alerts)
- Cyan: `#06b6d4` (Additional data)
- Pink: `#ec4899` (Highlights)
- Teal: `#14b8a6` (Accents)

### Status Colors
- Pending: Orange (`#f59e0b`)
- Reviewed/Applied: Blue (`#3b82f6`)
- Interview: Green (`#10b981`)
- Offer: Purple (`#8b5cf6`)
- Accepted: Bright Green (`#22c55e`)
- Rejected: Red (`#ef4444`)
- Withdrawn: Gray (`#6b7280`)

## Usage Example

```tsx
import AnalyticsPage from '@/app/(dashboard)/analytics/page';

// The page handles everything internally:
// - Date range state
// - Data fetching
// - Error handling
// - Loading states
// - Responsive layouts

// Simply render the page:
<AnalyticsPage />
```

## Hooks

### useAnalyticsV2

Custom hook for fetching all analytics data:

```typescript
const {
  dashboardSummary,
  applicationAnalytics,
  jobAnalytics,
  activityMetrics,
  responseTrends,
  isLoading,
  error,
  refetch
} = useAnalyticsV2(filters);
```

### useExportAnalytics

Hook for exporting data:

```typescript
const { exportData } = useExportAnalytics();

await exportData('csv', filters);
await exportData('pdf', filters);
```

## Best Practices

1. **Date Ranges**: Default to last 30 days for balanced performance and insights
2. **Error Handling**: Always provide fallback UI and error messages
3. **Loading States**: Show skeletons during data fetching
4. **Empty States**: Guide users when no data exists
5. **Mobile First**: Ensure all charts are readable on mobile
6. **Performance**: Use React Query caching and stale time
7. **Accessibility**: Include ARIA labels and keyboard navigation
8. **Export**: Include date range in export filenames

## Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Advanced filtering (by status, company, category)
- [ ] Comparison mode (compare periods)
- [ ] Custom metric creation
- [ ] Email report scheduling
- [ ] Chart customization preferences
- [ ] A/B testing for application strategies
- [ ] Predictive analytics (success probability)
- [ ] Goal setting and tracking
- [ ] Team/coach sharing capabilities

## Testing

Key test scenarios:
- Loading states render correctly
- Empty states display appropriate messages
- Date range filtering works
- Export generates valid files
- Charts render with mock data
- Responsive breakpoints work
- Error states handle gracefully
- Tooltips show correct data

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast meets WCAG AA
- Screen reader friendly
- Focus indicators visible
- Alternative text for visualizations

## Performance

- Lazy loading for chart components
- React Query caching (5 min)
- Memoized filter transformations
- Optimized re-renders with useMemo
- Debounced date picker updates
- Code splitting for route
- Compressed chart data

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Android 90+

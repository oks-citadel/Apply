# Analytics Dashboard - Quick Reference Card

## 🚀 Quick Access

**URL**: `/analytics`
**Location**: `apps/web/src/app/(dashboard)/analytics/page.tsx`

## 📊 Components (11)

| Component | File | Purpose |
|-----------|------|---------|
| `<DateRangePicker />` | `DateRangePicker.tsx` | Date filtering with presets |
| `<ExportButton />` | `ExportButton.tsx` | CSV/PDF export |
| `<StatsCards />` | `StatsCards.tsx` | 4 summary metrics |
| `<SuccessMetrics />` | `SuccessMetrics.tsx` | Conversion rates + benchmarks |
| `<ApplicationsChart />` | `ApplicationsChart.tsx` | Timeline line/bar chart |
| `<ApplicationsPieChart />` | `ApplicationsPieChart.tsx` | Status donut chart |
| `<ResponseRateChart />` | `ResponseRateChart.tsx` | Response trends bar chart |
| `<TopCompaniesChart />` | `TopCompaniesChart.tsx` | Horizontal bar chart |
| `<JobCategoryChart />` | `JobCategoryChart.tsx` | Category pie chart |
| `<WeeklyActivityHeatmap />` | `WeeklyActivityHeatmap.tsx` | 7x24 activity grid |
| `<JobMatchesTable />` | `JobMatchesTable.tsx` | Match scores table |

## 🔌 API Endpoints

```typescript
GET /analytics/dashboard          // Summary stats
GET /analytics/applications       // App analytics + timeline
GET /analytics/jobs              // Companies + categories
GET /analytics/activity          // User activity heatmap
GET /analytics/response-trends   // Response rate trends
GET /analytics/export/:format    // Export (csv/pdf)
```

## 🎣 Hooks

```typescript
// Main analytics hook
import { useAnalyticsV2 } from '@/hooks/useAnalytics';

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

// Export hook
import { useExportAnalytics } from '@/hooks/useAnalytics';

const { exportData } = useExportAnalytics();
await exportData('csv', filters);
```

## 📦 Types

```typescript
import {
  type DashboardSummary,
  type ApplicationAnalytics,
  type JobAnalytics,
  type ActivityMetrics,
  type ResponseTrend,
  type AnalyticsFilters,
} from '@/lib/api/analytics';
```

## 🎨 Colors

```typescript
const CHART_COLORS = {
  blue: '#3b82f6',      // Applications
  green: '#10b981',     // Interviews
  purple: '#8b5cf6',    // Offers
  orange: '#f59e0b',    // Pending
  red: '#ef4444',       // Rejected
  cyan: '#06b6d4',      // Additional
  pink: '#ec4899',      // Highlights
  teal: '#14b8a6',      // Accents
};
```

## 📱 Responsive Breakpoints

```
Mobile:  < 768px   → 1 column
Tablet:  768-1024  → 2 columns
Desktop: > 1024px  → 2-4 columns
```

## 🔧 Common Tasks

### Add New Chart
```typescript
// 1. Create component
export function MyChart({ data, isLoading }) {
  if (isLoading) return <LoadingState />;
  if (!data) return <EmptyState />;
  return <ResponsiveContainer>...</ResponsiveContainer>;
}

// 2. Add to index.ts
export { MyChart } from './MyChart';

// 3. Use in page
import { MyChart } from '@/components/features/analytics';
<MyChart data={myData} isLoading={isLoading.myData} />
```

### Add New Metric
```typescript
// 1. Update API types
export interface DashboardSummary {
  // ... existing
  newMetric: number;
}

// 2. Add to StatsCards
<StatCard
  title="New Metric"
  value={stats.newMetric}
  icon={<Icon />}
/>
```

### Add New Filter
```typescript
// 1. Update AnalyticsFilters type
export interface AnalyticsFilters {
  // ... existing
  newFilter?: string[];
}

// 2. Update filters in page
const filters = useMemo(() => ({
  ...existingFilters,
  newFilter: selectedValues,
}), [existingFilters, selectedValues]);
```

## 🧪 Testing

```bash
# Unit tests
npm test src/components/features/analytics

# E2E test
npm run test:e2e analytics.spec.ts

# Type check
npm run type-check

# Lint
npm run lint
```

## 📋 Checklist for New Features

- [ ] Create component with TypeScript types
- [ ] Add loading state
- [ ] Add empty state
- [ ] Make responsive
- [ ] Add to index.ts
- [ ] Import in page
- [ ] Add API endpoint (if needed)
- [ ] Update hook (if needed)
- [ ] Write tests
- [ ] Update documentation

## 🐛 Common Issues

### Charts not rendering
```typescript
// Check data format
console.log('Chart data:', data);

// Verify ResponsiveContainer
<ResponsiveContainer width="100%" height="100%">
```

### Date range not updating
```typescript
// Ensure useMemo dependencies
const filters = useMemo(() => ({
  startDate: dateRange.startDate.toISOString().split('T')[0],
  endDate: dateRange.endDate.toISOString().split('T')[0],
}), [dateRange]); // ← Must include dateRange
```

### Export not working
```typescript
// Check blob handling
const blob = await analyticsApi.exportData(format, filters);
const url = window.URL.createObjectURL(blob);
// ... create link and download
window.URL.revokeObjectURL(url); // ← Don't forget cleanup
```

### Loading state stuck
```typescript
// Check React Query setup
const { data, isLoading } = useQuery({
  queryKey: ['analytics', 'dashboard', filters],
  queryFn: () => analyticsApi.getDashboardSummary(filters),
  staleTime: 5 * 60 * 1000,
});
```

## 📚 Documentation

- **Feature Docs**: `apps/web/src/app/(dashboard)/analytics/README.md`
- **Implementation**: `ANALYTICS_IMPLEMENTATION_SUMMARY.md`
- **Component Guide**: `ANALYTICS_COMPONENT_GUIDE.md`
- **This File**: `ANALYTICS_QUICK_REFERENCE.md`

## 🎯 Performance Tips

1. **Use React Query caching** (5 min stale time)
2. **Memoize expensive calculations** with `useMemo`
3. **Lazy load charts** with `dynamic()`
4. **Debounce user inputs** (date picker, filters)
5. **Optimize chart data** (limit data points)
6. **Use skeleton loaders** (better perceived performance)

## 🔒 Security Notes

- Date ranges validated (start < end)
- API calls use authenticated client
- Export limited to user's own data
- No XSS vulnerabilities (React escapes by default)
- CORS configured for API

## 🌐 Browser Support

Tested on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari 14+
- ✅ Chrome Android 90+

## 📞 Support

**Found a bug?** Check existing issues or create new one
**Need help?** Read docs or ask the team
**Want to contribute?** Follow contribution guidelines

---

**Last Updated**: 2025-12-08
**Version**: 1.0.0
**Maintainer**: Frontend Team

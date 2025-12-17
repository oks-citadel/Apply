# Analytics Dashboard - Component Guide

## Visual Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Analytics Page (/analytics)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Header: BarChart3 Icon + "Analytics"                     │  │
│  │  Actions: <DateRangePicker /> + <ExportButton />          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    <StatsCards />                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │  Total   │ │ Response │ │Interview │ │  Offers  │    │  │
│  │  │   Apps   │ │   Rate   │ │   Rate   │ │ Received │    │  │
│  │  │   156    │ │   42%    │ │   18%    │ │    5     │    │  │
│  │  │  ↑ 12%   │ │  ↑ 5%    │ │  ↓ 2%    │ │  ↑ 25%   │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  <SuccessMetrics />                        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │  │
│  │  │  Response   │ │  Interview  │ │   Offer     │        │  │
│  │  │    Rate     │ │    Rate     │ │    Rate     │        │  │
│  │  │   28.5%     │ │   45.2%     │ │   32.1%     │        │  │
│  │  │ [████████░] │ │ [████████░] │ │ [████████░] │        │  │
│  │  │ 95% target  │ │ 90% target  │ │ 107% target │        │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │  │
│  │                Overall Success Score: 97/100              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────┐ ┌────────────────────────────┐ │
│  │  <ApplicationsChart />      │ │ <ApplicationsPieChart />   │ │
│  │  ┌─────────────────────────┐│ │ ┌────────────────────────┐ │ │
│  │  │     Applications        ││ │ │   Status Distribution  │ │ │
│  │  │  [Line/Bar Toggle]      ││ │ │                        │ │ │
│  │  │         📈              ││ │ │         🍩             │ │ │
│  │  │  Week 1  Week 2  Week 3 ││ │ │    Pending: 45        │ │ │
│  │  │    ●       ●       ●    ││ │ │    Reviewed: 38       │ │ │
│  │  │                         ││ │ │    Interview: 28      │ │ │
│  │  └─────────────────────────┘│ │ └────────────────────────┘ │ │
│  └─────────────────────────────┘ └────────────────────────────┘ │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              <ResponseRateChart />                         │  │
│  │  ┌───────────────────────────────────────────────────────┐│  │
│  │  │         Response Rate Trends                          ││  │
│  │  │  ▓▓▓  ▓▓▓▓  ▓▓▓▓▓  ▓▓▓  ▓▓▓▓                         ││  │
│  │  │  Week1 Week2 Week3 Week4 Week5                        ││  │
│  │  │                                                        ││  │
│  │  │  Avg: 42.5%  |  Avg Time: 5.2 days  |  Total: 67    ││  │
│  │  └───────────────────────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────┐ ┌────────────────────────────┐ │
│  │  <TopCompaniesChart />      │ │ <JobCategoryChart />       │ │
│  │  ┌─────────────────────────┐│ │ ┌────────────────────────┐ │ │
│  │  │  Top Companies Applied  ││ │ │  Job Categories        │ │ │
│  │  │  TechCorp      ████████ ││ │ │                        │ │ │
│  │  │  StartupXYZ    ██████   ││ │ │         🥧            │ │ │
│  │  │  BigTech       █████    ││ │ │  Engineering: 45%     │ │ │
│  │  │  InnovateLab   ████     ││ │ │  Design: 20%          │ │ │
│  │  │  DataFlow      ███      ││ │ │  Product: 15%         │ │ │
│  │  │                         ││ │ │  Marketing: 12%       │ │ │
│  │  │  [Detailed Table Below] ││ │ │  Sales: 8%            │ │ │
│  │  └─────────────────────────┘│ │ └────────────────────────┘ │ │
│  └─────────────────────────────┘ └────────────────────────────┘ │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │            <WeeklyActivityHeatmap />                       │  │
│  │  ┌───────────────────────────────────────────────────────┐│  │
│  │  │       0   3   6   9   12  15  18  21                  ││  │
│  │  │  Mon  ░   ░   ▓   ███ ███ ███ ▓   ░                  ││  │
│  │  │  Tue  ░   ░   ▓   ███ ███ ███ ▓   ░                  ││  │
│  │  │  Wed  ░   ░   ▓   ███ ███ ███ ▓   ░                  ││  │
│  │  │  Thu  ░   ░   ▓   ███ ███ ███ ▓   ░                  ││  │
│  │  │  Fri  ░   ░   ▓   ███ ███ ███ ▓   ░                  ││  │
│  │  │  Sat  ░   ░   ░   ░   ░   ░   ░   ░                  ││  │
│  │  │  Sun  ░   ░   ░   ░   ░   ░   ░   ░                  ││  │
│  │  │       Less ░▓█ More                                   ││  │
│  │  └───────────────────────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────┐ ┌────────────────────────────┐ │
│  │  💡 Improve Your Success    │ │ 📊 Your Analytics Insights │ │
│  │  • Tailor your resume       │ │ • Response rate above avg  │ │
│  │  • Follow up in 5-7 days    │ │ • Keep up the good work!   │ │
│  │  • Apply to 10-15 per week  │ │ • Try new job categories   │ │
│  └─────────────────────────────┘ └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. DateRangePicker Component

**Location**: `components/features/analytics/DateRangePicker.tsx`

**Props**:
```typescript
interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}
```

**Features**:
- Dropdown with calendar icon
- 6 preset options
- Custom date inputs
- Apply/Cancel buttons

**Usage**:
```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
/>
```

---

### 2. ExportButton Component

**Location**: `components/features/analytics/ExportButton.tsx`

**Props**:
```typescript
interface ExportButtonProps {
  filters?: AnalyticsFilters;
}
```

**Features**:
- Dropdown menu
- CSV and PDF options
- Loading spinner
- Toast notifications

**Usage**:
```tsx
<ExportButton filters={filters} />
```

---

### 3. StatsCards Component

**Location**: `components/features/analytics/StatsCards.tsx`

**Props**:
```typescript
interface StatsCardsProps {
  stats: {
    totalApplications: number;
    responseRate: number;
    interviewRate: number;
    offerCount: number;
    applicationsTrend?: number;
    responseTrend?: number;
    interviewTrend?: number;
    offerTrend?: number;
  };
  isLoading?: boolean;
}
```

**Features**:
- 4 stat cards in grid
- Trend indicators (arrows + %)
- Icon per metric
- Responsive layout

**Usage**:
```tsx
<StatsCards
  stats={dashboardSummary}
  isLoading={isLoading.dashboard}
/>
```

---

### 4. SuccessMetrics Component

**Location**: `components/features/analytics/SuccessMetrics.tsx`

**Props**:
```typescript
interface SuccessMetricsProps {
  conversionRates: ConversionRates;
  isLoading?: boolean;
}
```

**Features**:
- 3 metric cards with progress bars
- Industry benchmarks
- Above/below indicators
- Overall success score

**Usage**:
```tsx
<SuccessMetrics
  conversionRates={applicationAnalytics.conversionRates}
  isLoading={isLoading.applications}
/>
```

---

### 5. ApplicationsChart Component

**Location**: `components/features/analytics/ApplicationsChart.tsx`

**Props**:
```typescript
interface ApplicationsChartProps {
  data: ApplicationData[];
  isLoading?: boolean;
}

interface ApplicationData {
  date: string;
  applications: number;
  interviews: number;
  offers: number;
}
```

**Features**:
- Line/Bar chart toggle
- 3 metrics with colors
- Interactive tooltips
- Responsive container

**Usage**:
```tsx
<ApplicationsChart
  data={timelineData}
  isLoading={isLoading.applications}
/>
```

---

### 6. ApplicationsPieChart Component

**Location**: `components/features/analytics/ApplicationsPieChart.tsx`

**Props**:
```typescript
interface ApplicationsPieChartProps {
  data?: StatusData[];
  isLoading?: boolean;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}
```

**Features**:
- Donut chart with inner radius
- Percentage labels
- Total count display
- Legend with values

**Usage**:
```tsx
<ApplicationsPieChart
  data={statusData}
  isLoading={isLoading.applications}
/>
```

---

### 7. ResponseRateChart Component

**Location**: `components/features/analytics/ResponseRateChart.tsx`

**Props**:
```typescript
interface ResponseRateChartProps {
  data: ResponseTrend[];
  isLoading?: boolean;
}

interface ResponseTrend {
  period: string;
  responseRate: number;
  avgResponseTime: number;
  totalResponses: number;
}
```

**Features**:
- Bar chart with dual metrics
- Summary statistics below
- Formatted tooltips
- Color-coded bars

**Usage**:
```tsx
<ResponseRateChart
  data={responseTrends}
  isLoading={isLoading.responseTrends}
/>
```

---

### 8. TopCompaniesChart Component

**Location**: `components/features/analytics/TopCompaniesChart.tsx`

**Props**:
```typescript
interface TopCompaniesChartProps {
  data: CompanyData[];
  isLoading?: boolean;
  limit?: number;
}

interface CompanyData {
  company: string;
  applications: number;
  responses: number;
  interviews: number;
  offers: number;
  responseRate: number;
}
```

**Features**:
- Horizontal bar chart
- Color-coded companies
- Detailed table below
- Top N limit

**Usage**:
```tsx
<TopCompaniesChart
  data={companyData}
  isLoading={isLoading.jobs}
  limit={8}
/>
```

---

### 9. JobCategoryChart Component

**Location**: `components/features/analytics/JobCategoryChart.tsx`

**Props**:
```typescript
interface JobCategoryChartProps {
  data: CategoryData[];
  isLoading?: boolean;
}

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}
```

**Features**:
- Pie/Donut chart
- Percentage labels
- Category list
- Total count

**Usage**:
```tsx
<JobCategoryChart
  data={categoryData}
  isLoading={isLoading.jobs}
/>
```

---

### 10. WeeklyActivityHeatmap Component

**Location**: `components/features/analytics/WeeklyActivityHeatmap.tsx`

**Props**:
```typescript
interface WeeklyActivityHeatmapProps {
  data: ActivityData[];
  isLoading?: boolean;
}

interface ActivityData {
  day: string;
  hour: number;
  value: number;
}
```

**Features**:
- 7x24 grid
- Color intensity
- Hover tooltips
- Hour markers
- Legend

**Usage**:
```tsx
<WeeklyActivityHeatmap
  data={activityData}
  isLoading={isLoading.activity}
/>
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     Analytics Page                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Date Range State                                  │  │
│  │  startDate: Date, endDate: Date                    │  │
│  └───────────────────┬────────────────────────────────┘  │
│                      │                                    │
│                      ▼                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Filters (useMemo)                                 │  │
│  │  { startDate: string, endDate: string }            │  │
│  └───────────────────┬────────────────────────────────┘  │
│                      │                                    │
│                      ▼                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │  useAnalyticsV2(filters)                           │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  React Query                                  │  │  │
│  │  │  - 5 parallel queries                         │  │  │
│  │  │  - 5 min stale time                           │  │  │
│  │  │  - Individual loading states                  │  │  │
│  │  │  - Error handling                             │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └───────────┬─────┬─────┬─────┬─────┬────────────────┘  │
│              │     │     │     │     │                    │
│      ┌───────┘     │     │     │     └────────┐           │
│      │   ┌─────────┘     │     └──────────┐   │           │
│      │   │   ┌───────────┘                │   │           │
│      ▼   ▼   ▼   ▼                        ▼   ▼           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Analytics API Client (lib/api/analytics.ts)      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  getDashboardSummary()                       │  │  │
│  │  │  getApplicationAnalytics()                   │  │  │
│  │  │  getJobAnalytics()                           │  │  │
│  │  │  getActivityMetrics()                        │  │  │
│  │  │  getResponseTrends()                         │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └───────────────────┬────────────────────────────────┘  │
│                      │                                    │
│                      ▼                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Backend API (analytics-service)                   │  │
│  │  GET /analytics/dashboard                          │  │
│  │  GET /analytics/applications                       │  │
│  │  GET /analytics/jobs                               │  │
│  │  GET /analytics/activity                           │  │
│  │  GET /analytics/response-trends                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Color Palette

### Primary Colors
- **Blue** (#3b82f6): Primary metric, applications
- **Green** (#10b981): Positive trends, interviews
- **Purple** (#8b5cf6): Premium features, offers
- **Orange** (#f59e0b): Warnings, pending status
- **Red** (#ef4444): Errors, rejected status

### Extended Palette (Charts)
- Cyan (#06b6d4)
- Pink (#ec4899)
- Teal (#14b8a6)
- Gray (#6b7280)

### Status Colors
```typescript
const statusColors = {
  pending: '#f59e0b',
  applied: '#3b82f6',
  reviewed: '#3b82f6',
  interview: '#10b981',
  offer: '#8b5cf6',
  accepted: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#6b7280',
};
```

## Responsive Grid System

### Desktop (lg: 1024px+)
```css
.stats-grid { grid-cols: 4 }       /* 4 columns */
.charts-row { grid-cols: 2 }       /* 2 columns */
.insights { grid-cols: 2 }         /* 2 columns */
```

### Tablet (md: 768px - 1023px)
```css
.stats-grid { grid-cols: 2 }       /* 2 columns */
.charts-row { grid-cols: 1 }       /* 1 column */
.insights { grid-cols: 2 }         /* 2 columns */
```

### Mobile (< 768px)
```css
.stats-grid { grid-cols: 1 }       /* 1 column */
.charts-row { grid-cols: 1 }       /* 1 column */
.insights { grid-cols: 1 }         /* 1 column */
```

## Testing Checklist

- [ ] All components render without errors
- [ ] Loading states display correctly
- [ ] Empty states show appropriate messages
- [ ] Date range picker updates filters
- [ ] Export button downloads files
- [ ] Charts display data correctly
- [ ] Responsive layouts work on mobile
- [ ] Tooltips show on hover
- [ ] Trend indicators show correct direction
- [ ] Success metrics calculate correctly
- [ ] Error states handle gracefully
- [ ] React Query caching works
- [ ] TypeScript types are correct
- [ ] Accessibility features work
- [ ] Browser compatibility verified

## Quick Start

1. **Navigate to analytics page**:
   ```
   http://localhost:3000/analytics
   ```

2. **Select date range**:
   - Click date range picker
   - Choose preset or custom range
   - Click "Apply"

3. **View visualizations**:
   - Scroll through all charts
   - Hover for tooltips
   - Toggle chart types

4. **Export data**:
   - Click "Export" button
   - Choose CSV or PDF
   - File downloads automatically

5. **Interpret insights**:
   - Check success metrics
   - Review top companies
   - Identify patterns in heatmap
   - Read personalized tips

## Support

For questions or issues, refer to:
- `apps/web/src/app/(dashboard)/analytics/README.md`
- `ANALYTICS_IMPLEMENTATION_SUMMARY.md`
- Component source files

'use client';

import { useState, useMemo } from 'react';
import { subDays } from 'date-fns';
import { TrendingUp, BarChart3 } from 'lucide-react';
import {
  ApplicationsChart,
  ApplicationsPieChart,
  StatsCards,
  WeeklyActivityHeatmap,
  DateRangePicker,
  ResponseRateChart,
  TopCompaniesChart,
  JobCategoryChart,
  SuccessMetrics,
  ExportButton,
} from '@/components/features/analytics';
import type { DateRange } from '@/components/features/analytics/DateRangePicker';
import { useAnalyticsV2 } from '@/hooks/useAnalytics';

export default function AnalyticsPage() {
  // Date range state with default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  // Prepare filters for API calls
  const filters = useMemo(
    () => ({
      startDate: dateRange.startDate.toISOString().split('T')[0],
      endDate: dateRange.endDate.toISOString().split('T')[0],
    }),
    [dateRange]
  );

  // Fetch analytics data
  const {
    dashboardSummary,
    applicationAnalytics,
    jobAnalytics,
    activityMetrics,
    responseTrends,
    isLoading,
  } = useAnalyticsV2(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary-600" />
            Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Insights and metrics for your job search performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <ExportButton filters={filters} />
        </div>
      </div>

      {/* Summary Stats Cards */}
      <StatsCards
        stats={{
          totalApplications: dashboardSummary?.totalApplications || 0,
          responseRate: dashboardSummary?.responseRate || 0,
          interviewRate: dashboardSummary?.interviewRate || 0,
          offerCount: dashboardSummary?.offerCount || 0,
          applicationsTrend: dashboardSummary?.applicationsTrend,
          responseTrend: dashboardSummary?.responseTrend,
          interviewTrend: dashboardSummary?.interviewTrend,
          offerTrend: dashboardSummary?.offerTrend,
        }}
        isLoading={isLoading.dashboard}
      />

      {/* Success Metrics */}
      {applicationAnalytics?.conversionRates && (
        <SuccessMetrics
          conversionRates={applicationAnalytics.conversionRates}
          isLoading={isLoading.applications}
        />
      )}

      {/* Applications Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApplicationsChart
          data={
            applicationAnalytics?.timeline.map((item) => ({
              date: new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              applications: item.applications,
              interviews: item.interviews,
              offers: item.offers,
            })) || []
          }
          isLoading={isLoading.applications}
        />
        <ApplicationsPieChart
          data={
            applicationAnalytics?.statusBreakdown.map((item) => ({
              name: item.status,
              value: item.count,
              color: getStatusColor(item.status),
            })) || []
          }
          isLoading={isLoading.applications}
        />
      </div>

      {/* Response Rate Trends */}
      <ResponseRateChart data={responseTrends || []} isLoading={isLoading.responseTrends} />

      {/* Companies and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopCompaniesChart
          data={jobAnalytics?.topCompanies || []}
          isLoading={isLoading.jobs}
          limit={8}
        />
        <JobCategoryChart
          data={jobAnalytics?.categoryDistribution || []}
          isLoading={isLoading.jobs}
        />
      </div>

      {/* Weekly Activity Heatmap */}
      <WeeklyActivityHeatmap
        data={activityMetrics?.weeklyActivity || []}
        isLoading={isLoading.activity}
      />

      {/* Insights and Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Improve Your Success Rate</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Tailor your resume for each application to increase response rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Follow up within 5-7 days if you haven't heard back</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Apply to 10-15 targeted positions per week for best results</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Your Analytics Insights</h3>
              <div className="space-y-2 text-sm text-gray-700">
                {dashboardSummary && (
                  <>
                    {dashboardSummary.responseRate > 30 && (
                      <p className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>Your response rate is above average! Keep it up!</span>
                      </p>
                    )}
                    {dashboardSummary.responseRate < 20 && (
                      <p className="flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5">!</span>
                        <span>Consider refining your application materials to boost responses</span>
                      </p>
                    )}
                    {dashboardSummary.totalApplications < 10 && (
                      <p className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">→</span>
                        <span>Increase your application volume for better opportunities</span>
                      </p>
                    )}
                    {!dashboardSummary.responseRate && !dashboardSummary.totalApplications && (
                      <p className="flex items-start gap-2">
                        <span className="text-gray-600 mt-0.5">•</span>
                        <span>Start applying to jobs to see personalized insights here</span>
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get status colors
function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    applied: '#3b82f6',
    reviewing: '#3b82f6',
    reviewed: '#3b82f6',
    'phone screen': '#10b981',
    interview: '#10b981',
    'technical interview': '#10b981',
    'final interview': '#8b5cf6',
    offer: '#8b5cf6',
    accepted: '#22c55e',
    rejected: '#ef4444',
    withdrawn: '#6b7280',
  };

  return statusColors[status.toLowerCase()] || '#6b7280';
}

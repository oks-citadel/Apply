'use client';

import { useState, useEffect, useCallback } from 'react';

interface AnalyticsStats {
  totalApplications: number;
  responseRate: number;
  interviewRate: number;
  offerCount: number;
  applicationsTrend?: number;
  responseTrend?: number;
  interviewTrend?: number;
  offerTrend?: number;
}

interface ApplicationTrendData {
  date: string;
  applications: number;
  interviews: number;
  offers: number;
}

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

interface JobMatch {
  id: string;
  company: string;
  position: string;
  matchScore: number;
  status: 'pending' | 'applied' | 'interview' | 'offer' | 'rejected';
  dateApplied: string;
}

interface ActivityData {
  day: string;
  hour: number;
  value: number;
}

interface AnalyticsData {
  stats: AnalyticsStats;
  trendData: ApplicationTrendData[];
  statusDistribution: StatusDistribution[];
  topMatches: JobMatch[];
  activityData: ActivityData[];
}

interface UseAnalyticsOptions {
  dateRange?: 'week' | 'month' | 'quarter' | 'year';
  refreshInterval?: number;
}

const DEFAULT_STATS: AnalyticsStats = {
  totalApplications: 0,
  responseRate: 0,
  interviewRate: 0,
  offerCount: 0,
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  reviewed: '#3b82f6',
  interview: '#10b981',
  offer: '#8b5cf6',
  rejected: '#ef4444',
};

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { dateRange = 'month', refreshInterval } = options;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/analytics?range=${dateRange}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const analyticsData = await response.json();

      const formattedData: AnalyticsData = {
        stats: {
          totalApplications: analyticsData.totalApplications || 0,
          responseRate: analyticsData.responseRate || 0,
          interviewRate: analyticsData.interviewRate || 0,
          offerCount: analyticsData.offerCount || 0,
          applicationsTrend: analyticsData.applicationsTrend,
          responseTrend: analyticsData.responseTrend,
          interviewTrend: analyticsData.interviewTrend,
          offerTrend: analyticsData.offerTrend,
        },
        trendData: analyticsData.trendData || [],
        statusDistribution: (analyticsData.statusDistribution || []).map((item: { name: string; value: number }) => ({
          ...item,
          color: STATUS_COLORS[item.name.toLowerCase() as keyof typeof STATUS_COLORS] || '#6b7280',
        })),
        topMatches: analyticsData.topMatches || [],
        activityData: analyticsData.activityData || [],
      };

      setData(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setData({
        stats: DEFAULT_STATS,
        trendData: [],
        statusDistribution: [],
        topMatches: [],
        activityData: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!refreshInterval) return;

    const intervalId = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchAnalytics]);

  const refetch = useCallback(() => {
    return fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    stats: data?.stats || DEFAULT_STATS,
    trendData: data?.trendData || [],
    statusDistribution: data?.statusDistribution || [],
    topMatches: data?.topMatches || [],
    activityData: data?.activityData || [],
    isLoading,
    error,
    refetch,
  };
}

export function useMockAnalytics(): AnalyticsData & { isLoading: boolean } {
  const mockStats: AnalyticsStats = {
    totalApplications: 156,
    responseRate: 42,
    interviewRate: 18,
    offerCount: 5,
    applicationsTrend: 12,
    responseTrend: 5,
    interviewTrend: -2,
    offerTrend: 25,
  };

  const mockTrendData: ApplicationTrendData[] = [
    { date: 'Week 1', applications: 25, interviews: 4, offers: 1 },
    { date: 'Week 2', applications: 32, interviews: 6, offers: 0 },
    { date: 'Week 3', applications: 28, interviews: 5, offers: 2 },
    { date: 'Week 4', applications: 41, interviews: 8, offers: 1 },
    { date: 'Week 5', applications: 30, interviews: 5, offers: 1 },
  ];

  const mockStatusDistribution: StatusDistribution[] = [
    { name: 'Pending', value: 45, color: STATUS_COLORS.pending },
    { name: 'Reviewed', value: 38, color: STATUS_COLORS.reviewed },
    { name: 'Interview', value: 28, color: STATUS_COLORS.interview },
    { name: 'Offer', value: 5, color: STATUS_COLORS.offer },
    { name: 'Rejected', value: 40, color: STATUS_COLORS.rejected },
  ];

  const mockTopMatches: JobMatch[] = [
    { id: '1', company: 'TechCorp', position: 'Senior Developer', matchScore: 95, status: 'interview', dateApplied: '2024-01-15' },
    { id: '2', company: 'StartupXYZ', position: 'Full Stack Engineer', matchScore: 88, status: 'applied', dateApplied: '2024-01-14' },
    { id: '3', company: 'BigTech Inc', position: 'Software Engineer', matchScore: 85, status: 'pending', dateApplied: '2024-01-13' },
    { id: '4', company: 'InnovateLab', position: 'Frontend Developer', matchScore: 82, status: 'offer', dateApplied: '2024-01-10' },
    { id: '5', company: 'DataFlow', position: 'Backend Engineer', matchScore: 79, status: 'rejected', dateApplied: '2024-01-08' },
  ];

  const mockActivityData: ActivityData[] = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  days.forEach((day) => {
    for (let hour = 0; hour < 24; hour++) {
      const isWorkHour = hour >= 9 && hour <= 17;
      const isWeekend = day === 'Sat' || day === 'Sun';
      const baseValue = isWeekend ? 1 : isWorkHour ? 5 : 2;
      mockActivityData.push({
        day,
        hour,
        value: Math.floor(Math.random() * baseValue),
      });
    }
  });

  return {
    stats: mockStats,
    trendData: mockTrendData,
    statusDistribution: mockStatusDistribution,
    topMatches: mockTopMatches,
    activityData: mockActivityData,
    isLoading: false,
  };
}

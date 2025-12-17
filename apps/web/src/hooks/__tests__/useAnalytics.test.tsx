import { renderHook, waitFor, act } from '@testing-library/react';
import { useAnalytics, useMockAnalytics } from '../useAnalytics';

// Mock fetch
global.fetch = jest.fn();

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useAnalytics', () => {
    it('should fetch analytics data successfully', async () => {
      const mockData = {
        totalApplications: 156,
        responseRate: 42,
        interviewRate: 18,
        offerCount: 5,
        applicationsTrend: 12,
        responseTrend: 5,
        interviewTrend: -2,
        offerTrend: 25,
        trendData: [
          { date: 'Week 1', applications: 25, interviews: 4, offers: 1 },
          { date: 'Week 2', applications: 32, interviews: 6, offers: 0 },
        ],
        statusDistribution: [
          { name: 'Pending', value: 45 },
          { name: 'Reviewed', value: 38 },
        ],
        topMatches: [
          {
            id: '1',
            company: 'TechCorp',
            position: 'Senior Developer',
            matchScore: 95,
            status: 'interview',
            dateApplied: '2024-01-15',
          },
        ],
        activityData: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useAnalytics());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toBeDefined();
      expect(result.current.stats.totalApplications).toBe(156);
      expect(result.current.stats.responseRate).toBe(42);
      expect(result.current.trendData).toHaveLength(2);
      expect(result.current.statusDistribution).toHaveLength(2);
      expect(result.current.topMatches).toHaveLength(1);
    });

    it('should fetch analytics with date range parameter', async () => {
      const mockData = {
        totalApplications: 50,
        responseRate: 40,
        interviewRate: 15,
        offerCount: 2,
        trendData: [],
        statusDistribution: [],
        topMatches: [],
        activityData: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() =>
        useAnalytics({ dateRange: 'week' })
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/analytics?range=week',
        expect.any(Object)
      );
    });

    it('should handle fetch error gracefully', async () => {
      const error = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.stats.totalApplications).toBe(0);
    });

    it('should handle HTTP error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain('Failed to fetch analytics');
    });

    it('should add color to status distribution', async () => {
      const mockData = {
        totalApplications: 100,
        responseRate: 50,
        interviewRate: 20,
        offerCount: 5,
        trendData: [],
        statusDistribution: [
          { name: 'Pending', value: 30 },
          { name: 'Reviewed', value: 25 },
          { name: 'Interview', value: 20 },
          { name: 'Offer', value: 5 },
          { name: 'Rejected', value: 20 },
        ],
        topMatches: [],
        activityData: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.statusDistribution[0].color).toBeDefined();
      expect(result.current.statusDistribution[1].color).toBeDefined();
      expect(result.current.statusDistribution[2].color).toBeDefined();
    });

    it('should refetch analytics data when calling refetch', async () => {
      const mockData = {
        totalApplications: 100,
        responseRate: 40,
        interviewRate: 18,
        offerCount: 5,
        trendData: [],
        statusDistribution: [],
        topMatches: [],
        activityData: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should refresh data at interval when refreshInterval is set', async () => {
      jest.useFakeTimers();

      const mockData = {
        totalApplications: 100,
        responseRate: 40,
        interviewRate: 18,
        offerCount: 5,
        trendData: [],
        statusDistribution: [],
        topMatches: [],
        activityData: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result, unmount } = renderHook(() =>
        useAnalytics({ refreshInterval: 5000 })
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

      unmount();
      jest.useRealTimers();
    });

    it('should update when dateRange changes', async () => {
      const mockData = {
        totalApplications: 100,
        responseRate: 40,
        interviewRate: 18,
        offerCount: 5,
        trendData: [],
        statusDistribution: [],
        topMatches: [],
        activityData: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const { result, rerender } = renderHook(
        ({ dateRange }) => useAnalytics({ dateRange }),
        { initialProps: { dateRange: 'week' as const } }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/analytics?range=week',
        expect.any(Object)
      );

      // Change date range
      rerender({ dateRange: 'month' as const });

      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/analytics?range=month',
          expect.any(Object)
        )
      );
    });
  });

  describe('useMockAnalytics', () => {
    it('should return mock analytics data', () => {
      const { result } = renderHook(() => useMockAnalytics());

      expect(result.current.stats.totalApplications).toBe(156);
      expect(result.current.stats.responseRate).toBe(42);
      expect(result.current.stats.interviewRate).toBe(18);
      expect(result.current.stats.offerCount).toBe(5);
      expect(result.current.trendData).toHaveLength(5);
      expect(result.current.statusDistribution).toHaveLength(5);
      expect(result.current.topMatches).toHaveLength(5);
      expect(result.current.activityData.length).toBeGreaterThan(0);
      expect(result.current.isLoading).toBe(false);
    });

    it('should have valid activity data structure', () => {
      const { result } = renderHook(() => useMockAnalytics());

      const activityData = result.current.activityData;
      expect(activityData.length).toBe(7 * 24); // 7 days * 24 hours

      const firstActivity = activityData[0];
      expect(firstActivity).toHaveProperty('day');
      expect(firstActivity).toHaveProperty('hour');
      expect(firstActivity).toHaveProperty('value');
      expect(typeof firstActivity.value).toBe('number');
    });

    it('should have colored status distribution', () => {
      const { result } = renderHook(() => useMockAnalytics());

      result.current.statusDistribution.forEach((status) => {
        expect(status).toHaveProperty('name');
        expect(status).toHaveProperty('value');
        expect(status).toHaveProperty('color');
        expect(status.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should have valid trend data', () => {
      const { result } = renderHook(() => useMockAnalytics());

      expect(result.current.stats.applicationsTrend).toBeDefined();
      expect(result.current.stats.responseTrend).toBeDefined();
      expect(result.current.stats.interviewTrend).toBeDefined();
      expect(result.current.stats.offerTrend).toBeDefined();
    });
  });
});

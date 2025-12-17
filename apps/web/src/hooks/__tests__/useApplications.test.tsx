import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useApplications,
  useApplication,
  useCreateApplication,
  useUpdateApplication,
  useUpdateApplicationStatus,
  useDeleteApplication,
  useWithdrawApplication,
  useApplicationAnalytics,
  useAutoApplySettings,
  useUpdateAutoApplySettings,
  useStartAutoApply,
  useStopAutoApply,
  useAutoApplyStatus,
  useExportApplications,
} from '../useApplications';
import { applicationsApi } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  applicationsApi: {
    getApplications: jest.fn(),
    getApplication: jest.fn(),
    createApplication: jest.fn(),
    updateApplication: jest.fn(),
    updateApplicationStatus: jest.fn(),
    deleteApplication: jest.fn(),
    withdrawApplication: jest.fn(),
    getAnalytics: jest.fn(),
    getAutoApplySettings: jest.fn(),
    updateAutoApplySettings: jest.fn(),
    startAutoApply: jest.fn(),
    stopAutoApply: jest.fn(),
    getAutoApplyStatus: jest.fn(),
    exportApplications: jest.fn(),
  },
}));

// Mock useToast
jest.mock('../useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useApplications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useApplications', () => {
    it('should fetch applications successfully', async () => {
      const mockData = {
        data: [
          { id: '1', jobId: '1', status: 'applied', appliedAt: '2024-01-01' },
        ],
        meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      };

      (applicationsApi.getApplications as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useApplications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(applicationsApi.getApplications).toHaveBeenCalledTimes(1);
    });

    it('should fetch applications with filters', async () => {
      const filters = { status: 'applied', page: 1, limit: 10 };
      const mockData = {
        data: [],
        meta: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
      };

      (applicationsApi.getApplications as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useApplications(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(applicationsApi.getApplications).toHaveBeenCalledWith(filters);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch');
      (applicationsApi.getApplications as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useApplications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useApplication', () => {
    it('should fetch single application successfully', async () => {
      const mockData = { id: '1', jobId: '1', status: 'applied' };
      (applicationsApi.getApplication as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useApplication('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(applicationsApi.getApplication).toHaveBeenCalledWith('1');
    });

    it('should not fetch when disabled', async () => {
      const { result } = renderHook(() => useApplication('1', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(applicationsApi.getApplication).not.toHaveBeenCalled();
    });

    it('should not fetch when id is empty', async () => {
      const { result } = renderHook(() => useApplication(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(applicationsApi.getApplication).not.toHaveBeenCalled();
    });
  });

  describe('useCreateApplication', () => {
    it('should create application successfully', async () => {
      const newApplication = { id: '2', jobId: '2', status: 'pending' };
      (applicationsApi.createApplication as jest.Mock).mockResolvedValue(
        newApplication
      );

      const { result } = renderHook(() => useCreateApplication(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ jobId: '2', resumeId: '1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(newApplication);
      expect(applicationsApi.createApplication).toHaveBeenCalledWith({
        jobId: '2',
        resumeId: '1',
      });
    });

    it('should handle creation error', async () => {
      const error = new Error('Creation failed');
      (applicationsApi.createApplication as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateApplication(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ jobId: '2' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateApplication', () => {
    it('should update application successfully', async () => {
      const updated = { id: '1', jobId: '1', status: 'interview' };
      (applicationsApi.updateApplication as jest.Mock).mockResolvedValue(updated);

      const { result } = renderHook(() => useUpdateApplication(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '1', data: { status: 'interview' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(applicationsApi.updateApplication).toHaveBeenCalledWith('1', {
        status: 'interview',
      });
    });
  });

  describe('useUpdateApplicationStatus', () => {
    it('should update application status successfully', async () => {
      const updated = { id: '1', status: 'rejected', note: 'Not a fit' };
      (applicationsApi.updateApplicationStatus as jest.Mock).mockResolvedValue(
        updated
      );

      const { result } = renderHook(() => useUpdateApplicationStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '1', status: 'rejected', note: 'Not a fit' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(applicationsApi.updateApplicationStatus).toHaveBeenCalledWith(
        '1',
        'rejected',
        'Not a fit'
      );
    });
  });

  describe('useDeleteApplication', () => {
    it('should delete application successfully', async () => {
      (applicationsApi.deleteApplication as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useDeleteApplication(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(applicationsApi.deleteApplication).toHaveBeenCalledWith('1');
    });
  });

  describe('useWithdrawApplication', () => {
    it('should withdraw application successfully', async () => {
      const withdrawn = { id: '1', status: 'withdrawn' };
      (applicationsApi.withdrawApplication as jest.Mock).mockResolvedValue(
        withdrawn
      );

      const { result } = renderHook(() => useWithdrawApplication(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '1', reason: 'Found another job' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(applicationsApi.withdrawApplication).toHaveBeenCalledWith(
        '1',
        'Found another job'
      );
    });
  });

  describe('useApplicationAnalytics', () => {
    it('should fetch analytics successfully', async () => {
      const mockAnalytics = {
        totalApplications: 10,
        responseRate: 40,
        interviewRate: 20,
        offerCount: 2,
      };

      (applicationsApi.getAnalytics as jest.Mock).mockResolvedValue(
        mockAnalytics
      );

      const { result } = renderHook(() => useApplicationAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockAnalytics);
    });

    it('should fetch analytics with date range', async () => {
      const params = { dateFrom: '2024-01-01', dateTo: '2024-12-31' };
      const mockAnalytics = { totalApplications: 5 };

      (applicationsApi.getAnalytics as jest.Mock).mockResolvedValue(
        mockAnalytics
      );

      const { result } = renderHook(() => useApplicationAnalytics(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(applicationsApi.getAnalytics).toHaveBeenCalledWith(params);
    });
  });

  describe('useAutoApplySettings', () => {
    it('should fetch auto-apply settings successfully', async () => {
      const mockSettings = {
        enabled: true,
        maxApplicationsPerDay: 5,
        keywords: ['developer', 'engineer'],
      };

      (applicationsApi.getAutoApplySettings as jest.Mock).mockResolvedValue(
        mockSettings
      );

      const { result } = renderHook(() => useAutoApplySettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSettings);
    });
  });

  describe('useUpdateAutoApplySettings', () => {
    it('should update auto-apply settings successfully', async () => {
      const settings = { enabled: true, maxApplicationsPerDay: 10 };
      (applicationsApi.updateAutoApplySettings as jest.Mock).mockResolvedValue(
        settings
      );

      const { result } = renderHook(() => useUpdateAutoApplySettings(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(settings);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(applicationsApi.updateAutoApplySettings).toHaveBeenCalledWith(
        settings
      );
    });
  });

  describe('useStartAutoApply', () => {
    it('should start auto-apply successfully', async () => {
      const status = { running: true, applicationsToday: 0 };
      (applicationsApi.startAutoApply as jest.Mock).mockResolvedValue(status);

      const { result } = renderHook(() => useStartAutoApply(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(applicationsApi.startAutoApply).toHaveBeenCalled();
    });
  });

  describe('useStopAutoApply', () => {
    it('should stop auto-apply successfully', async () => {
      const status = { running: false, applicationsToday: 5 };
      (applicationsApi.stopAutoApply as jest.Mock).mockResolvedValue(status);

      const { result } = renderHook(() => useStopAutoApply(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(applicationsApi.stopAutoApply).toHaveBeenCalled();
    });
  });

  describe('useAutoApplyStatus', () => {
    it('should fetch auto-apply status successfully', async () => {
      const status = { running: true, applicationsToday: 3 };
      (applicationsApi.getAutoApplyStatus as jest.Mock).mockResolvedValue(
        status
      );

      const { result } = renderHook(() => useAutoApplyStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(status);
    });
  });

  describe('useExportApplications', () => {
    it('should export applications successfully', async () => {
      const mockBlob = new Blob(['data'], { type: 'text/csv' });
      (applicationsApi.exportApplications as jest.Mock).mockResolvedValue(
        mockBlob
      );

      // Mock URL and DOM methods
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
      global.URL.revokeObjectURL = jest.fn();
      document.createElement = jest.fn((tag) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: jest.fn(),
          } as any;
        }
        return {} as any;
      });
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      const { result } = renderHook(() => useExportApplications(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ format: 'csv' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(applicationsApi.exportApplications).toHaveBeenCalledWith('csv', undefined);
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useJobs,
  useJob,
  useRecommendedJobs,
  useSavedJobs,
  useSaveJob,
  useUnsaveJob,
  useUpdateSavedJob,
  useMatchScore,
  useSimilarJobs,
  useInterviewQuestions,
  useSalaryPrediction,
  useReportJob,
} from '../useJobs';
import { jobsApi } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  jobsApi: {
    searchJobs: jest.fn(),
    getJob: jest.fn(),
    getRecommendedJobs: jest.fn(),
    getSavedJobs: jest.fn(),
    saveJob: jest.fn(),
    unsaveJob: jest.fn(),
    updateSavedJob: jest.fn(),
    getMatchScore: jest.fn(),
    getSimilarJobs: jest.fn(),
    getInterviewQuestions: jest.fn(),
    getSalaryPrediction: jest.fn(),
    reportJob: jest.fn(),
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

describe('useJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useJobs', () => {
    it('should fetch jobs successfully', async () => {
      const mockData = {
        data: [
          {
            id: '1',
            title: 'Senior Developer',
            company: 'TechCorp',
            location: 'Remote',
          },
        ],
        meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      };

      (jobsApi.searchJobs as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(jobsApi.searchJobs).toHaveBeenCalledWith({});
    });

    it('should fetch jobs with filters', async () => {
      const filters = { query: 'developer', location: 'Remote', page: 1 };
      const mockData = {
        data: [],
        meta: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
      };

      (jobsApi.searchJobs as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useJobs(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(jobsApi.searchJobs).toHaveBeenCalledWith(filters);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch jobs');
      (jobsApi.searchJobs as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useJob', () => {
    it('should fetch single job successfully', async () => {
      const mockJob = {
        id: '1',
        title: 'Senior Developer',
        company: 'TechCorp',
        description: 'Job description',
      };

      (jobsApi.getJob as jest.Mock).mockResolvedValue(mockJob);

      const { result } = renderHook(() => useJob('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockJob);
      expect(jobsApi.getJob).toHaveBeenCalledWith('1');
    });

    it('should not fetch when disabled', async () => {
      const { result } = renderHook(() => useJob('1', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(jobsApi.getJob).not.toHaveBeenCalled();
    });

    it('should not fetch when id is empty', async () => {
      const { result } = renderHook(() => useJob(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(jobsApi.getJob).not.toHaveBeenCalled();
    });
  });

  describe('useRecommendedJobs', () => {
    it('should fetch recommended jobs successfully', async () => {
      const mockJobs = {
        data: [{ id: '1', title: 'Recommended Job', matchScore: 95 }],
      };

      (jobsApi.getRecommendedJobs as jest.Mock).mockResolvedValue(mockJobs);

      const { result } = renderHook(() => useRecommendedJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockJobs);
    });

    it('should fetch recommended jobs with params', async () => {
      const params = { limit: 5, resumeId: 'resume-1' };
      const mockJobs = { data: [] };

      (jobsApi.getRecommendedJobs as jest.Mock).mockResolvedValue(mockJobs);

      const { result } = renderHook(() => useRecommendedJobs(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(jobsApi.getRecommendedJobs).toHaveBeenCalledWith(params);
    });
  });

  describe('useSavedJobs', () => {
    it('should fetch saved jobs successfully', async () => {
      const mockSavedJobs = {
        data: [{ id: '1', jobId: '1', savedAt: '2024-01-01' }],
      };

      (jobsApi.getSavedJobs as jest.Mock).mockResolvedValue(mockSavedJobs);

      const { result } = renderHook(() => useSavedJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSavedJobs);
    });
  });

  describe('useSaveJob', () => {
    it('should save job successfully', async () => {
      const savedJob = { id: '1', jobId: '1', savedAt: '2024-01-01' };
      (jobsApi.saveJob as jest.Mock).mockResolvedValue(savedJob);

      const { result } = renderHook(() => useSaveJob(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ jobId: '1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(jobsApi.saveJob).toHaveBeenCalledWith('1', undefined);
    });

    it('should save job with notes and tags', async () => {
      const savedJob = { id: '1', jobId: '1', notes: 'Interesting' };
      (jobsApi.saveJob as jest.Mock).mockResolvedValue(savedJob);

      const { result } = renderHook(() => useSaveJob(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        jobId: '1',
        data: { notes: 'Interesting', tags: ['priority'] },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(jobsApi.saveJob).toHaveBeenCalledWith('1', {
        notes: 'Interesting',
        tags: ['priority'],
      });
    });

    it('should handle save error', async () => {
      const error = new Error('Failed to save');
      (jobsApi.saveJob as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useSaveJob(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ jobId: '1' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUnsaveJob', () => {
    it('should unsave job successfully', async () => {
      (jobsApi.unsaveJob as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useUnsaveJob(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(jobsApi.unsaveJob).toHaveBeenCalledWith('1');
    });
  });

  describe('useUpdateSavedJob', () => {
    it('should update saved job successfully', async () => {
      const updated = { id: '1', notes: 'Updated notes' };
      (jobsApi.updateSavedJob as jest.Mock).mockResolvedValue(updated);

      const { result } = renderHook(() => useUpdateSavedJob(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ jobId: '1', data: { notes: 'Updated notes' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(jobsApi.updateSavedJob).toHaveBeenCalledWith('1', {
        notes: 'Updated notes',
      });
    });
  });

  describe('useMatchScore', () => {
    it('should fetch match score successfully when enabled', async () => {
      const mockScore = {
        score: 85,
        matchedSkills: ['React', 'TypeScript'],
        missingSkills: ['Python'],
      };

      (jobsApi.getMatchScore as jest.Mock).mockResolvedValue(mockScore);

      const { result } = renderHook(
        () => useMatchScore('job-1', 'resume-1', true),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockScore);
      expect(jobsApi.getMatchScore).toHaveBeenCalledWith('job-1', 'resume-1');
    });

    it('should not fetch when disabled', async () => {
      const { result } = renderHook(
        () => useMatchScore('job-1', 'resume-1', false),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(jobsApi.getMatchScore).not.toHaveBeenCalled();
    });
  });

  describe('useSimilarJobs', () => {
    it('should fetch similar jobs successfully', async () => {
      const mockJobs = [
        { id: '2', title: 'Similar Job 1' },
        { id: '3', title: 'Similar Job 2' },
      ];

      (jobsApi.getSimilarJobs as jest.Mock).mockResolvedValue(mockJobs);

      const { result } = renderHook(() => useSimilarJobs('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockJobs);
      expect(jobsApi.getSimilarJobs).toHaveBeenCalledWith('1', undefined);
    });

    it('should fetch similar jobs with limit', async () => {
      const mockJobs = [{ id: '2', title: 'Similar Job' }];
      (jobsApi.getSimilarJobs as jest.Mock).mockResolvedValue(mockJobs);

      const { result } = renderHook(() => useSimilarJobs('1', 5), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(jobsApi.getSimilarJobs).toHaveBeenCalledWith('1', 5);
    });
  });

  describe('useInterviewQuestions', () => {
    it('should fetch interview questions when enabled', async () => {
      const mockQuestions = {
        questions: [
          { question: 'Tell me about yourself', category: 'general' },
          { question: 'What is React?', category: 'technical' },
        ],
      };

      (jobsApi.getInterviewQuestions as jest.Mock).mockResolvedValue(
        mockQuestions
      );

      const { result } = renderHook(() => useInterviewQuestions('1', true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockQuestions);
      expect(jobsApi.getInterviewQuestions).toHaveBeenCalledWith('1');
    });

    it('should not fetch when disabled', async () => {
      const { result } = renderHook(() => useInterviewQuestions('1', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(jobsApi.getInterviewQuestions).not.toHaveBeenCalled();
    });
  });

  describe('useSalaryPrediction', () => {
    it('should predict salary successfully', async () => {
      const mockPrediction = {
        min: 100000,
        max: 150000,
        median: 125000,
        confidence: 0.85,
      };

      (jobsApi.getSalaryPrediction as jest.Mock).mockResolvedValue(
        mockPrediction
      );

      const { result } = renderHook(() => useSalaryPrediction(), {
        wrapper: createWrapper(),
      });

      const data = {
        jobTitle: 'Senior Developer',
        location: 'San Francisco',
        experienceYears: 5,
        skills: ['React', 'Node.js'],
        education: 'Bachelor',
      };

      result.current.mutate(data);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPrediction);
      expect(jobsApi.getSalaryPrediction).toHaveBeenCalledWith(data);
    });

    it('should handle prediction error', async () => {
      const error = new Error('Prediction failed');
      (jobsApi.getSalaryPrediction as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useSalaryPrediction(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        jobTitle: 'Developer',
        location: 'Remote',
        experienceYears: 3,
        skills: ['JavaScript'],
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useReportJob', () => {
    it('should report job successfully', async () => {
      (jobsApi.reportJob as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useReportJob(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        jobId: '1',
        reason: 'spam',
        details: 'This is a duplicate posting',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(jobsApi.reportJob).toHaveBeenCalledWith(
        '1',
        'spam',
        'This is a duplicate posting'
      );
    });

    it('should handle report error', async () => {
      const error = new Error('Failed to report');
      (jobsApi.reportJob as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useReportJob(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ jobId: '1', reason: 'spam' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });
});

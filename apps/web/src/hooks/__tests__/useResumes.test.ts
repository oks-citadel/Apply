import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tantml:react-query';
import { ReactNode } from 'react';
import {
  useResumes,
  useResume,
  useCreateResume,
  useUpdateResume,
  useDeleteResume,
  useDuplicateResume,
  useSetDefaultResume,
  useExportResume,
  useImportResume,
  useATSScore,
} from '../useResumes';
import { resumesApi } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  resumesApi: {
    getResumes: jest.fn(),
    getResume: jest.fn(),
    createResume: jest.fn(),
    updateResume: jest.fn(),
    deleteResume: jest.fn(),
    duplicateResume: jest.fn(),
    setDefaultResume: jest.fn(),
    exportResume: jest.fn(),
    importResume: jest.fn(),
    getATSScore: jest.fn(),
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

describe('useResumes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useResumes', () => {
    it('should fetch resumes successfully', async () => {
      const mockData = {
        data: [
          {
            id: '1',
            title: 'Software Engineer Resume',
            fileName: 'resume.pdf',
            atsScore: 85,
          },
        ],
        meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      };

      (resumesApi.getResumes as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useResumes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(resumesApi.getResumes).toHaveBeenCalledTimes(1);
    });

    it('should fetch resumes with params', async () => {
      const params = { page: 2, limit: 20, search: 'engineer' };
      const mockData = { data: [], meta: {} };

      (resumesApi.getResumes as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useResumes(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(resumesApi.getResumes).toHaveBeenCalledWith(params);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch resumes');
      (resumesApi.getResumes as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useResumes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useResume', () => {
    it('should fetch single resume successfully', async () => {
      const mockResume = {
        id: '1',
        title: 'My Resume',
        content: { summary: 'Experienced developer' },
      };

      (resumesApi.getResume as jest.Mock).mockResolvedValue(mockResume);

      const { result } = renderHook(() => useResume('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResume);
      expect(resumesApi.getResume).toHaveBeenCalledWith('1');
    });

    it('should not fetch when disabled', async () => {
      const { result } = renderHook(() => useResume('1', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(resumesApi.getResume).not.toHaveBeenCalled();
    });

    it('should not fetch when id is empty', async () => {
      const { result } = renderHook(() => useResume(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(resumesApi.getResume).not.toHaveBeenCalled();
    });
  });

  describe('useCreateResume', () => {
    it('should create resume successfully', async () => {
      const newResume = {
        id: '2',
        title: 'New Resume',
        fileName: 'new.pdf',
      };

      (resumesApi.createResume as jest.Mock).mockResolvedValue(newResume);

      const { result } = renderHook(() => useCreateResume(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ title: 'New Resume' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(newResume);
      expect(resumesApi.createResume).toHaveBeenCalledWith({ title: 'New Resume' });
    });

    it('should handle creation error', async () => {
      const error = new Error('Creation failed');
      (resumesApi.createResume as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateResume(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ title: 'New Resume' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateResume', () => {
    it('should update resume successfully', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const existingResume = {
        id: '1',
        title: 'Old Title',
        content: {},
        updatedAt: '2024-01-01',
      };

      const updatedResume = {
        id: '1',
        title: 'Updated Title',
        content: {},
        updatedAt: '2024-01-02',
      };

      // Set initial data
      queryClient.setQueryData(['resumes', 'detail', '1'], existingResume);

      (resumesApi.updateResume as jest.Mock).mockResolvedValue(updatedResume);

      const { result } = renderHook(() => useUpdateResume(), { wrapper });

      result.current.mutate({ id: '1', data: { title: 'Updated Title' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(resumesApi.updateResume).toHaveBeenCalledWith('1', {
        title: 'Updated Title',
      });
    });

    it('should handle optimistic update rollback on error', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const existingResume = {
        id: '1',
        title: 'Old Title',
        updatedAt: '2024-01-01',
      };

      // Set initial data
      queryClient.setQueryData(['resumes', 'detail', '1'], existingResume);

      const error = new Error('Update failed');
      (resumesApi.updateResume as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateResume(), { wrapper });

      result.current.mutate({ id: '1', data: { title: 'New Title' } });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Check that data was rolled back
      const currentData = queryClient.getQueryData(['resumes', 'detail', '1']);
      expect(currentData).toEqual(existingResume);
    });
  });

  describe('useDeleteResume', () => {
    it('should delete resume successfully', async () => {
      (resumesApi.deleteResume as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDeleteResume(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(resumesApi.deleteResume).toHaveBeenCalledWith('1');
    });
  });

  describe('useDuplicateResume', () => {
    it('should duplicate resume successfully', async () => {
      const duplicatedResume = {
        id: '2',
        title: 'Copy of Resume',
        fileName: 'resume-copy.pdf',
      };

      (resumesApi.duplicateResume as jest.Mock).mockResolvedValue(
        duplicatedResume
      );

      const { result } = renderHook(() => useDuplicateResume(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(duplicatedResume);
      expect(resumesApi.duplicateResume).toHaveBeenCalledWith('1');
    });
  });

  describe('useSetDefaultResume', () => {
    it('should set default resume successfully', async () => {
      (resumesApi.setDefaultResume as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useSetDefaultResume(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(resumesApi.setDefaultResume).toHaveBeenCalledWith('1');
    });
  });

  describe('useExportResume', () => {
    it('should export resume successfully', async () => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });
      (resumesApi.exportResume as jest.Mock).mockResolvedValue(mockBlob);

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

      const { result } = renderHook(() => useExportResume(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '1', format: 'pdf' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(resumesApi.exportResume).toHaveBeenCalledWith('1', 'pdf');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });

  describe('useImportResume', () => {
    it('should import resume successfully', async () => {
      const importedResume = {
        id: '3',
        title: 'Imported Resume',
        fileName: 'imported.pdf',
      };

      (resumesApi.importResume as jest.Mock).mockResolvedValue(importedResume);

      const { result } = renderHook(() => useImportResume(), {
        wrapper: createWrapper(),
      });

      const file = new File(['content'], 'resume.pdf', {
        type: 'application/pdf',
      });

      result.current.mutate({ file });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(importedResume);
      expect(resumesApi.importResume).toHaveBeenCalledWith(file, undefined);
    });

    it('should import resume with parse format', async () => {
      const importedResume = { id: '3', title: 'Imported' };
      (resumesApi.importResume as jest.Mock).mockResolvedValue(importedResume);

      const { result } = renderHook(() => useImportResume(), {
        wrapper: createWrapper(),
      });

      const file = new File(['content'], 'resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      result.current.mutate({ file, parseFormat: 'docx' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(resumesApi.importResume).toHaveBeenCalledWith(file, 'docx');
    });
  });

  describe('useATSScore', () => {
    it('should fetch ATS score when enabled', async () => {
      const mockScore = {
        score: 82,
        suggestions: ['Add more keywords', 'Improve formatting'],
        matchedKeywords: ['React', 'TypeScript', 'Node.js'],
        missingKeywords: ['AWS', 'Docker'],
      };

      (resumesApi.getATSScore as jest.Mock).mockResolvedValue(mockScore);

      const { result } = renderHook(
        () => useATSScore('resume-1', 'Looking for React developer...', true),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockScore);
      expect(resumesApi.getATSScore).toHaveBeenCalledWith(
        'resume-1',
        'Looking for React developer...'
      );
    });

    it('should not fetch when disabled', async () => {
      const { result } = renderHook(
        () => useATSScore('resume-1', 'Job description', false),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(resumesApi.getATSScore).not.toHaveBeenCalled();
    });

    it('should not fetch when resumeId is empty', async () => {
      const { result } = renderHook(
        () => useATSScore('', 'Job description', true),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(resumesApi.getATSScore).not.toHaveBeenCalled();
    });

    it('should not fetch when jobDescription is empty', async () => {
      const { result } = renderHook(() => useATSScore('resume-1', '', true), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(resumesApi.getATSScore).not.toHaveBeenCalled();
    });
  });
});

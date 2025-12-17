import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useGenerateCoverLetter,
  useOptimizeResume,
  useInterviewPrep,
  useSkillGapAnalysis,
  useSalaryPrediction,
  useATSScore,
} from '../useAI';
import { aiApi } from '@/lib/api/ai';

// Mock the API
jest.mock('@/lib/api/ai', () => ({
  aiApi: {
    generateCoverLetter: jest.fn(),
    optimizeResume: jest.fn(),
    getInterviewQuestions: jest.fn(),
    analyzeSkillGaps: jest.fn(),
    getSalaryPrediction: jest.fn(),
    getATSScore: jest.fn(),
  },
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

describe('useAI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useGenerateCoverLetter', () => {
    it('should generate cover letter successfully', async () => {
      const mockResponse = {
        coverLetter: 'Dear Hiring Manager,\n\nI am writing to express...',
        suggestions: ['Personalize the opening', 'Add specific achievements'],
      };

      (aiApi.generateCoverLetter as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGenerateCoverLetter(), {
        wrapper: createWrapper(),
      });

      const requestData = {
        jobId: 'job-1',
        resumeId: 'resume-1',
        tone: 'professional' as const,
      };

      result.current.mutate(requestData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(aiApi.generateCoverLetter).toHaveBeenCalledWith(requestData);
    });

    it('should handle generation error', async () => {
      const error = new Error('AI service unavailable');
      (aiApi.generateCoverLetter as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useGenerateCoverLetter(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        jobId: 'job-1',
        resumeId: 'resume-1',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useOptimizeResume', () => {
    it('should optimize resume successfully', async () => {
      const mockResponse = {
        optimizedContent: {
          summary: 'Highly skilled software engineer...',
          experience: [],
        },
        improvements: [
          'Added action verbs',
          'Quantified achievements',
          'Improved keyword density',
        ],
        atsScore: 92,
      };

      (aiApi.optimizeResume as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useOptimizeResume(), {
        wrapper: createWrapper(),
      });

      const requestData = {
        resumeId: 'resume-1',
        jobDescription: 'Looking for a senior developer...',
      };

      result.current.mutate(requestData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(aiApi.optimizeResume).toHaveBeenCalledWith(requestData);
    });

    it('should handle optimization error', async () => {
      const error = new Error('Optimization failed');
      (aiApi.optimizeResume as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useOptimizeResume(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        resumeId: 'resume-1',
        jobDescription: 'Job description',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useInterviewPrep', () => {
    it('should get interview questions successfully', async () => {
      const mockResponse = {
        questions: [
          {
            question: 'Tell me about a challenging project you worked on.',
            category: 'behavioral',
            tips: 'Use the STAR method',
          },
          {
            question: 'Explain the concept of closures in JavaScript.',
            category: 'technical',
            tips: 'Use examples to illustrate',
          },
        ],
        jobTitle: 'Senior Developer',
        company: 'TechCorp',
      };

      (aiApi.getInterviewQuestions as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useInterviewPrep(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ jobId: 'job-1', resumeId: 'resume-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(aiApi.getInterviewQuestions).toHaveBeenCalledWith(
        'job-1',
        'resume-1'
      );
    });

    it('should work without resumeId', async () => {
      const mockResponse = {
        questions: [{ question: 'General question', category: 'general' }],
      };

      (aiApi.getInterviewQuestions as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useInterviewPrep(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ jobId: 'job-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(aiApi.getInterviewQuestions).toHaveBeenCalledWith('job-1', undefined);
    });

    it('should handle error', async () => {
      const error = new Error('Failed to generate questions');
      (aiApi.getInterviewQuestions as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useInterviewPrep(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ jobId: 'job-1' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useSkillGapAnalysis', () => {
    it('should analyze skill gaps successfully', async () => {
      const mockResponse = {
        currentSkills: ['React', 'TypeScript', 'Node.js'],
        requiredSkills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker'],
        missingSkills: ['AWS', 'Docker'],
        matchPercentage: 60,
        recommendations: [
          {
            skill: 'AWS',
            priority: 'high',
            resources: ['AWS Certified Solutions Architect course'],
          },
          {
            skill: 'Docker',
            priority: 'medium',
            resources: ['Docker tutorial', 'Kubernetes basics'],
          },
        ],
      };

      (aiApi.analyzeSkillGaps as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSkillGapAnalysis(), {
        wrapper: createWrapper(),
      });

      const requestData = {
        resumeId: 'resume-1',
        jobId: 'job-1',
      };

      result.current.mutate(requestData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(aiApi.analyzeSkillGaps).toHaveBeenCalledWith(requestData);
    });

    it('should handle analysis error', async () => {
      const error = new Error('Analysis failed');
      (aiApi.analyzeSkillGaps as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useSkillGapAnalysis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        resumeId: 'resume-1',
        jobId: 'job-1',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useSalaryPrediction', () => {
    it('should predict salary successfully', async () => {
      const mockPrediction = {
        minSalary: 100000,
        maxSalary: 150000,
        medianSalary: 125000,
        confidence: 0.85,
        factors: [
          'Location: High cost of living area',
          'Experience: 5+ years',
          'Skills: In-demand tech stack',
        ],
        marketInsights: 'Salaries for this role have increased 12% year-over-year',
      };

      (aiApi.getSalaryPrediction as jest.Mock).mockResolvedValue(mockPrediction);

      const { result } = renderHook(() => useSalaryPrediction(), {
        wrapper: createWrapper(),
      });

      const requestData = {
        jobTitle: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        experienceYears: 5,
        skills: ['React', 'Node.js', 'AWS'],
        education: 'Bachelor',
        industry: 'Technology',
      };

      result.current.mutate(requestData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPrediction);
      expect(aiApi.getSalaryPrediction).toHaveBeenCalledWith(requestData);
    });

    it('should work with minimal data', async () => {
      const mockPrediction = {
        minSalary: 80000,
        maxSalary: 120000,
        medianSalary: 100000,
      };

      (aiApi.getSalaryPrediction as jest.Mock).mockResolvedValue(mockPrediction);

      const { result } = renderHook(() => useSalaryPrediction(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        jobTitle: 'Developer',
        location: 'Remote',
        experienceYears: 3,
        skills: ['JavaScript'],
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPrediction);
    });

    it('should handle prediction error', async () => {
      const error = new Error('Prediction service unavailable');
      (aiApi.getSalaryPrediction as jest.Mock).mockRejectedValue(error);

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

  describe('useATSScore', () => {
    it('should get ATS score successfully', async () => {
      const mockScore = {
        score: 87,
        breakdown: {
          formatting: 95,
          keywords: 82,
          skills: 88,
          experience: 85,
        },
        suggestions: [
          'Add more relevant keywords from job description',
          'Quantify your achievements',
        ],
        matchedKeywords: ['React', 'TypeScript', 'Agile'],
        missingKeywords: ['AWS', 'Kubernetes'],
      };

      (aiApi.getATSScore as jest.Mock).mockResolvedValue(mockScore);

      const { result } = renderHook(() => useATSScore(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        resumeId: 'resume-1',
        jobDescription: 'Looking for React developer with AWS experience...',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockScore);
      expect(aiApi.getATSScore).toHaveBeenCalledWith(
        'resume-1',
        'Looking for React developer with AWS experience...'
      );
    });

    it('should handle ATS score error', async () => {
      const error = new Error('Failed to calculate ATS score');
      (aiApi.getATSScore as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useATSScore(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        resumeId: 'resume-1',
        jobDescription: 'Job description',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });
});

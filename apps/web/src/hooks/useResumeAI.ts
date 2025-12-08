import { useMutation } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai';
import { useToast } from './useToast';
import type {
  GenerateSummaryRequest,
  GenerateSummaryResponse,
  GenerateBulletsRequest,
  GenerateBulletsResponse,
  OptimizeResumeRequest,
  OptimizeResumeResponse,
  ImproveTextRequest,
  ImproveTextResponse,
} from '@/lib/api/ai';

/**
 * Hook for generating professional summary with AI
 */
export function useGenerateSummary() {
  const { toast } = useToast();

  return useMutation<GenerateSummaryResponse, Error, GenerateSummaryRequest>({
    mutationFn: (data) => aiApi.generateSummary(data),
    onSuccess: () => {
      toast({
        title: 'Summary generated',
        description: 'AI has generated summary suggestions for you.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate summary',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Hook for generating bullet points with AI
 */
export function useGenerateBullets() {
  const { toast } = useToast();

  return useMutation<GenerateBulletsResponse, Error, GenerateBulletsRequest>({
    mutationFn: (data) => aiApi.generateBullets(data),
    onSuccess: () => {
      toast({
        title: 'Bullet points generated',
        description: 'AI has generated bullet point suggestions.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate bullets',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Hook for optimizing resume with AI
 */
export function useOptimizeResumeAI() {
  const { toast } = useToast();

  return useMutation<OptimizeResumeResponse, Error, OptimizeResumeRequest>({
    mutationFn: (data) => aiApi.optimizeResume(data),
    onSuccess: (data) => {
      toast({
        title: 'Resume optimized',
        description: `Applied ${data.suggestions.length} AI optimizations.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Optimization failed',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Hook for improving text with AI
 */
export function useImproveText() {
  const { toast } = useToast();

  return useMutation<ImproveTextResponse, Error, ImproveTextRequest>({
    mutationFn: (data) => aiApi.improveText(data),
    onSuccess: () => {
      toast({
        title: 'Text improved',
        description: 'AI has generated improved text suggestions.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to improve text',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Hook for getting resume score with AI
 */
export function useGetResumeScore() {
  const { toast } = useToast();

  return useMutation<any, Error, { resumeId: string; jobDescription?: string }>({
    mutationFn: ({ resumeId, jobDescription }) =>
      aiApi.getATSScore(resumeId, jobDescription || ''),
    onSuccess: (data) => {
      toast({
        title: 'Score calculated',
        description: `Your resume scored ${data.percentage}%`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Scoring failed',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

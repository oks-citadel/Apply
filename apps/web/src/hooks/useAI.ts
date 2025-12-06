import { useMutation, useQuery } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai';
import type {
  GenerateCoverLetterRequest,
  GenerateCoverLetterResponse,
  OptimizeResumeRequest,
  OptimizeResumeResponse,
  InterviewPrepResponse,
  SkillGapAnalysisRequest,
  SkillGapAnalysisResponse,
} from '@/lib/api/ai';

/**
 * Hook for generating cover letters
 */
export function useGenerateCoverLetter() {
  return useMutation<GenerateCoverLetterResponse, Error, GenerateCoverLetterRequest>({
    mutationFn: (data) => aiApi.generateCoverLetter(data),
  });
}

/**
 * Hook for optimizing resume
 */
export function useOptimizeResume() {
  return useMutation<OptimizeResumeResponse, Error, OptimizeResumeRequest>({
    mutationFn: (data) => aiApi.optimizeResume(data),
  });
}

/**
 * Hook for getting interview questions
 */
export function useInterviewPrep() {
  return useMutation<
    InterviewPrepResponse,
    Error,
    { jobId: string; resumeId?: string }
  >({
    mutationFn: ({ jobId, resumeId }) => aiApi.getInterviewQuestions(jobId, resumeId),
  });
}

/**
 * Hook for analyzing skill gaps
 */
export function useSkillGapAnalysis() {
  return useMutation<SkillGapAnalysisResponse, Error, SkillGapAnalysisRequest>({
    mutationFn: (data) => aiApi.analyzeSkillGaps(data),
  });
}

/**
 * Hook for salary prediction
 */
export function useSalaryPrediction() {
  return useMutation<
    any,
    Error,
    {
      jobTitle: string;
      location: string;
      experienceYears: number;
      skills: string[];
      education?: string;
      industry?: string;
    }
  >({
    mutationFn: (data) => aiApi.getSalaryPrediction(data),
  });
}

/**
 * Hook for getting ATS score
 */
export function useATSScore() {
  return useMutation<
    any,
    Error,
    { resumeId: string; jobDescription: string }
  >({
    mutationFn: ({ resumeId, jobDescription }) =>
      aiApi.getATSScore(resumeId, jobDescription),
  });
}

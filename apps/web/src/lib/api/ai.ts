import { apiClient, handleApiError } from './client';

export interface GenerateSummaryRequest {
  experience: Array<{
    company: string;
    position: string;
    description: string;
    highlights: string[];
  }>;
  skills: string[];
  tone?: 'professional' | 'casual' | 'creative';
}

export interface GenerateSummaryResponse {
  summary: string;
  alternatives: string[];
}

export interface GenerateBulletsRequest {
  position: string;
  company: string;
  description: string;
  achievements?: string;
  count?: number;
}

export interface GenerateBulletsResponse {
  bullets: string[];
}

export interface GenerateCoverLetterRequest {
  resumeId: string;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
  tone?: 'professional' | 'enthusiastic' | 'formal';
  length?: 'short' | 'medium' | 'long';
  customInstructions?: string;
}

export interface GenerateCoverLetterResponse {
  coverLetter: string;
  subject?: string;
}

export interface OptimizeResumeRequest {
  resumeId: string;
  jobDescription: string;
  focusAreas?: ('skills' | 'experience' | 'summary' | 'all')[];
}

export interface OptimizeResumeResponse {
  suggestions: {
    section: string;
    current: string;
    suggested: string;
    reason: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  optimizedContent: {
    summary?: string;
    experience?: Array<{
      id: string;
      highlights: string[];
    }>;
    skills?: string[];
  };
}

export interface ImproveTextRequest {
  text: string;
  context: 'summary' | 'bullet' | 'description' | 'general';
  instructions?: string;
}

export interface ImproveTextResponse {
  improved: string;
  suggestions: string[];
}

export interface InterviewPrepRequest {
  jobId: string;
  resumeId?: string;
}

export interface InterviewPrepResponse {
  questions: {
    category: 'technical' | 'behavioral' | 'situational' | 'company';
    question: string;
    tips: string[];
    sampleAnswer?: string;
  }[];
  companyInsights?: {
    culture: string[];
    values: string[];
    interviewProcess: string[];
  };
}

export interface SkillGapAnalysisRequest {
  resumeId: string;
  targetRole: string;
  targetCompany?: string;
}

export interface SkillGapAnalysisResponse {
  currentSkills: string[];
  requiredSkills: string[];
  missingSkills: {
    skill: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    learningResources: {
      name: string;
      url: string;
      type: 'course' | 'certification' | 'book' | 'tutorial';
    }[];
  }[];
  recommendations: string[];
}

export const aiApi = {
  /**
   * Generate professional summary
   */
  generateSummary: async (data: GenerateSummaryRequest): Promise<GenerateSummaryResponse> => {
    try {
      const response = await apiClient.post<GenerateSummaryResponse>('/ai/generate-summary', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Generate bullet points for experience
   */
  generateBullets: async (data: GenerateBulletsRequest): Promise<GenerateBulletsResponse> => {
    try {
      const response = await apiClient.post<GenerateBulletsResponse>('/ai/generate-bullets', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Generate cover letter
   */
  generateCoverLetter: async (
    data: GenerateCoverLetterRequest
  ): Promise<GenerateCoverLetterResponse> => {
    try {
      const response = await apiClient.post<GenerateCoverLetterResponse>(
        '/ai/generate-cover-letter',
        data
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get ATS score for resume
   */
  getATSScore: async (resumeId: string, jobDescription: string): Promise<any> => {
    try {
      const response = await apiClient.post('/ai/ats-score', {
        resumeId,
        jobDescription,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Optimize resume for job
   */
  optimizeResume: async (data: OptimizeResumeRequest): Promise<OptimizeResumeResponse> => {
    try {
      const response = await apiClient.post<OptimizeResumeResponse>('/ai/optimize-resume', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Improve text with AI
   */
  improveText: async (data: ImproveTextRequest): Promise<ImproveTextResponse> => {
    try {
      const response = await apiClient.post<ImproveTextResponse>('/ai/improve-text', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get interview preparation
   */
  getInterviewQuestions: async (jobId: string, resumeId?: string): Promise<InterviewPrepResponse> => {
    try {
      const response = await apiClient.post<InterviewPrepResponse>('/ai/interview-prep', {
        jobId,
        resumeId,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get salary prediction
   */
  getSalaryPrediction: async (data: {
    jobTitle: string;
    location: string;
    experienceYears: number;
    skills: string[];
    education?: string;
    industry?: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/ai/salary-prediction', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Analyze skill gaps
   */
  analyzeSkillGaps: async (data: SkillGapAnalysisRequest): Promise<SkillGapAnalysisResponse> => {
    try {
      const response = await apiClient.post<SkillGapAnalysisResponse>('/ai/skill-gap-analysis', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get career path suggestions
   */
  getCareerPath: async (resumeId: string): Promise<{
    currentLevel: string;
    nextRoles: {
      title: string;
      yearsToReach: number;
      requiredSkills: string[];
      averageSalary: number;
    }[];
    recommendations: string[];
  }> => {
    try {
      const response = await apiClient.post('/ai/career-path', { resumeId });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

/**
 * Mock AI Service
 * Provides mock responses for AI service endpoints
 */

export interface JobMatchResult {
  jobId: string;
  score: number;
  reasons: string[];
  keywords: string[];
}

export interface ResumeOptimizationResult {
  originalContent: string;
  optimizedContent: string;
  improvements: Array<{
    type: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  score: {
    before: number;
    after: number;
    improvement: number;
  };
}

export class AIServiceMock {
  mockJobMatch(resumeData: any, jobData: any): JobMatchResult {
    // Calculate mock score based on skill overlap
    const resumeSkills = new Set(resumeData.skills?.map((s: string) => s.toLowerCase()) || []);
    const jobSkills = new Set(jobData.skills?.map((s: string) => s.toLowerCase()) || []);

    const matchingSkills = Array.from(resumeSkills).filter(skill => jobSkills.has(skill));
    const score = matchingSkills.length / Math.max(jobSkills.size, 1);

    return {
      jobId: jobData.id || 'job-unknown',
      score: Math.min(score, 1),
      reasons: [
        `${matchingSkills.length} matching skills found`,
        'Experience level aligns with job requirements',
        'Location preference matches',
      ],
      keywords: matchingSkills,
    };
  }

  mockResumeOptimization(resumeContent: string): ResumeOptimizationResult {
    const improvements = [
      {
        type: 'keyword_optimization',
        description: 'Added industry-relevant keywords to improve ATS compatibility',
        impact: 'high' as const,
      },
      {
        type: 'action_verbs',
        description: 'Replaced passive language with strong action verbs',
        impact: 'medium' as const,
      },
      {
        type: 'quantification',
        description: 'Added quantifiable metrics to achievements',
        impact: 'high' as const,
      },
      {
        type: 'formatting',
        description: 'Improved section organization and readability',
        impact: 'medium' as const,
      },
    ];

    return {
      originalContent: resumeContent,
      optimizedContent: this.generateOptimizedContent(resumeContent),
      improvements,
      score: {
        before: 0.65,
        after: 0.85,
        improvement: 0.20,
      },
    };
  }

  mockInterviewPreparation(jobDescription: string, resumeData: any): any {
    return {
      commonQuestions: [
        {
          question: 'Tell me about yourself',
          category: 'introduction',
          difficulty: 'easy',
          suggestedAnswer: 'Focus on your recent experience and key achievements...',
        },
        {
          question: 'What are your greatest strengths?',
          category: 'behavioral',
          difficulty: 'medium',
          suggestedAnswer: 'Highlight skills that align with the job requirements...',
        },
        {
          question: 'Describe a challenging project you worked on',
          category: 'technical',
          difficulty: 'hard',
          suggestedAnswer: 'Use the STAR method to structure your response...',
        },
      ],
      technicalTopics: [
        'Microservices architecture',
        'System design patterns',
        'Database optimization',
        'Cloud infrastructure',
      ],
      preparationTips: [
        'Review the company\'s recent news and products',
        'Prepare specific examples from your experience',
        'Practice explaining technical concepts clearly',
        'Prepare questions to ask the interviewer',
      ],
    };
  }

  mockSalaryPrediction(jobData: any, location: string, experienceYears: number): any {
    // Simple mock calculation based on experience
    const baseRanges: Record<string, { min: number; max: number }> = {
      junior: { min: 60000, max: 85000 },
      mid: { min: 85000, max: 130000 },
      senior: { min: 120000, max: 180000 },
      lead: { min: 150000, max: 220000 },
    };

    const experienceLevel = experienceYears < 2 ? 'junior' :
                           experienceYears < 5 ? 'mid' :
                           experienceYears < 10 ? 'senior' : 'lead';

    const baseRange = baseRanges[experienceLevel];

    return {
      prediction: {
        min: baseRange.min,
        max: baseRange.max,
        median: (baseRange.min + baseRange.max) / 2,
        currency: 'USD',
      },
      factors: [
        { name: 'Experience Level', impact: 'high', value: experienceLevel },
        { name: 'Location', impact: 'medium', value: location },
        { name: 'Skills', impact: 'high', value: jobData.skills?.length || 0 },
        { name: 'Company Size', impact: 'medium', value: 'enterprise' },
      ],
      confidence: 0.82,
      marketComparison: {
        percentile: 65,
        comparison: 'above_average',
      },
    };
  }

  private generateOptimizedContent(original: string): string {
    // Simple mock optimization - in real implementation, this would use AI
    return original
      .replace(/I did/g, 'Successfully executed')
      .replace(/worked on/g, 'led development of')
      .replace(/helped/g, 'drove')
      + '\n\n[AI-Optimized Content]';
  }
}

export const aiServiceMock = new AIServiceMock();

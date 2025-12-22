import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface JobRequirements {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  experienceLevel: string;
  education: string[];
  certifications: string[];
  responsibilities: string[];
  qualifications: string[];
  industryKeywords: string[];
}

export interface ResumeRewriteSuggestion {
  section: string;
  itemId?: string;
  originalText: string;
  rewrittenText: string;
  reason: string;
  improvementType: 'keyword-optimization' | 'clarity' | 'relevance' | 'quantification';
  keywords?: string[];
}

export interface SkillMatchResult {
  matchedSkills: Array<{
    skill: string;
    source: 'resume' | 'inferred';
    confidence: number;
  }>;
  missingSkills: Array<{
    skill: string;
    importance: 'required' | 'preferred' | 'nice-to-have';
  }>;
  transferableSkills: Array<{
    skill: string;
    relatedTo: string[];
    explanation: string;
  }>;
}

@Injectable()
export class AIServiceClient {
  private readonly logger = new Logger(AIServiceClient.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
  }

  /**
   * Parse job description to extract requirements
   */
  async parseJobDescription(jobDescription: string): Promise<JobRequirements> {
    try {
      this.logger.log('Parsing job description with AI service');

      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/api/v1/nlp/parse-job`, {
          job_description: jobDescription,
        }),
      );

      return this.transformJobRequirements(response.data);
    } catch (error) {
      this.logger.error('Failed to parse job description', error);
      // Fallback to basic parsing
      return this.fallbackJobParsing(jobDescription);
    }
  }

  /**
   * Analyze resume content against job requirements
   */
  async analyzeResumeMatch(
    resumeContent: any,
    jobRequirements: JobRequirements,
  ): Promise<{
    overallScore: number;
    skillMatchScore: number;
    experienceMatchScore: number;
    keywordScore: number;
    skillMatch: SkillMatchResult;
    explanation: string;
  }> {
    try {
      this.logger.log('Analyzing resume match with AI service');

      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/api/v1/nlp/analyze-match`, {
          resume_content: resumeContent,
          job_requirements: jobRequirements,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to analyze resume match', error);
      // Fallback to basic matching
      return this.fallbackMatchAnalysis(resumeContent, jobRequirements);
    }
  }

  /**
   * Generate resume rewrite suggestions
   */
  async generateRewriteSuggestions(
    resumeContent: any,
    jobRequirements: JobRequirements,
    playbookRegion?: string,
  ): Promise<ResumeRewriteSuggestion[]> {
    try {
      this.logger.log('Generating resume rewrite suggestions with AI service');

      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/api/v1/nlp/rewrite-suggestions`, {
          resume_content: resumeContent,
          job_requirements: jobRequirements,
          playbook_region: playbookRegion,
        }),
      );

      return response.data.suggestions || [];
    } catch (error) {
      this.logger.error('Failed to generate rewrite suggestions', error);
      return [];
    }
  }

  /**
   * Generate optimized resume summary
   */
  async generateOptimizedSummary(
    currentSummary: string,
    experience: any[],
    jobRequirements: JobRequirements,
  ): Promise<string> {
    try {
      this.logger.log('Generating optimized summary with AI service');

      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/api/v1/nlp/optimize-summary`, {
          current_summary: currentSummary,
          experience,
          job_requirements: jobRequirements,
        }),
      );

      return response.data.optimized_summary || currentSummary;
    } catch (error) {
      this.logger.error('Failed to generate optimized summary', error);
      return currentSummary;
    }
  }

  /**
   * Generate cover letter
   */
  async generateCoverLetter(
    resumeContent: any,
    jobRequirements: JobRequirements,
    options: {
      tone?: 'professional' | 'casual' | 'enthusiastic' | 'formal';
      style?: 'traditional' | 'modern' | 'creative';
      hiringManager?: string;
      playbookRegion?: string;
    },
  ): Promise<{
    content: string;
    contentHtml: string;
    wordCount: number;
    relevanceScore: number;
  }> {
    try {
      this.logger.log('Generating cover letter with AI service');

      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/api/v1/nlp/generate-cover-letter`, {
          resume_content: resumeContent,
          job_requirements: jobRequirements,
          tone: options.tone || 'professional',
          style: options.style || 'modern',
          hiring_manager: options.hiringManager,
          playbook_region: options.playbookRegion,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to generate cover letter', error);
      // Fallback to basic template
      return this.fallbackCoverLetter(resumeContent, jobRequirements, options);
    }
  }

  /**
   * Extract keywords from text
   */
  async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/api/v1/nlp/extract-keywords`, {
          text,
        }),
      );

      return response.data.keywords || [];
    } catch (error) {
      this.logger.error('Failed to extract keywords', error);
      return this.fallbackKeywordExtraction(text);
    }
  }

  /**
   * Calculate ATS score
   */
  async calculateAtsScore(
    resumeContent: any,
    jobRequirements: JobRequirements,
  ): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/api/v1/nlp/ats-score`, {
          resume_content: resumeContent,
          job_requirements: jobRequirements,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to calculate ATS score', error);
      return {
        score: 70,
        issues: [],
        suggestions: [],
      };
    }
  }

  // Fallback methods when AI service is unavailable

  private fallbackJobParsing(jobDescription: string): JobRequirements {
    const keywords = this.fallbackKeywordExtraction(jobDescription);

    return {
      title: 'Unknown',
      company: 'Unknown',
      requiredSkills: keywords.slice(0, 10),
      preferredSkills: keywords.slice(10, 15),
      keywords,
      experienceLevel: 'Unknown',
      education: [],
      certifications: [],
      responsibilities: [],
      qualifications: [],
      industryKeywords: [],
    };
  }

  private fallbackMatchAnalysis(
    resumeContent: any,
    jobRequirements: JobRequirements,
  ): {
    overallScore: number;
    skillMatchScore: number;
    experienceMatchScore: number;
    keywordScore: number;
    skillMatch: SkillMatchResult;
    explanation: string;
  } {
    // Basic keyword matching
    const resumeText = JSON.stringify(resumeContent).toLowerCase();
    const matchedKeywords = jobRequirements.keywords.filter((kw) => resumeText.includes(kw.toLowerCase()));

    const keywordScore = (matchedKeywords.length / jobRequirements.keywords.length) * 100;

    return {
      overallScore: keywordScore,
      skillMatchScore: keywordScore,
      experienceMatchScore: 70,
      keywordScore,
      skillMatch: {
        matchedSkills: matchedKeywords.map((kw) => ({
          skill: kw,
          source: 'resume' as const,
          confidence: 0.8,
        })),
        missingSkills: [],
        transferableSkills: [],
      },
      explanation: 'Basic keyword matching performed (AI service unavailable)',
    };
  }

  private fallbackCoverLetter(
    resumeContent: any,
    jobRequirements: JobRequirements,
    options: any,
  ): {
    content: string;
    contentHtml: string;
    wordCount: number;
    relevanceScore: number;
  } {
    const name = resumeContent.personalInfo?.fullName || 'Candidate';
    const hiringManagerName = options.hiringManager || 'Hiring Manager';

    const content = `Dear ${hiringManagerName},

I am writing to express my strong interest in the ${jobRequirements.title} position at ${jobRequirements.company}. With my background and experience, I believe I would be a valuable addition to your team.

My qualifications align well with the requirements outlined in the job posting. I am excited about the opportunity to contribute to ${jobRequirements.company} and would welcome the chance to discuss how my skills and experience can benefit your organization.

Thank you for your time and consideration. I look forward to hearing from you.

Sincerely,
${name}`;

    return {
      content,
      contentHtml: content.replace(/\n/g, '<br>'),
      wordCount: content.split(/\s+/).length,
      relevanceScore: 60,
    };
  }

  private fallbackKeywordExtraction(text: string): string[] {
    // Simple keyword extraction: find common tech/professional terms
    const commonKeywords = [
      'javascript',
      'python',
      'java',
      'react',
      'node',
      'aws',
      'docker',
      'kubernetes',
      'sql',
      'mongodb',
      'leadership',
      'teamwork',
      'communication',
      'agile',
      'scrum',
    ];

    return commonKeywords.filter((kw) => text.toLowerCase().includes(kw));
  }

  private transformJobRequirements(aiResponse: any): JobRequirements {
    return {
      title: aiResponse.title || 'Unknown',
      company: aiResponse.company || 'Unknown',
      requiredSkills: aiResponse.required_skills || [],
      preferredSkills: aiResponse.preferred_skills || [],
      keywords: aiResponse.keywords || [],
      experienceLevel: aiResponse.experience_level || 'Unknown',
      education: aiResponse.education || [],
      certifications: aiResponse.certifications || [],
      responsibilities: aiResponse.responsibilities || [],
      qualifications: aiResponse.qualifications || [],
      industryKeywords: aiResponse.industry_keywords || [],
    };
  }
}

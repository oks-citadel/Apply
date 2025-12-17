import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Resume } from '../../resumes/entities/resume.entity';
import { AlignedResume, AlignedContent } from '../entities/aligned-resume.entity';
import { AlignmentAnalysis, AlignmentChanges } from '../entities/alignment-analysis.entity';
import { AIServiceClient, JobRequirements, ResumeRewriteSuggestion } from './ai-service.client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ResumeAlignmentService {
  private readonly logger = new Logger(ResumeAlignmentService.name);
  private readonly jobServiceUrl: string;

  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    @InjectRepository(AlignedResume)
    private readonly alignedResumeRepository: Repository<AlignedResume>,
    @InjectRepository(AlignmentAnalysis)
    private readonly analysisRepository: Repository<AlignmentAnalysis>,
    private readonly aiServiceClient: AIServiceClient,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.jobServiceUrl = this.configService.get<string>('JOB_SERVICE_URL') || 'http://localhost:3002';
  }

  /**
   * Analyze resume fit for a job
   */
  async analyzeResumeFit(
    userId: string,
    resumeId: string,
    jobId?: string,
    jobDescription?: string,
    jobTitle?: string,
    companyName?: string,
  ): Promise<AlignmentAnalysis> {
    this.logger.log(`Analyzing resume ${resumeId} for user ${userId}`);

    // Fetch resume
    const resume = await this.findResume(resumeId, userId);

    // Get job description
    const jobDesc = await this.getJobDescription(jobId, jobDescription);
    if (!jobDesc) {
      throw new BadRequestException('Either jobId or jobDescription must be provided');
    }

    // Parse job requirements using AI
    const jobRequirements = await this.aiServiceClient.parseJobDescription(jobDesc);
    if (jobTitle) jobRequirements.title = jobTitle;
    if (companyName) jobRequirements.company = companyName;

    // Analyze match
    const matchResult = await this.aiServiceClient.analyzeResumeMatch(resume.content, jobRequirements);

    // Perform skill gap analysis
    const skillGapAnalysis = this.performSkillGapAnalysis(resume.content, jobRequirements, matchResult.skillMatch);

    // Perform experience alignment
    const experienceAlignment = this.performExperienceAlignment(resume.content, jobRequirements);

    // Perform keyword analysis
    const keywordAnalysis = await this.performKeywordAnalysis(resume.content, jobRequirements);

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(
      skillGapAnalysis,
      experienceAlignment,
      keywordAnalysis,
    );

    // Calculate overall match score
    const overallMatchScore = this.calculateOverallMatchScore(
      matchResult.skillMatchScore,
      matchResult.experienceMatchScore,
      matchResult.keywordScore,
    );

    // Determine recommendation
    const recommendation = this.determineRecommendation(overallMatchScore);

    // Generate match explanation
    const matchExplanation = matchResult.explanation || this.generateMatchExplanation(overallMatchScore, recommendation);

    // Extract strengths and weaknesses
    const { strengths, weaknesses } = this.extractStrengthsAndWeaknesses(
      skillGapAnalysis,
      experienceAlignment,
      keywordAnalysis,
    );

    // Create analysis entity
    const analysis = this.analysisRepository.create({
      userId,
      jobId,
      baseResumeId: resumeId,
      jobDescription: jobDesc,
      jobTitle: jobRequirements.title,
      companyName: jobRequirements.company,
      overallMatchScore,
      skillGapAnalysis,
      experienceAlignment,
      keywordAnalysis,
      improvementSuggestions,
      skillMatchPercentage: matchResult.skillMatchScore,
      experienceMatchPercentage: matchResult.experienceMatchScore,
      educationMatchPercentage: 75, // Placeholder
      certificationMatchPercentage: 70, // Placeholder
      matchExplanation,
      strengths,
      weaknesses,
      recommendation,
    });

    return this.analysisRepository.save(analysis);
  }

  /**
   * Generate aligned resume for a job
   */
  async generateAlignedResume(
    userId: string,
    resumeId: string,
    jobId?: string,
    jobDescription?: string,
    jobTitle?: string,
    companyName?: string,
    playbookRegion?: string,
    applyAtsOptimization: boolean = true,
    title?: string,
  ): Promise<AlignedResume> {
    this.logger.log(`Generating aligned resume for ${resumeId}`);

    // Fetch resume
    const resume = await this.findResume(resumeId, userId);

    // Get job description
    const jobDesc = await this.getJobDescription(jobId, jobDescription);
    if (!jobDesc) {
      throw new BadRequestException('Either jobId or jobDescription must be provided');
    }

    // Parse job requirements
    const jobRequirements = await this.aiServiceClient.parseJobDescription(jobDesc);
    if (jobTitle) jobRequirements.title = jobTitle;
    if (companyName) jobRequirements.company = companyName;

    // Get rewrite suggestions from AI
    const rewriteSuggestions = await this.aiServiceClient.generateRewriteSuggestions(
      resume.content,
      jobRequirements,
      playbookRegion,
    );

    // Apply alignment to resume content
    const alignedContent = await this.applyAlignment(resume.content, jobRequirements, rewriteSuggestions);

    // Optimize for ATS if requested
    if (applyAtsOptimization) {
      await this.applyAtsOptimization(alignedContent, jobRequirements);
    }

    // Calculate scores
    const matchResult = await this.aiServiceClient.analyzeResumeMatch(alignedContent, jobRequirements);
    const atsResult = await this.aiServiceClient.calculateAtsScore(alignedContent, jobRequirements);

    // Calculate keyword density
    const keywordDensity = this.calculateKeywordDensity(alignedContent, jobRequirements.keywords);

    // Create aligned resume
    const alignedResume = this.alignedResumeRepository.create({
      userId,
      jobId,
      baseResumeId: resumeId,
      title: title || `Aligned Resume for ${jobRequirements.title} at ${jobRequirements.company}`,
      content: alignedContent,
      alignmentMetadata: {
        targetJobTitle: jobRequirements.title,
        targetCompany: jobRequirements.company,
        requiredSkills: jobRequirements.requiredSkills,
        preferredSkills: jobRequirements.preferredSkills,
        keywords: jobRequirements.keywords,
        atsOptimizationApplied: applyAtsOptimization,
        playbookRegion,
        playbookApplied: !!playbookRegion,
      },
      matchScore: matchResult.overallScore,
      atsScore: atsResult.score,
      skillMatchScore: matchResult.skillMatchScore,
      experienceMatchScore: matchResult.experienceMatchScore,
      keywordDensity,
    });

    const savedResume = await this.alignedResumeRepository.save(alignedResume);

    // Create corresponding analysis with changes tracked
    const alignmentChanges = this.trackAlignmentChanges(resume.content, alignedContent, rewriteSuggestions);
    await this.createAnalysisWithChanges(userId, resumeId, savedResume.id, jobDesc, jobRequirements, alignmentChanges);

    return savedResume;
  }

  /**
   * Get alignment analysis by ID
   */
  async getAnalysis(userId: string, analysisId: string): Promise<AlignmentAnalysis> {
    const analysis = await this.analysisRepository.findOne({
      where: { id: analysisId, userId, deletedAt: IsNull() },
      relations: ['baseResume', 'alignedResume'],
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis ${analysisId} not found`);
    }

    return analysis;
  }

  /**
   * Get improvement suggestions for a user
   */
  async getImprovementSuggestions(userId: string): Promise<any[]> {
    const analyses = await this.analysisRepository.find({
      where: { userId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Aggregate suggestions across all analyses
    const aggregatedSuggestions = this.aggregateSuggestions(analyses);

    return aggregatedSuggestions;
  }

  // Private helper methods

  private async findResume(resumeId: string, userId: string): Promise<Resume> {
    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId, userId, deletedAt: IsNull() },
    });

    if (!resume) {
      throw new NotFoundException(`Resume ${resumeId} not found`);
    }

    return resume;
  }

  private async getJobDescription(jobId?: string, jobDescription?: string): Promise<string | null> {
    if (jobDescription) {
      return jobDescription;
    }

    if (jobId) {
      try {
        const response = await firstValueFrom(this.httpService.get(`${this.jobServiceUrl}/api/v1/jobs/${jobId}`));
        return response.data.description || '';
      } catch (error) {
        this.logger.error(`Failed to fetch job ${jobId}`, error);
        throw new NotFoundException(`Job ${jobId} not found`);
      }
    }

    return null;
  }

  private performSkillGapAnalysis(resumeContent: any, jobRequirements: JobRequirements, skillMatch: any): any {
    const resumeSkills = [
      ...(resumeContent.skills?.technical || []),
      ...(resumeContent.skills?.tools || []),
    ];

    const matchedSkills = skillMatch.matchedSkills || [];
    const missingSkills = jobRequirements.requiredSkills
      .filter((skill) => !resumeSkills.some((rs) => rs.toLowerCase().includes(skill.toLowerCase())))
      .map((skill) => ({
        skill,
        importance: 'required' as const,
        category: 'technical',
        learnability: 'moderate' as const,
      }));

    return {
      matchedSkills,
      missingSkills,
      transferableSkills: skillMatch.transferableSkills || [],
    };
  }

  private performExperienceAlignment(resumeContent: any, jobRequirements: JobRequirements): any {
    const experiences = resumeContent.experience || [];

    // Calculate relevance for each experience
    const relevantExperiences = experiences
      .map((exp: any) => {
        const matchingResponsibilities = this.findMatchingResponsibilities(
          exp.description,
          jobRequirements.responsibilities,
        );

        const relevanceScore = (matchingResponsibilities.length / Math.max(jobRequirements.responsibilities.length, 1)) * 100;

        return {
          experienceId: exp.id || '',
          company: exp.company,
          position: exp.position,
          relevanceScore,
          matchingResponsibilities,
          matchingAchievements: exp.achievements || [],
        };
      })
      .filter((exp: any) => exp.relevanceScore > 20);

    // Calculate total years of experience
    const yearsOfRelevantExperience = this.calculateYearsOfExperience(experiences);

    return {
      relevantExperiences,
      yearsOfRelevantExperience,
      seniority: this.determineSeniority(yearsOfRelevantExperience),
      industryMatch: true,
      roleTypeMatch: true,
    };
  }

  private async performKeywordAnalysis(resumeContent: any, jobRequirements: JobRequirements): Promise<any> {
    const resumeText = JSON.stringify(resumeContent).toLowerCase();
    const keywords = jobRequirements.keywords;

    const presentKeywords = keywords
      .filter((kw) => resumeText.includes(kw.toLowerCase()))
      .map((kw) => ({
        keyword: kw,
        frequency: this.countOccurrences(resumeText, kw.toLowerCase()),
        context: [],
        importance: 'high' as const,
      }));

    const missingKeywords = keywords
      .filter((kw) => !resumeText.includes(kw.toLowerCase()))
      .map((kw) => ({
        keyword: kw,
        importance: 'important' as const,
        suggestedPlacement: ['summary', 'experience'],
      }));

    const atsResult = await this.aiServiceClient.calculateAtsScore(resumeContent, jobRequirements);

    return {
      presentKeywords,
      missingKeywords,
      atsCompatibility: atsResult,
    };
  }

  private generateImprovementSuggestions(skillGapAnalysis: any, experienceAlignment: any, keywordAnalysis: any): any {
    return {
      skillGaps: skillGapAnalysis.missingSkills.map((skill: any) => ({
        skill: skill.skill,
        priority: skill.importance === 'required' ? 'high' : 'medium',
        learningResources: [],
        estimatedTimeToLearn: '2-4 weeks',
      })),
      experienceGaps: [],
      certificationSuggestions: [],
      resumeImprovements: keywordAnalysis.atsCompatibility.suggestions.map((suggestion: string) => ({
        improvement: suggestion,
        impact: 'high' as const,
        effort: 'moderate' as const,
      })),
    };
  }

  private calculateOverallMatchScore(skillScore: number, experienceScore: number, keywordScore: number): number {
    return (skillScore * 0.4 + experienceScore * 0.4 + keywordScore * 0.2);
  }

  private determineRecommendation(score: number): 'strong-fit' | 'good-fit' | 'moderate-fit' | 'weak-fit' | 'poor-fit' {
    if (score >= 85) return 'strong-fit';
    if (score >= 70) return 'good-fit';
    if (score >= 50) return 'moderate-fit';
    if (score >= 30) return 'weak-fit';
    return 'poor-fit';
  }

  private generateMatchExplanation(score: number, recommendation: string): string {
    if (score >= 85) {
      return 'You are a strong fit for this role based on your experience, skills, and qualifications.';
    } else if (score >= 70) {
      return 'You are a good fit for this role with some areas for improvement.';
    } else if (score >= 50) {
      return 'You have moderate fit for this role but may need to develop additional skills.';
    } else {
      return 'This role may be challenging given your current experience and skill set.';
    }
  }

  private extractStrengthsAndWeaknesses(skillGapAnalysis: any, experienceAlignment: any, keywordAnalysis: any): any {
    const strengths = [
      ...skillGapAnalysis.matchedSkills.slice(0, 5).map((s: any) => `${s.skill} experience`),
      `${experienceAlignment.yearsOfRelevantExperience} years of relevant experience`,
    ];

    const weaknesses = [
      ...skillGapAnalysis.missingSkills.slice(0, 3).map((s: any) => `Missing ${s.skill}`),
      ...keywordAnalysis.missingKeywords.slice(0, 2).map((k: any) => `Limited ${k.keyword} mention`),
    ];

    return { strengths, weaknesses };
  }

  private async applyAlignment(
    originalContent: any,
    jobRequirements: JobRequirements,
    suggestions: ResumeRewriteSuggestion[],
  ): Promise<AlignedContent> {
    const alignedContent: AlignedContent = JSON.parse(JSON.stringify(originalContent));

    // Optimize summary
    if (alignedContent.summary) {
      alignedContent.summary = await this.aiServiceClient.generateOptimizedSummary(
        alignedContent.summary,
        alignedContent.experience || [],
        jobRequirements,
      );
    }

    // Apply rewrite suggestions
    for (const suggestion of suggestions) {
      this.applySuggestion(alignedContent, suggestion);
    }

    // Mark relevant items
    this.markRelevantItems(alignedContent, jobRequirements);

    // Add matched/missing skills
    if (alignedContent.skills) {
      const resumeSkills = [...(alignedContent.skills.technical || []), ...(alignedContent.skills.tools || [])];
      alignedContent.skills.matched = jobRequirements.requiredSkills.filter((skill) =>
        resumeSkills.some((rs) => rs.toLowerCase().includes(skill.toLowerCase())),
      );
      alignedContent.skills.missing = jobRequirements.requiredSkills.filter(
        (skill) => !resumeSkills.some((rs) => rs.toLowerCase().includes(skill.toLowerCase())),
      );
    }

    return alignedContent;
  }

  private applySuggestion(content: AlignedContent, suggestion: ResumeRewriteSuggestion): void {
    // Apply rewrite based on section
    if (suggestion.section === 'experience' && content.experience) {
      const exp = content.experience.find((e) => e.id === suggestion.itemId);
      if (exp) {
        exp.description = suggestion.rewrittenText;
      }
    }
    // Add more section handling as needed
  }

  private markRelevantItems(content: AlignedContent, jobRequirements: JobRequirements): void {
    // Mark relevant experiences
    if (content.experience) {
      for (const exp of content.experience) {
        const relevance = this.calculateItemRelevance(exp.description, jobRequirements.keywords);
        exp.highlighted = relevance > 50;
        exp.relevanceScore = relevance;
      }
      // Sort by relevance
      content.experience.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
  }

  private async applyAtsOptimization(content: AlignedContent, jobRequirements: JobRequirements): Promise<void> {
    // Ensure keywords are present in summary
    if (content.summary && jobRequirements.keywords.length > 0) {
      const keywords = jobRequirements.keywords.slice(0, 5);
      for (const keyword of keywords) {
        if (!content.summary.toLowerCase().includes(keyword.toLowerCase())) {
          // Keyword optimization handled by AI service
        }
      }
    }
  }

  private calculateKeywordDensity(content: AlignedContent, keywords: string[]): number {
    const contentText = JSON.stringify(content).toLowerCase();
    const presentKeywords = keywords.filter((kw) => contentText.includes(kw.toLowerCase()));
    return (presentKeywords.length / keywords.length) * 100;
  }

  private trackAlignmentChanges(
    original: any,
    aligned: AlignedContent,
    suggestions: ResumeRewriteSuggestion[],
  ): AlignmentChanges {
    return {
      sectionsReordered: [],
      contentRewritten: suggestions.map((s) => ({
        section: s.section,
        itemId: s.itemId,
        originalText: s.originalText,
        rewrittenText: s.rewrittenText,
        reason: s.reason,
        improvementType: s.improvementType,
      })),
      itemsHighlighted: [],
      keywordsAdded: [],
    };
  }

  private async createAnalysisWithChanges(
    userId: string,
    baseResumeId: string,
    alignedResumeId: string,
    jobDescription: string,
    jobRequirements: JobRequirements,
    alignmentChanges: AlignmentChanges,
  ): Promise<void> {
    // Analysis is created separately via analyzeResumeFit
    // This method could update an existing analysis with changes
  }

  private findMatchingResponsibilities(description: string, responsibilities: string[]): string[] {
    return responsibilities.filter((resp) => description.toLowerCase().includes(resp.toLowerCase().split(' ')[0]));
  }

  private calculateYearsOfExperience(experiences: any[]): number {
    let totalMonths = 0;
    for (const exp of experiences) {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += months;
    }
    return Math.round(totalMonths / 12);
  }

  private determineSeniority(years: number): string {
    if (years < 2) return 'entry';
    if (years < 5) return 'mid';
    if (years < 10) return 'senior';
    if (years < 15) return 'lead';
    return 'executive';
  }

  private countOccurrences(text: string, keyword: string): number {
    const regex = new RegExp(keyword, 'gi');
    return (text.match(regex) || []).length;
  }

  private calculateItemRelevance(text: string, keywords: string[]): number {
    const textLower = text.toLowerCase();
    const matchedKeywords = keywords.filter((kw) => textLower.includes(kw.toLowerCase()));
    return (matchedKeywords.length / keywords.length) * 100;
  }

  private aggregateSuggestions(analyses: AlignmentAnalysis[]): any[] {
    const allSuggestions: any[] = [];
    const skillCounts = new Map<string, number>();

    for (const analysis of analyses) {
      for (const skillGap of analysis.improvementSuggestions.skillGaps || []) {
        const count = skillCounts.get(skillGap.skill) || 0;
        skillCounts.set(skillGap.skill, count + 1);
      }
    }

    // Return most frequently missing skills
    return Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({
        skill,
        occurrences: count,
        priority: count > 3 ? 'high' : count > 1 ? 'medium' : 'low',
      }));
  }
}

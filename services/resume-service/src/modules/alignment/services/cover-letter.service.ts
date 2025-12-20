import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { IsNull } from 'typeorm';

import { Resume } from '../../resumes/entities/resume.entity';
import { AlignedResume } from '../entities/aligned-resume.entity';
import { GeneratedCoverLetter } from '../entities/generated-cover-letter.entity';

import type { AIServiceClient, JobRequirements } from './ai-service.client';
import type { CoverLetterMetadata } from '../entities/generated-cover-letter.entity';
import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import type { Repository} from 'typeorm';

interface PlaybookGuidelines {
  tone: 'professional' | 'casual' | 'enthusiastic' | 'formal';
  style: 'traditional' | 'modern' | 'creative';
  maxWordCount: number;
  includeAddress: boolean;
  salutation: string;
  closing: string;
  emphasizePoints: string[];
}

@Injectable()
export class CoverLetterService {
  private readonly logger = new Logger(CoverLetterService.name);
  private readonly jobServiceUrl: string;

  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    @InjectRepository(AlignedResume)
    private readonly alignedResumeRepository: Repository<AlignedResume>,
    @InjectRepository(GeneratedCoverLetter)
    private readonly coverLetterRepository: Repository<GeneratedCoverLetter>,
    private readonly aiServiceClient: AIServiceClient,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.jobServiceUrl = this.configService.get<string>('JOB_SERVICE_URL') || 'http://localhost:3002';
  }

  /**
   * Generate cover letter for a job application
   */
  async generateCoverLetter(
    userId: string,
    resumeId: string,
    alignedResumeId?: string,
    jobId?: string,
    jobDescription?: string,
    jobTitle?: string,
    companyName?: string,
    hiringManager?: string,
    tone: 'professional' | 'casual' | 'enthusiastic' | 'formal' = 'professional',
    style: 'traditional' | 'modern' | 'creative' = 'modern',
    playbookRegion?: string,
    title?: string,
  ): Promise<GeneratedCoverLetter> {
    this.logger.log(`Generating cover letter for user ${userId}`);

    // Fetch resume
    const resume = await this.findResume(resumeId, userId);

    // Optionally fetch aligned resume
    let alignedResume: AlignedResume | null = null;
    if (alignedResumeId) {
      alignedResume = await this.findAlignedResume(alignedResumeId, userId);
    }

    // Get job description
    const jobDesc = await this.getJobDescription(jobId, jobDescription);
    if (!jobDesc) {
      throw new BadRequestException('Either jobId or jobDescription must be provided');
    }

    // Parse job requirements
    const jobRequirements = await this.aiServiceClient.parseJobDescription(jobDesc);
    if (jobTitle) {jobRequirements.title = jobTitle;}
    if (companyName) {jobRequirements.company = companyName;}

    // Get playbook guidelines
    const playbookGuidelines = await this.getPlaybookGuidelines(playbookRegion, tone, style);

    // Use aligned resume content if available, otherwise use base resume
    const resumeContent = alignedResume?.content || resume.content;

    // Generate cover letter using AI
    const generatedContent = await this.aiServiceClient.generateCoverLetter(resumeContent, jobRequirements, {
      tone: playbookGuidelines.tone,
      style: playbookGuidelines.style,
      hiringManager,
      playbookRegion,
    });

    // Apply regional formatting
    const formattedContent = this.applyRegionalFormatting(
      generatedContent.content,
      playbookGuidelines,
      resume.content,
      jobRequirements,
      hiringManager,
    );

    // Extract key points highlighted
    const keyPointsHighlighted = this.extractKeyPoints(formattedContent);

    // Extract emphasized skills
    const skillsEmphasized = this.extractEmphasizedSkills(formattedContent, resumeContent);

    // Create metadata
    const metadata: CoverLetterMetadata = {
      targetJobTitle: jobRequirements.title,
      targetCompany: jobRequirements.company,
      targetHiringManager: hiringManager,
      tone: playbookGuidelines.tone,
      style: playbookGuidelines.style,
      playbookRegion,
      keyPointsHighlighted,
      skillsEmphasized,
    };

    // Create cover letter entity
    const coverLetter = this.coverLetterRepository.create({
      userId,
      jobId,
      alignedResumeId,
      baseResumeId: resumeId,
      title: title || `Cover Letter for ${jobRequirements.title} at ${jobRequirements.company}`,
      content: formattedContent,
      contentHtml: generatedContent.contentHtml || this.convertToHtml(formattedContent),
      metadata,
      relevanceScore: generatedContent.relevanceScore,
      toneAppropriateness: this.calculateToneAppropriateness(formattedContent, playbookGuidelines.tone),
      wordCount: generatedContent.wordCount,
    });

    return this.coverLetterRepository.save(coverLetter);
  }

  /**
   * Get cover letter by ID
   */
  async getCoverLetter(userId: string, coverLetterId: string): Promise<GeneratedCoverLetter> {
    const coverLetter = await this.coverLetterRepository.findOne({
      where: { id: coverLetterId, userId, deletedAt: IsNull() },
      relations: ['alignedResume', 'baseResume'],
    });

    if (!coverLetter) {
      throw new NotFoundException(`Cover letter ${coverLetterId} not found`);
    }

    return coverLetter;
  }

  /**
   * List cover letters for a user
   */
  async listCoverLetters(userId: string, jobId?: string, page: number = 1, limit: number = 10): Promise<{
    coverLetters: GeneratedCoverLetter[];
    total: number;
  }> {
    const where: any = { userId, deletedAt: IsNull() };
    if (jobId) {
      where.jobId = jobId;
    }

    const [coverLetters, total] = await this.coverLetterRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { coverLetters, total };
  }

  /**
   * Update cover letter
   */
  async updateCoverLetter(
    userId: string,
    coverLetterId: string,
    updates: { content?: string; title?: string; isActive?: boolean },
  ): Promise<GeneratedCoverLetter> {
    const coverLetter = await this.getCoverLetter(userId, coverLetterId);

    if (updates.content !== undefined) {
      coverLetter.content = updates.content;
      coverLetter.contentHtml = this.convertToHtml(updates.content);
      coverLetter.wordCount = updates.content.split(/\s+/).length;
    }

    if (updates.title !== undefined) {
      coverLetter.title = updates.title;
    }

    if (updates.isActive !== undefined) {
      coverLetter.isActive = updates.isActive;
    }

    return this.coverLetterRepository.save(coverLetter);
  }

  /**
   * Delete cover letter
   */
  async deleteCoverLetter(userId: string, coverLetterId: string): Promise<void> {
    const coverLetter = await this.getCoverLetter(userId, coverLetterId);
    coverLetter.deletedAt = new Date();
    await this.coverLetterRepository.save(coverLetter);
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

  private async findAlignedResume(alignedResumeId: string, userId: string): Promise<AlignedResume> {
    const alignedResume = await this.alignedResumeRepository.findOne({
      where: { id: alignedResumeId, userId, deletedAt: IsNull() },
    });

    if (!alignedResume) {
      throw new NotFoundException(`Aligned resume ${alignedResumeId} not found`);
    }

    return alignedResume;
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

  private async getPlaybookGuidelines(
    region?: string,
    tone?: string,
    style?: string,
  ): Promise<PlaybookGuidelines> {
    if (!region) {
      return this.getDefaultGuidelines(tone, style);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.jobServiceUrl}/api/v1/playbooks/region/${region}`),
      );

      const playbook = response.data;

      return {
        tone: tone || (playbook.coverLetterGuidelines?.tone as any) || 'professional',
        style: style || (playbook.coverLetterGuidelines?.style as any) || 'modern',
        maxWordCount: playbook.coverLetterGuidelines?.maxWordCount || 400,
        includeAddress: playbook.coverLetterGuidelines?.includeAddress !== false,
        salutation: playbook.coverLetterGuidelines?.salutation || 'Dear Hiring Manager',
        closing: playbook.coverLetterGuidelines?.closing || 'Sincerely',
        emphasizePoints: playbook.coverLetterGuidelines?.emphasizePoints || [],
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch playbook for region ${region}, using defaults`);
      return this.getDefaultGuidelines(tone, style);
    }
  }

  private getDefaultGuidelines(
    tone?: string,
    style?: string,
  ): PlaybookGuidelines {
    return {
      tone: (tone as any) || 'professional',
      style: (style as any) || 'modern',
      maxWordCount: 400,
      includeAddress: true,
      salutation: 'Dear Hiring Manager',
      closing: 'Sincerely',
      emphasizePoints: ['relevant experience', 'key skills', 'enthusiasm for role'],
    };
  }

  private applyRegionalFormatting(
    content: string,
    guidelines: PlaybookGuidelines,
    resumeContent: any,
    jobRequirements: JobRequirements,
    hiringManager?: string,
  ): string {
    let formatted = content;

    // Apply salutation
    const salutation = hiringManager ? `Dear ${hiringManager}` : guidelines.salutation;
    formatted = formatted.replace(/Dear [^,]+,/, `${salutation},`);

    // Apply closing
    formatted = formatted.replace(/Sincerely,|Best regards,|Kind regards,/i, `${guidelines.closing},`);

    // Add candidate name
    const candidateName = resumeContent.personalInfo?.fullName || 'Candidate';
    if (!formatted.includes(candidateName)) {
      formatted += `\n\n${candidateName}`;
    }

    // Enforce word count limit
    const words = formatted.split(/\s+/);
    if (words.length > guidelines.maxWordCount) {
      formatted = `${words.slice(0, guidelines.maxWordCount).join(' ')  }...`;
    }

    return formatted;
  }

  private extractKeyPoints(content: string): string[] {
    const keyPoints: string[] = [];

    // Extract sentences that highlight experience or skills
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (
        sentence.toLowerCase().includes('experience') ||
        sentence.toLowerCase().includes('skilled') ||
        sentence.toLowerCase().includes('expertise') ||
        sentence.toLowerCase().includes('accomplished')
      ) {
        keyPoints.push(sentence.trim());
      }
    }

    return keyPoints.slice(0, 5);
  }

  private extractEmphasizedSkills(content: string, resumeContent: any): string[] {
    const contentLower = content.toLowerCase();
    const skills = [
      ...(resumeContent.skills?.technical || []),
      ...(resumeContent.skills?.tools || []),
      ...(resumeContent.skills?.soft || []),
    ];

    return skills.filter((skill: string) => contentLower.includes(skill.toLowerCase())).slice(0, 10);
  }

  private calculateToneAppropriateness(content: string, expectedTone: string): number {
    // Simple heuristic-based tone analysis
    const contentLower = content.toLowerCase();

    const toneIndicators = {
      professional: ['experience', 'expertise', 'professional', 'accomplished', 'deliver'],
      casual: ['excited', 'love', 'awesome', 'great', 'really'],
      enthusiastic: ['passionate', 'excited', 'thrilled', 'eager', 'enthusiastic'],
      formal: ['hereby', 'pursuant', 'aforementioned', 'respectfully', 'kindly'],
    };

    const indicators = toneIndicators[expectedTone as keyof typeof toneIndicators] || [];
    const matchCount = indicators.filter((indicator) => contentLower.includes(indicator)).length;

    return Math.min(100, (matchCount / indicators.length) * 100 + 60);
  }

  private convertToHtml(content: string): string {
    // Convert plain text to HTML
    const paragraphs = content.split('\n\n');
    const htmlParagraphs = paragraphs.map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`);
    return htmlParagraphs.join('\n');
  }
}

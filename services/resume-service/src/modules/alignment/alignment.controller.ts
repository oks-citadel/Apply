import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

import {
  AlignmentAnalysisResponseDto,
  AlignedResumeResponseDto,
  GeneratedCoverLetterResponseDto,
  ExplainAlignmentResponseDto,
} from './dto/alignment-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CoverLetterService } from './services/cover-letter.service';
import { ResumeAlignmentService } from './services/resume-alignment.service';

import type { AnalyzeResumeDto } from './dto/analyze-resume.dto';
import type { GenerateAlignedResumeDto } from './dto/generate-aligned-resume.dto';
import type { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';



@ApiTags('alignment')
@ApiBearerAuth()
@Controller('api/v1/alignment')
@UseGuards(JwtAuthGuard)
export class AlignmentController {
  private readonly logger = new Logger(AlignmentController.name);

  constructor(
    private readonly alignmentService: ResumeAlignmentService,
    private readonly coverLetterService: CoverLetterService,
  ) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze resume vs job fit',
    description:
      'Analyze how well a resume matches a job description. Provides skill gap analysis, experience alignment, and improvement suggestions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resume analysis completed successfully',
    type: AlignmentAnalysisResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Resume or job not found' })
  async analyzeResume(
    @CurrentUser('userId') userId: string,
    @Body() analyzeDto: AnalyzeResumeDto,
  ): Promise<AlignmentAnalysisResponseDto> {
    this.logger.log(`Analyzing resume ${analyzeDto.resumeId} for user ${userId}`);

    const analysis = await this.alignmentService.analyzeResumeFit(
      userId,
      analyzeDto.resumeId,
      analyzeDto.jobId,
      analyzeDto.jobDescription,
      analyzeDto.jobTitle,
      analyzeDto.companyName,
    );

    return AlignmentAnalysisResponseDto.fromEntity(analysis);
  }

  @Post('resume')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate aligned resume',
    description:
      'Generate a job-specific resume that is optimized for ATS, highlights relevant experience, and incorporates regional playbook formatting.',
  })
  @ApiResponse({
    status: 201,
    description: 'Aligned resume generated successfully',
    type: AlignedResumeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Resume or job not found' })
  async generateAlignedResume(
    @CurrentUser('userId') userId: string,
    @Body() generateDto: GenerateAlignedResumeDto,
  ): Promise<AlignedResumeResponseDto> {
    this.logger.log(`Generating aligned resume for user ${userId}`);

    const alignedResume = await this.alignmentService.generateAlignedResume(
      userId,
      generateDto.resumeId,
      generateDto.jobId,
      generateDto.jobDescription,
      generateDto.jobTitle,
      generateDto.companyName,
      generateDto.playbookRegion,
      generateDto.applyAtsOptimization !== false,
      generateDto.title,
    );

    return AlignedResumeResponseDto.fromEntity(alignedResume);
  }

  @Post('cover-letter')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate cover letter',
    description:
      'Generate a tailored cover letter for a specific job. Uses appropriate tone/style from regional playbook and highlights matching experience.',
  })
  @ApiResponse({
    status: 201,
    description: 'Cover letter generated successfully',
    type: GeneratedCoverLetterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Resume or job not found' })
  async generateCoverLetter(
    @CurrentUser('userId') userId: string,
    @Body() generateDto: GenerateCoverLetterDto,
  ): Promise<GeneratedCoverLetterResponseDto> {
    this.logger.log(`Generating cover letter for user ${userId}`);

    const coverLetter = await this.coverLetterService.generateCoverLetter(
      userId,
      generateDto.resumeId,
      generateDto.alignedResumeId,
      generateDto.jobId,
      generateDto.jobDescription,
      generateDto.jobTitle,
      generateDto.companyName,
      generateDto.hiringManager,
      generateDto.tone,
      generateDto.style,
      generateDto.playbookRegion,
      generateDto.title,
    );

    return GeneratedCoverLetterResponseDto.fromEntity(coverLetter);
  }

  @Get('explain/:id')
  @ApiOperation({
    summary: 'Explain alignment decisions',
    description:
      'Get detailed explanation of why specific alignment changes were made to the resume, including before/after comparisons.',
  })
  @ApiParam({ name: 'id', description: 'Alignment analysis ID' })
  @ApiResponse({
    status: 200,
    description: 'Alignment explanation retrieved successfully',
    type: ExplainAlignmentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async explainAlignment(
    @CurrentUser('userId') userId: string,
    @Param('id') analysisId: string,
  ): Promise<ExplainAlignmentResponseDto> {
    this.logger.log(`Explaining alignment ${analysisId} for user ${userId}`);

    const analysis = await this.alignmentService.getAnalysis(userId, analysisId);

    // Build before/after comparison
    const beforeAfter = {
      original: analysis.baseResume?.content || {},
      aligned: analysis.alignedResume?.content || {},
    };

    // Generate change explanations
    const changeExplanations = this.generateChangeExplanations(analysis);

    return {
      analysis: AlignmentAnalysisResponseDto.fromEntity(analysis),
      alignmentChanges: analysis.alignmentChanges,
      beforeAfter,
      changeExplanations,
    };
  }

  @Get('suggestions/:userId')
  @ApiOperation({
    summary: 'Get improvement suggestions',
    description:
      'Get aggregated improvement suggestions for a user based on their job application history and skill gaps.',
  })
  @ApiParam({ name: 'userId', description: 'User ID (must match authenticated user)' })
  @ApiResponse({
    status: 200,
    description: 'Improvement suggestions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          skill: { type: 'string', example: 'AWS' },
          occurrences: { type: 'number', example: 5 },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], example: 'high' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - userId mismatch' })
  async getImprovementSuggestions(
    @CurrentUser('userId') currentUserId: string,
    @Param('userId') userId: string,
  ): Promise<any[]> {
    this.logger.log(`Getting improvement suggestions for user ${userId}`);

    // Ensure user can only access their own suggestions
    if (currentUserId !== userId) {
      this.logger.warn(`User ${currentUserId} attempted to access suggestions for ${userId}`);
      return []; // Return empty array instead of throwing error for better UX
    }

    return this.alignmentService.getImprovementSuggestions(userId);
  }

  @Get('analysis/:id')
  @ApiOperation({
    summary: 'Get alignment analysis by ID',
    description: 'Retrieve a specific alignment analysis with all details.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiResponse({
    status: 200,
    description: 'Analysis retrieved successfully',
    type: AlignmentAnalysisResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async getAnalysis(
    @CurrentUser('userId') userId: string,
    @Param('id') analysisId: string,
  ): Promise<AlignmentAnalysisResponseDto> {
    this.logger.log(`Getting analysis ${analysisId} for user ${userId}`);

    const analysis = await this.alignmentService.getAnalysis(userId, analysisId);
    return AlignmentAnalysisResponseDto.fromEntity(analysis);
  }

  @Get('aligned-resume/:id')
  @ApiOperation({
    summary: 'Get aligned resume by ID',
    description: 'Retrieve a specific aligned resume.',
  })
  @ApiParam({ name: 'id', description: 'Aligned resume ID' })
  @ApiResponse({
    status: 200,
    description: 'Aligned resume retrieved successfully',
    type: AlignedResumeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Aligned resume not found' })
  async getAlignedResume(
    @CurrentUser('userId') userId: string,
    @Param('id') alignedResumeId: string,
  ): Promise<AlignedResumeResponseDto> {
    this.logger.log(`Getting aligned resume ${alignedResumeId} for user ${userId}`);

    const _alignedResume = await this.alignmentService.getAnalysis(userId, alignedResumeId);

    // This would need a dedicated method in the service
    // For now, return placeholder
    return {} as AlignedResumeResponseDto;
  }

  @Get('cover-letter/:id')
  @ApiOperation({
    summary: 'Get cover letter by ID',
    description: 'Retrieve a specific generated cover letter.',
  })
  @ApiParam({ name: 'id', description: 'Cover letter ID' })
  @ApiResponse({
    status: 200,
    description: 'Cover letter retrieved successfully',
    type: GeneratedCoverLetterResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cover letter not found' })
  async getCoverLetter(
    @CurrentUser('userId') userId: string,
    @Param('id') coverLetterId: string,
  ): Promise<GeneratedCoverLetterResponseDto> {
    this.logger.log(`Getting cover letter ${coverLetterId} for user ${userId}`);

    const coverLetter = await this.coverLetterService.getCoverLetter(userId, coverLetterId);
    return GeneratedCoverLetterResponseDto.fromEntity(coverLetter);
  }

  @Get('cover-letters')
  @ApiOperation({
    summary: 'List cover letters',
    description: 'List all cover letters for the authenticated user, optionally filtered by job.',
  })
  @ApiQuery({ name: 'jobId', required: false, description: 'Filter by job ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Cover letters retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        coverLetters: { type: 'array', items: { $ref: '#/components/schemas/GeneratedCoverLetterResponseDto' } },
        total: { type: 'number', example: 25 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listCoverLetters(
    @CurrentUser('userId') userId: string,
    @Query('jobId') jobId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{
    coverLetters: GeneratedCoverLetterResponseDto[];
    total: number;
  }> {
    this.logger.log(`Listing cover letters for user ${userId}`);

    const result = await this.coverLetterService.listCoverLetters(userId, jobId, page, limit);

    return {
      coverLetters: result.coverLetters.map((cl) => GeneratedCoverLetterResponseDto.fromEntity(cl)),
      total: result.total,
    };
  }

  // Private helper methods

  private generateChangeExplanations(analysis: any): Array<{ change: string; impact: string }> {
    const explanations: Array<{ change: string; impact: string }> = [];

    if (analysis.alignmentChanges?.contentRewritten) {
      for (const rewrite of analysis.alignmentChanges.contentRewritten.slice(0, 5)) {
        explanations.push({
          change: `Rewrote ${rewrite.section}: "${rewrite.originalText.substring(0, 50)}..." to "${rewrite.rewrittenText.substring(0, 50)}..."`,
          impact: `Improved ${rewrite.improvementType} for better job fit`,
        });
      }
    }

    if (analysis.alignmentChanges?.sectionsReordered) {
      for (const reorder of analysis.alignmentChanges.sectionsReordered) {
        explanations.push({
          change: `Moved ${reorder.section} from position ${reorder.oldPosition} to ${reorder.newPosition}`,
          impact: reorder.reason,
        });
      }
    }

    if (explanations.length === 0) {
      explanations.push({
        change: 'Optimized resume content for job requirements',
        impact: `Increased match score to ${analysis.overallMatchScore}%`,
      });
    }

    return explanations;
  }
}

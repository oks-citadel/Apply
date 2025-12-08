import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { SearchJobsDto, PaginatedJobsResponseDto, JobResponseDto } from './dto/search-jobs.dto';
import { SaveJobDto, UpdateSavedJobDto } from './dto/save-job.dto';
import { MatchScoreDto, MatchScoreResponseDto } from './dto/match-score.dto';
import { InterviewQuestionsResponseDto } from './dto/interview-questions.dto';
import { SalaryPredictionDto, SalaryPredictionResponseDto } from './dto/salary-prediction.dto';
import { ReportJobDto, ReportJobResponseDto } from './dto/report-job.dto';

const AuthGuard = () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => descriptor;

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search jobs with filters' })
  @ApiResponse({ status: 200, type: PaginatedJobsResponseDto })
  async searchJobs(@Query() searchDto: SearchJobsDto, @Request() req?: any): Promise<PaginatedJobsResponseDto> {
    const userId = req?.user?.id;
    return this.jobsService.searchJobs(searchDto, userId);
  }

  @Get('recommended')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get recommended jobs for user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecommendedJobs(@Request() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.jobsService.getRecommendedJobs(req.user.id, page, limit);
  }

  @Get('saved')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get saved jobs' })
  async getSavedJobs(@Request() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.jobsService.getSavedJobs(req.user.id, page, limit);
  }

  @Post('saved')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Save a job' })
  async saveJob(@Body() body: { jobId: string; notes?: string; tags?: string[] }, @Request() req: any) {
    const { jobId, ...saveJobDto } = body;
    return this.jobsService.saveJob(req.user.id, jobId, saveJobDto);
  }

  @Delete('saved/:id')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unsave a job' })
  async unsaveJob(@Param('id') id: string, @Request() req: any) {
    await this.jobsService.unsaveJob(req.user.id, id);
    return { message: 'Job removed from saved jobs' };
  }

  @Patch('saved/:id')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update saved job' })
  async updateSavedJob(@Param('id') id: string, @Body() updateDto: UpdateSavedJobDto, @Request() req: any) {
    return this.jobsService.updateSavedJob(req.user.id, id, updateDto);
  }

  @Post('match-score')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Calculate match score' })
  @ApiResponse({ status: 200, type: MatchScoreResponseDto })
  async getMatchScore(@Body() matchScoreDto: MatchScoreDto, @Request() req: any): Promise<MatchScoreResponseDto> {
    return this.jobsService.calculateMatchScore(matchScoreDto.jobId, matchScoreDto.resumeId, req.user.id);
  }

  @Post('salary-prediction')
  @ApiOperation({ summary: 'Predict salary' })
  @ApiResponse({ status: 200, type: SalaryPredictionResponseDto })
  async getSalaryPrediction(@Body() salaryPredictionDto: SalaryPredictionDto): Promise<SalaryPredictionResponseDto> {
    return this.jobsService.predictSalary(salaryPredictionDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, type: JobResponseDto })
  async getJobById(@Param('id') id: string, @Request() req?: any): Promise<JobResponseDto> {
    const userId = req?.user?.id;
    return this.jobsService.getJobById(id, userId);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar jobs' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  async getSimilarJobs(@Param('id') id: string, @Query('limit') limit: number = 10): Promise<JobResponseDto[]> {
    return this.jobsService.getSimilarJobs(id, limit);
  }

  @Get(':id/interview-questions')
  @ApiOperation({ summary: 'Get interview questions' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, type: InterviewQuestionsResponseDto })
  async getInterviewQuestions(@Param('id') id: string): Promise<InterviewQuestionsResponseDto> {
    return this.jobsService.getInterviewQuestions(id);
  }

  @Post(':id/report')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Report a job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, type: ReportJobResponseDto })
  async reportJob(@Param('id') id: string, @Body() reportJobDto: ReportJobDto, @Request() req: any): Promise<ReportJobResponseDto> {
    return this.jobsService.reportJob(id, reportJobDto, req.user.id);
  }

  @Get(':id/reports')
  @ApiOperation({ summary: 'Get reports for a job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of reports for the job' })
  async getJobReports(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.jobsService.getJobReports(id, page, limit);
  }

  @Get(':id/report-count')
  @ApiOperation({ summary: 'Get report count for a job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Number of reports for the job' })
  async getJobReportCount(@Param('id') id: string): Promise<{ count: number }> {
    const count = await this.jobsService.getJobReportCount(id);
    return { count };
  }

  @Get(':id/has-reported')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check if user has reported this job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Whether the user has reported this job' })
  async hasUserReportedJob(@Param('id') id: string, @Request() req: any): Promise<{ hasReported: boolean }> {
    const hasReported = await this.jobsService.hasUserReportedJob(req.user.id, id);
    return { hasReported };
  }
}

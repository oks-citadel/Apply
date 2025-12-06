import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
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

// Mock auth guard - replace with actual implementation
const AuthGuard = () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => descriptor;

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Search jobs with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of jobs',
    type: PaginatedJobsResponseDto,
  })
  async searchJobs(
    @Query() searchDto: SearchJobsDto,
    @Request() req?: any,
  ): Promise<PaginatedJobsResponseDto> {
    const userId = req?.user?.id;
    return this.jobsService.searchJobs(searchDto, userId);
  }

  @Get('recommended')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get AI-recommended jobs for user' })
  @ApiResponse({
    status: 200,
    description: 'Returns recommended jobs based on user profile',
    type: PaginatedJobsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecommendedJobs(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedJobsResponseDto> {
    return this.jobsService.getRecommendedJobs(req.user.id, page, limit);
  }

  @Get('saved')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user\'s saved jobs' })
  @ApiResponse({
    status: 200,
    description: 'Returns user\'s saved jobs',
    type: PaginatedJobsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSavedJobs(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedJobsResponseDto> {
    return this.jobsService.getSavedJobs(req.user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns job details',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobById(
    @Param('id') id: string,
    @Request() req?: any,
  ): Promise<JobResponseDto> {
    const userId = req?.user?.id;
    return this.jobsService.getJobById(id, userId);
  }

  @Get(':id/match-score')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get match score between job and user resume' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns match score and reasons',
    schema: {
      properties: {
        match_score: { type: 'number', example: 85.5 },
        reasons: {
          type: 'array',
          items: { type: 'string' },
          example: ['Strong match in required skills', 'Experience level aligns well'],
        },
      },
    },
  })
  async getMatchScore(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ match_score: number; reasons: string[] }> {
    return this.jobsService.getMatchScore(id, req.user.id);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar jobs' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns similar jobs',
    type: [JobResponseDto],
  })
  async getSimilarJobs(
    @Param('id') id: string,
    @Query('limit') limit: number = 10,
  ): Promise<JobResponseDto[]> {
    return this.jobsService.getSimilarJobs(id, limit);
  }

  @Post(':id/save')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Save job to favorites' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 201, description: 'Job saved successfully' })
  @ApiResponse({ status: 400, description: 'Job already saved' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async saveJob(
    @Param('id') id: string,
    @Body() saveJobDto: SaveJobDto,
    @Request() req: any,
  ) {
    return this.jobsService.saveJob(req.user.id, id, saveJobDto);
  }

  @Delete(':id/save')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove job from favorites' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 204, description: 'Job removed from favorites' })
  @ApiResponse({ status: 404, description: 'Saved job not found' })
  async unsaveJob(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.jobsService.unsaveJob(req.user.id, id);
  }

  @Put(':id/save')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update saved job details' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Saved job updated successfully' })
  @ApiResponse({ status: 404, description: 'Saved job not found' })
  async updateSavedJob(
    @Param('id') id: string,
    @Body() updateDto: UpdateSavedJobDto,
    @Request() req: any,
  ) {
    return this.jobsService.updateSavedJob(req.user.id, id, updateDto);
  }

  @Post(':id/track-application')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track job application' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 204, description: 'Application tracked successfully' })
  async trackApplication(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.jobsService.trackApplication(id, req.user.id);
  }
}

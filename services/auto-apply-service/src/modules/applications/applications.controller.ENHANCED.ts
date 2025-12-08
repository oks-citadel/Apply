import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  BadRequestException,
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
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto, UpdateStatusDto } from './dto/update-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';

@ApiTags('Applications')
@ApiBearerAuth('JWT-auth')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  private extractUserId(headers: any): string {
    const userId = headers['x-user-id'];
    if (!userId) {
      throw new BadRequestException('User ID is required in headers');
    }
    return userId;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all applications',
    description: 'Retrieve all job applications for the authenticated user with optional filtering and pagination',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID extracted from JWT token',
    required: true,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'in_review', 'interview_scheduled', 'offer_received', 'accepted', 'rejected', 'withdrawn'],
    description: 'Filter by application status',
  })
  @ApiQuery({
    name: 'company_name',
    required: false,
    type: String,
    description: 'Filter by company name',
  })
  @ApiQuery({
    name: 'ats_platform',
    required: false,
    type: String,
    description: 'Filter by ATS platform (e.g., Greenhouse, Lever, Workday)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    type: String,
    description: 'Field to sort by (default: created_at)',
    example: 'created_at',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Applications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              user_id: { type: 'string', format: 'uuid' },
              job_id: { type: 'string', format: 'uuid' },
              status: { type: 'string' },
              company_name: { type: 'string' },
              position_title: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findAll(@Headers() headers: any, @Query() query: QueryApplicationDto) {
    const userId = this.extractUserId(headers);
    return await this.applicationsService.findAll(userId, query);
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get application analytics',
    description: 'Retrieve aggregated analytics data for user applications including status distribution, success rates, and trends',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID extracted from JWT token',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total_applications: { type: 'number', example: 45 },
        by_status: {
          type: 'object',
          properties: {
            pending: { type: 'number' },
            in_review: { type: 'number' },
            interview_scheduled: { type: 'number' },
            offer_received: { type: 'number' },
            accepted: { type: 'number' },
            rejected: { type: 'number' },
            withdrawn: { type: 'number' },
          },
        },
        auto_applied: { type: 'number', example: 30 },
        manual_applied: { type: 'number', example: 15 },
        average_match_score: { type: 'number', example: 78.5 },
        success_rate: { type: 'number', example: 6.7 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAnalytics(@Headers() headers: any) {
    const userId = this.extractUserId(headers);
    return await this.applicationsService.getAnalytics(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get application by ID',
    description: 'Retrieve a specific application by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Application UUID',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID extracted from JWT token',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Application retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' },
        job_id: { type: 'string', format: 'uuid' },
        resume_id: { type: 'string', format: 'uuid' },
        cover_letter_id: { type: 'string', format: 'uuid' },
        status: { type: 'string' },
        match_score: { type: 'number' },
        auto_applied: { type: 'boolean' },
        company_name: { type: 'string' },
        position_title: { type: 'string' },
        application_url: { type: 'string' },
        ats_platform: { type: 'string' },
        submitted_at: { type: 'string', format: 'date-time' },
        response_received_at: { type: 'string', format: 'date-time' },
        notes: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Application belongs to another user',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Application does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findOne(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.extractUserId(headers);
    return await this.applicationsService.findOne(id, userId);
  }

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Log manual application',
    description: 'Create a new manual job application record. Use this endpoint when tracking applications submitted outside the platform.',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID extracted from JWT token',
    required: true,
  })
  @ApiBody({
    type: CreateApplicationDto,
    description: 'Application details',
    examples: {
      basic: {
        summary: 'Basic application',
        value: {
          job_id: '550e8400-e29b-41d4-a716-446655440001',
          company_name: 'Tech Corp Inc.',
          position_title: 'Senior Software Engineer',
        },
      },
      complete: {
        summary: 'Complete application with all fields',
        value: {
          job_id: '550e8400-e29b-41d4-a716-446655440001',
          resume_id: '550e8400-e29b-41d4-a716-446655440002',
          cover_letter_id: '550e8400-e29b-41d4-a716-446655440003',
          match_score: 85.5,
          company_name: 'Tech Corp Inc.',
          position_title: 'Senior Software Engineer',
          application_url: 'https://jobs.techcorp.com/apply/12345',
          ats_platform: 'Greenhouse',
          notes: 'Applied via company website',
          form_responses: {
            availability: 'Immediately',
            salary_expectation: '$120,000',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Application created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' },
        job_id: { type: 'string', format: 'uuid' },
        status: { type: 'string', example: 'pending' },
        created_at: { type: 'string', format: 'date-time' },
        message: { type: 'string', example: 'Application logged successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Application already exists for this job',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async logManualApplication(
    @Body() createApplicationDto: CreateApplicationDto,
    @Headers() headers: any,
  ) {
    const userId = this.extractUserId(headers);
    createApplicationDto.user_id = userId;
    return await this.applicationsService.logManualApplication(createApplicationDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update application',
    description: 'Update an existing application with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Application UUID',
    type: String,
    format: 'uuid',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID extracted from JWT token',
    required: true,
  })
  @ApiBody({
    type: UpdateApplicationDto,
    examples: {
      statusUpdate: {
        summary: 'Update status and notes',
        value: {
          status: 'interview_scheduled',
          notes: 'Phone interview scheduled for next week',
          response_received_at: '2024-01-16T14:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Application updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot modify another user\'s application',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Application does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Headers() headers: any,
  ) {
    const userId = this.extractUserId(headers);
    return await this.applicationsService.update(id, userId, updateApplicationDto);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update application status',
    description: 'Update only the status of an application. Use this for quick status updates.',
  })
  @ApiParam({
    name: 'id',
    description: 'Application UUID',
    type: String,
    format: 'uuid',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID extracted from JWT token',
    required: true,
  })
  @ApiBody({
    type: UpdateStatusDto,
    examples: {
      rejected: {
        summary: 'Mark as rejected',
        value: {
          status: 'rejected',
          notes: 'Position filled',
        },
      },
      interview: {
        summary: 'Schedule interview',
        value: {
          status: 'interview_scheduled',
          notes: 'Technical interview on Friday',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid status value',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Application does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Headers() headers: any,
  ) {
    const userId = this.extractUserId(headers);
    return await this.applicationsService.updateStatus(id, userId, updateStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete application',
    description: 'Delete an application record. This is a soft delete and can be recovered within 30 days.',
  })
  @ApiParam({
    name: 'id',
    description: 'Application UUID',
    type: String,
    format: 'uuid',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID extracted from JWT token',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Application deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Application deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot delete another user\'s application',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Application does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async remove(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.extractUserId(headers);
    await this.applicationsService.remove(id, userId);
    return { message: 'Application deleted successfully' };
  }
}

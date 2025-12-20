import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
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

import { User } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApplicationsService } from './applications.service';

import type { CreateApplicationDto } from './dto/create-application.dto';
import type { QueryApplicationDto } from './dto/query-application.dto';
import type { UpdateApplicationDto, UpdateStatusDto } from './dto/update-application.dto';

@ApiTags('Applications')
@ApiBearerAuth('JWT-auth')
@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all applications',
    description: 'Retrieves all job applications for the authenticated user with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Applications retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@User('id') userId: string, @Query() query: QueryApplicationDto) {
    return await this.applicationsService.findAll(userId, query);
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get application analytics',
    description: 'Retrieves analytics and statistics about user applications including status breakdown, success rate, and trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalytics(@User('id') userId: string) {
    return await this.applicationsService.getAnalytics(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get application by ID',
    description: 'Retrieves a specific job application by its ID',
  })
  @ApiParam({ name: 'id', description: 'Application ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Application retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @User('id') userId: string) {
    return await this.applicationsService.findOne(id, userId);
  }

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Log manual application',
    description: 'Records a job application that was submitted manually (not through auto-apply)',
  })
  @ApiResponse({
    status: 201,
    description: 'Application logged successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logManualApplication(
    @Body() createApplicationDto: CreateApplicationDto,
    @User('id') userId: string,
  ) {
    createApplicationDto.user_id = userId;
    return await this.applicationsService.logManualApplication(createApplicationDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update application',
    description: 'Updates an existing job application with new information',
  })
  @ApiParam({ name: 'id', description: 'Application ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Application updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @User('id') userId: string,
  ) {
    return await this.applicationsService.update(id, userId, updateApplicationDto);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Update application status',
    description: 'Updates the status of a job application (e.g., applied, interviewing, offered, rejected)',
  })
  @ApiParam({ name: 'id', description: 'Application ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Application status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @User('id') userId: string,
  ) {
    return await this.applicationsService.updateStatus(id, userId, updateStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete application',
    description: 'Removes a job application from the system',
  })
  @ApiParam({ name: 'id', description: 'Application ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Application deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string, @User('id') userId: string) {
    await this.applicationsService.remove(id, userId);
    return { message: 'Application deleted successfully' };
  }
}

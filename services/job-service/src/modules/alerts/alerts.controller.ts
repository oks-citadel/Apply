import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';

import { JobAlert } from './entities/job-alert.entity';
import { JwtAuthGuard } from '../../common/guards';

import type { AlertsService } from './alerts.service';
import type { CreateAlertDto, UpdateAlertDto } from './dto/create-alert.dto';

@ApiTags('Alerts')
@Controller('jobs/alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create job alert' })
  @ApiResponse({
    status: 201,
    description: 'Alert created successfully',
    type: JobAlert,
  })
  async createAlert(
    @Body() createDto: CreateAlertDto,
    @Request() req: any,
  ): Promise<JobAlert> {
    return this.alertsService.createAlert(req.user.sub, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user\'s job alerts' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of user alerts',
    type: [JobAlert],
  })
  async getUserAlerts(@Request() req: any): Promise<JobAlert[]> {
    return this.alertsService.getUserAlerts(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns alert details',
    type: JobAlert,
  })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async getAlertById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<JobAlert> {
    return this.alertsService.getAlertById(id, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update job alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({
    status: 200,
    description: 'Alert updated successfully',
    type: JobAlert,
  })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async updateAlert(
    @Param('id') id: string,
    @Body() updateDto: UpdateAlertDto,
    @Request() req: any,
  ): Promise<JobAlert> {
    return this.alertsService.updateAlert(id, req.user.sub, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete job alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 204, description: 'Alert deleted successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async deleteAlert(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.alertsService.deleteAlert(id, req.user.sub);
  }

  @Get(':id/test')
  @ApiOperation({ summary: 'Test alert and preview matching jobs' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns preview of matching jobs',
  })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async testAlert(@Param('id') id: string, @Request() req: any) {
    return this.alertsService.testAlert(id, req.user.sub);
  }
}

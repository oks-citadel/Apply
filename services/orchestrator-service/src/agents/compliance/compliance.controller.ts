import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import {
  ComplianceCheckResponseDto,
  Platform,
  AuditLogEntryDto,
} from './dto/compliance.dto';
import { ComplianceService } from './compliance.service';

import type {
  ComplianceCheckRequestDto} from './dto/compliance.dto';

@ApiTags('compliance')
@ApiBearerAuth()
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check compliance for an action' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Compliance check result',
    type: ComplianceCheckResponseDto,
  })
  async checkCompliance(
    @Body() request: ComplianceCheckRequestDto,
  ): Promise<ComplianceCheckResponseDto> {
    return this.complianceService.checkCompliance(request);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get compliance history for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'platform', required: false, enum: Platform })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Compliance history',
    type: [AuditLogEntryDto],
  })
  async getComplianceHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('platform') platform?: string,
  ) {
    return this.complianceService.getUserComplianceHistory(userId, {
      limit,
      offset,
      platform,
    });
  }

  @Post('reset/:userId/:platform')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset rate limits for a user on a platform' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'platform', enum: Platform, description: 'Platform' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Rate limits reset',
  })
  async resetLimits(
    @Param('userId') userId: string,
    @Param('platform') platform: Platform,
  ): Promise<void> {
    await this.complianceService.resetUserLimits(userId, platform);
  }
}

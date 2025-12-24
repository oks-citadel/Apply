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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { GdprService } from './gdpr.service';
import {
  RequestDataExportDto,
  RequestDeletionDto,
  CancelGdprRequestDto,
  GdprRequestQueryDto,
} from './dto/gdpr-request.dto';
import {
  GdprRequestResponseDto,
  DataExportResponseDto,
  DeletionResponseDto,
  PaginatedGdprRequestsDto,
} from './dto/gdpr-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('gdpr')
@Controller('gdpr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  /**
   * Request a data export (GDPR Article 20 - Right to Data Portability)
   */
  @Post('export')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request data export',
    description: 'Request an export of all personal data associated with your account. Implements GDPR Article 20 (Right to Data Portability).',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Data export request created successfully',
    type: DataExportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A data export request is already pending',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT token required',
  })
  async requestDataExport(
    @CurrentUser() user: User,
    @Body() dto: RequestDataExportDto,
    @Req() request: Request,
  ): Promise<DataExportResponseDto> {
    const metadata = {
      ipAddress: this.extractIpAddress(request),
      userAgent: request.headers['user-agent'],
    };

    return this.gdprService.requestDataExport(user.id, dto, metadata);
  }

  /**
   * Request account deletion (GDPR Article 17 - Right to Erasure)
   */
  @Post('delete')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request account deletion',
    description: 'Request deletion of your account and all associated data. Implements GDPR Article 17 (Right to Erasure). A 30-day grace period applies during which you can cancel the request.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Account deletion request created successfully',
    type: DeletionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'An account deletion request is already pending',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid confirmation phrase',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT token required',
  })
  async requestDeletion(
    @CurrentUser() user: User,
    @Body() dto: RequestDeletionDto,
    @Req() request: Request,
  ): Promise<DeletionResponseDto> {
    const metadata = {
      ipAddress: this.extractIpAddress(request),
      userAgent: request.headers['user-agent'],
    };

    return this.gdprService.requestDeletion(user.id, dto, metadata);
  }

  /**
   * List user's GDPR requests with pagination
   */
  @Get('requests')
  @ApiOperation({
    summary: 'List GDPR requests',
    description: 'Retrieve a paginated list of your GDPR requests (data exports and deletion requests).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of GDPR requests retrieved successfully',
    type: PaginatedGdprRequestsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT token required',
  })
  async getRequests(
    @CurrentUser() user: User,
    @Query() query: GdprRequestQueryDto,
  ): Promise<PaginatedGdprRequestsDto> {
    return this.gdprService.getRequests(user.id, query);
  }

  /**
   * Get a specific GDPR request by ID
   */
  @Get('requests/:id')
  @ApiOperation({
    summary: 'Get GDPR request',
    description: 'Retrieve details of a specific GDPR request by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'GDPR request ID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GDPR request retrieved successfully',
    type: GdprRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GDPR request not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT token required',
  })
  async getRequest(
    @CurrentUser() user: User,
    @Param('id') requestId: string,
  ): Promise<GdprRequestResponseDto> {
    return this.gdprService.getRequest(user.id, requestId);
  }

  /**
   * Cancel a pending GDPR request
   */
  @Post('requests/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel GDPR request',
    description: 'Cancel a pending GDPR request. Only pending requests can be cancelled.',
  })
  @ApiParam({
    name: 'id',
    description: 'GDPR request ID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GDPR request cancelled successfully',
    type: GdprRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GDPR request not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Request cannot be cancelled (not in pending status)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT token required',
  })
  async cancelRequest(
    @CurrentUser() user: User,
    @Param('id') requestId: string,
    @Body() dto: CancelGdprRequestDto,
  ): Promise<GdprRequestResponseDto> {
    return this.gdprService.cancelRequest(user.id, requestId, dto);
  }

  /**
   * Extract IP address from request
   */
  private extractIpAddress(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}

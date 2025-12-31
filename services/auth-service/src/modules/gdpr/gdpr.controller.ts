import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  StreamableFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
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
   * Get user data export (GDPR Article 20 - Right to Data Portability)
   * This is a synchronous export that returns the data directly
   */
  @Get('export')
  @ApiOperation({
    summary: 'Export user data',
    description: 'Export all personal data associated with your account. Implements GDPR Article 20 (Right to Data Portability). Returns data in JSON format.',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'csv'],
    description: 'Export format (default: json)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT token required',
  })
  async exportUserData(
    @CurrentUser() user: User,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | any> {
    // Collect user data
    const userData = await this.gdprService.collectAndExportUserData(user.id);

    if (format === 'csv') {
      const csvData = this.gdprService.convertToCSV(userData);
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="gdpr-export-${user.id}-${Date.now()}.csv"`,
      });
      return csvData;
    }

    // Default JSON format
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="gdpr-export-${user.id}-${Date.now()}.json"`,
    });
    return userData;
  }

  /**
   * Request a data export (GDPR Article 20 - Right to Data Portability)
   * This is an asynchronous export that queues the request
   */
  @Post('export')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request data export (async)',
    description: 'Request an export of all personal data associated with your account. Implements GDPR Article 20 (Right to Data Portability). Use this for large datasets that require processing time.',
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
   * Delete user account and data (GDPR Article 17 - Right to Erasure)
   * This is the primary DELETE endpoint for account deletion
   */
  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user account',
    description: 'Delete your account and all associated data. Implements GDPR Article 17 (Right to Erasure). A 30-day grace period applies during which you can cancel the request.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
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
  async deleteAccount(
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
   * Request account deletion (GDPR Article 17 - Right to Erasure)
   * Alternative POST endpoint for systems that don't support DELETE with body
   */
  @Post('delete')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request account deletion (POST alternative)',
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
   * Request data anonymization (alternative to full deletion)
   */
  @Post('anonymize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Anonymize user data',
    description: 'Anonymize personal data while preserving data structure for analytics. This is an alternative to full deletion when you want to remove PII but keep anonymized records.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data anonymization completed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT token required',
  })
  async anonymizeData(
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; anonymizedFields: number; dataCategories: string[] }> {
    return this.gdprService.anonymizeUserData(user.id);
  }

  /**
   * Get data retention policies
   */
  @Get('retention-policies')
  @ApiOperation({
    summary: 'Get retention policies',
    description: 'Retrieve information about data retention policies and what data is kept for legal compliance.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retention policies retrieved successfully',
  })
  async getRetentionPolicies(): Promise<any[]> {
    return this.gdprService.getRetentionPolicies();
  }

  /**
   * Submit a privacy request (CCPA/CPRA Do Not Sell)
   * This endpoint handles privacy requests from the Do Not Sell page
   * It does not require authentication as it's for public access
   */
  @Post('privacy-request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit privacy request',
    description: 'Submit a privacy request (Do Not Sell, Right to Know, Right to Delete, etc.) as required by CCPA/CPRA.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Privacy request submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  async submitPrivacyRequest(
    @Body() dto: {
      firstName: string;
      lastName: string;
      email: string;
      state: string;
      requestType: 'do-not-sell' | 'know' | 'delete' | 'correct' | 'limit';
      additionalInfo?: string;
    },
    @Req() request: Request,
  ): Promise<{ success: boolean; requestId: string; message: string }> {
    const metadata = {
      ipAddress: this.extractIpAddress(request),
      userAgent: request.headers['user-agent'],
    };

    return this.gdprService.submitPrivacyRequest(dto, metadata);
  }

  /**
   * Download data export file
   * This endpoint handles the download of completed data exports
   */
  @Get('downloads/:exportId')
  @ApiOperation({
    summary: 'Download data export',
    description: 'Download a completed data export file. Requires a valid download token.',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID from the data export request',
    type: String,
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Download token for authentication',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export file downloaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export not found or expired',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired download token',
  })
  async downloadExport(
    @Param('exportId') exportId: string,
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | any> {
    // Verify the download token
    const verification = this.gdprService.verifyDownloadToken(token);

    if (!verification.valid) {
      if (verification.expired) {
        throw new BadRequestException('Download link has expired. Please request a new export.');
      }
      throw new BadRequestException('Invalid download token');
    }

    if (verification.exportId !== exportId) {
      throw new BadRequestException('Export ID mismatch');
    }

    // Retrieve the export data
    const exportData = await this.gdprService.retrieveExportData(exportId, verification.userId!);

    if (!exportData) {
      throw new NotFoundException('Export not found or has been deleted');
    }

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="gdpr-export-${exportId}.json"`,
    });

    return exportData;
  }

  /**
   * Get deletion certificate
   * Provides proof of data deletion for compliance purposes
   */
  @Get('requests/:id/certificate')
  @ApiOperation({
    summary: 'Get deletion certificate',
    description: 'Get a certificate proving that data deletion was completed. Only available for completed deletion requests.',
  })
  @ApiParam({
    name: 'id',
    description: 'GDPR request ID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deletion certificate retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GDPR request not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Deletion not yet completed',
  })
  async getDeletionCertificate(
    @CurrentUser() user: User,
    @Param('id') requestId: string,
  ): Promise<any> {
    return this.gdprService.getDeletionCertificate(user.id, requestId);
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

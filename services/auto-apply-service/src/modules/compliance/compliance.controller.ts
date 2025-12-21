import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceService, ComplianceRegion, DataPurpose, DataSubjectRequestType } from './compliance.service';

class RecordConsentDto {
  purpose: DataPurpose;
  granted: boolean;
}

class CreateDSRDto {
  type: DataSubjectRequestType;
}

@ApiTags('Compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('policy/:countryCode')
  @ApiOperation({ summary: 'Get compliance policy for a country' })
  @ApiResponse({ status: 200, description: 'Region policy returned' })
  getPolicy(@Param('countryCode') countryCode: string) {
    const region = this.complianceService.getComplianceRegion(countryCode);
    const policy = this.complianceService.getRegionPolicy(region);
    return { region, policy };
  }

  @Post('consent')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record user consent' })
  @ApiResponse({ status: 200, description: 'Consent recorded' })
  async recordConsent(
    @Body() dto: RecordConsentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'anonymous';
    const consent = await this.complianceService.recordConsent(
      userId,
      dto.purpose,
      dto.granted,
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    );
    return { success: true, consent };
  }

  @Delete('consent/:purpose')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw consent for a purpose' })
  @ApiResponse({ status: 200, description: 'Consent withdrawn' })
  async withdrawConsent(
    @Param('purpose') purpose: DataPurpose,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'anonymous';
    await this.complianceService.withdrawConsent(userId, purpose);
    return { success: true, message: `Consent for ${purpose} withdrawn` };
  }

  @Get('consent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user consents' })
  @ApiResponse({ status: 200, description: 'User consents returned' })
  getConsents(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const purposes = Object.values(DataPurpose);
    const consents = purposes.map(purpose => ({
      purpose,
      hasConsent: this.complianceService.hasValidConsent(userId, purpose),
    }));
    return { consents };
  }

  @Post('dsr')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Data Subject Request (GDPR/CCPA)' })
  @ApiResponse({ status: 201, description: 'DSR created' })
  async createDSR(
    @Body() dto: CreateDSRDto,
    @Query('region') regionCode: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'anonymous';
    const region = this.complianceService.getComplianceRegion(regionCode || 'US');
    const request = await this.complianceService.createDataSubjectRequest(userId, dto.type, region);
    return { success: true, request };
  }

  @Get('dsr/access')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process Access Request (GDPR Article 15)' })
  @ApiResponse({ status: 200, description: 'User data returned' })
  async processAccessRequest(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const data = await this.complianceService.processAccessRequest(userId);
    return { success: true, data };
  }

  @Post('dsr/erasure')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process Erasure Request (GDPR Article 17)' })
  @ApiResponse({ status: 200, description: 'Data erased' })
  async processErasureRequest(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const result = await this.complianceService.processErasureRequest(userId);
    return { success: true, ...result };
  }

  @Get('dsr/portability')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process Portability Request (GDPR Article 20)' })
  @ApiResponse({ status: 200, description: 'Portable data returned' })
  async processPortabilityRequest(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const result = await this.complianceService.processPortabilityRequest(userId);
    return { success: true, ...result };
  }

  @Get('report')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate compliance report for user' })
  @ApiResponse({ status: 200, description: 'Compliance report returned' })
  async getComplianceReport(
    @Query('region') regionCode: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'anonymous';
    const region = this.complianceService.getComplianceRegion(regionCode || 'US');
    const report = await this.complianceService.generateComplianceReport(userId, region);
    return { success: true, report };
  }

  @Get('audit-logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit logs for user' })
  @ApiResponse({ status: 200, description: 'Audit logs returned' })
  getAuditLogs(
    @Query('limit') limit: number = 100,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'anonymous';
    const logs = this.complianceService.getAuditLogs(userId, limit);
    return { success: true, logs };
  }

  @Post('verify-processing')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify data processing is allowed' })
  @ApiResponse({ status: 200, description: 'Processing verification result' })
  async verifyProcessing(
    @Body() body: { purpose: DataPurpose; region?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'anonymous';
    const region = this.complianceService.getComplianceRegion(body.region || 'US');
    const result = await this.complianceService.verifyDataProcessingAllowed(userId, body.purpose, region);
    return result;
  }

  @Post('sanitize-eeoc')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sanitize data for EEOC/ADA compliance' })
  @ApiResponse({ status: 200, description: 'Sanitized data returned' })
  sanitizeForEEOC(@Body() data: Record<string, any>) {
    const sanitized = this.complianceService.sanitizeForEEOCCompliance(data);
    return { sanitized };
  }

  @Post('minimize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply data minimization' })
  @ApiResponse({ status: 200, description: 'Minimized data returned' })
  minimizeData(
    @Body() body: { data: Record<string, any>; purpose: DataPurpose; region?: string },
  ) {
    const region = this.complianceService.getComplianceRegion(body.region || 'EU');
    const minimized = this.complianceService.applyDataMinimization(body.data, body.purpose, region);
    return { minimized };
  }

  @Get('transfer-check')
  @ApiOperation({ summary: 'Check cross-border data transfer compliance' })
  @ApiResponse({ status: 200, description: 'Transfer check result' })
  checkDataTransfer(
    @Query('source') sourceRegion: string,
    @Query('target') targetRegion: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'anonymous';
    const source = this.complianceService.getComplianceRegion(sourceRegion || 'US');
    const target = this.complianceService.getComplianceRegion(targetRegion || 'US');
    const result = this.complianceService.canTransferDataToPloaded(source, target, userId);
    return result;
  }
}

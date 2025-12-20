import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SLAService } from './services/sla.service';
import { EligibilityCheckerService } from './services/eligibility-checker.service';
import { ViolationHandlerService } from './services/violation-handler.service';
import {
  CreateSLAContractDto,
  UpdateSLAContractDto,
  ExtendSLAContractDto,
  TrackApplicationDto,
  TrackResponseDto,
  TrackInterviewDto,
  VerifyProgressDto,
  BulkTrackProgressDto,
  SLAStatusResponseDto,
  SLADashboardResponseDto,
  EligibilityCheckResponseDto,
  TrackProgressResponseDto,
  BulkTrackResponseDto,
  CreateSLAResponseDto,
  SLAViolationDetailDto,
  RemedyDetailDto,
} from './dto';
import { SLATier } from './enums/sla.enums';

/**
 * SLA Controller
 * REST API endpoints for SLA contract management
 */
@ApiTags('SLA')
@Controller('api/v1/sla')
export class SLAController {
  private readonly logger = new Logger(SLAController.name);

  constructor(
    private readonly slaService: SLAService,
    private readonly eligibilityChecker: EligibilityCheckerService,
    private readonly violationHandler: ViolationHandlerService,
  ) {}

  /**
   * Create new SLA contract
   */
  @Post('contracts')
  @ApiOperation({ summary: 'Create new SLA contract' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'SLA contract created successfully',
    type: CreateSLAResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or eligibility requirements not met',
  })
  async createContract(@Body() dto: CreateSLAContractDto): Promise<CreateSLAResponseDto> {
    this.logger.log(`POST /contracts - Creating contract for user ${dto.userId}`);
    return await this.slaService.createContract(dto);
  }

  /**
   * Get SLA status for user
   */
  @Get('status/:userId')
  @ApiOperation({ summary: 'Get SLA status for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SLA status retrieved successfully',
    type: SLAStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No active SLA contract found',
  })
  async getStatus(@Param('userId') userId: string): Promise<SLAStatusResponseDto> {
    this.logger.log(`GET /status/${userId} - Getting SLA status`);
    return await this.slaService.getStatus(userId);
  }

  /**
   * Get SLA dashboard data
   */
  @Get('dashboard/:userId')
  @ApiOperation({ summary: 'Get SLA dashboard data for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard data retrieved successfully',
    type: SLADashboardResponseDto,
  })
  async getDashboard(@Param('userId') userId: string): Promise<SLADashboardResponseDto> {
    this.logger.log(`GET /dashboard/${userId} - Getting dashboard data`);
    return await this.slaService.getDashboard(userId);
  }

  /**
   * Check eligibility for SLA tier
   */
  @Get('eligibility/:userId')
  @ApiOperation({ summary: 'Check user eligibility for SLA tier' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Eligibility check completed',
    type: EligibilityCheckResponseDto,
  })
  async checkEligibility(
    @Param('userId') userId: string,
    @Query('tier') tier: SLATier,
  ): Promise<EligibilityCheckResponseDto> {
    this.logger.log(`GET /eligibility/${userId}?tier=${tier} - Checking eligibility`);
    return await this.eligibilityChecker.checkEligibility(userId, tier);
  }

  /**
   * Track application sent
   */
  @Post('track-application')
  @ApiOperation({ summary: 'Track application sent' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Application tracked successfully',
    type: TrackProgressResponseDto,
  })
  async trackApplication(@Body() dto: TrackApplicationDto): Promise<TrackProgressResponseDto> {
    this.logger.log(`POST /track-application - Tracking application ${dto.applicationId}`);
    return await this.slaService.trackApplication(dto);
  }

  /**
   * Track employer response
   */
  @Post('track-response')
  @ApiOperation({ summary: 'Track employer response' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Response tracked successfully',
    type: TrackProgressResponseDto,
  })
  async trackResponse(@Body() dto: TrackResponseDto): Promise<TrackProgressResponseDto> {
    this.logger.log(`POST /track-response - Tracking response for ${dto.applicationId}`);
    return await this.slaService.trackResponse(dto);
  }

  /**
   * Track interview invitation
   */
  @Post('track-interview')
  @ApiOperation({ summary: 'Track interview invitation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Interview tracked successfully',
    type: TrackProgressResponseDto,
  })
  async trackInterview(@Body() dto: TrackInterviewDto): Promise<TrackProgressResponseDto> {
    this.logger.log(`POST /track-interview - Tracking interview for ${dto.applicationId}`);
    return await this.slaService.trackInterview(dto);
  }

  /**
   * Bulk track progress events
   */
  @Post('track-bulk')
  @ApiOperation({ summary: 'Bulk track progress events' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk tracking completed',
    type: BulkTrackResponseDto,
  })
  async bulkTrackProgress(@Body() dto: BulkTrackProgressDto): Promise<BulkTrackResponseDto> {
    this.logger.log(`POST /track-bulk - Bulk tracking progress events`);
    return await this.slaService.bulkTrackProgress(dto);
  }

  /**
   * Verify progress event
   */
  @Patch('verify-progress')
  @ApiOperation({ summary: 'Verify progress event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Progress event verified successfully',
  })
  async verifyProgress(@Body() dto: VerifyProgressDto) {
    this.logger.log(`PATCH /verify-progress - Verifying progress ${dto.progressId}`);
    return await this.slaService.verifyProgress(dto);
  }

  /**
   * Extend SLA contract
   */
  @Post('extend/:userId')
  @ApiOperation({ summary: 'Extend SLA contract' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contract extended successfully',
    type: SLAStatusResponseDto,
  })
  async extendContract(
    @Param('userId') userId: string,
    @Body() dto: ExtendSLAContractDto,
  ): Promise<SLAStatusResponseDto> {
    this.logger.log(`POST /extend/${userId} - Extending contract by ${dto.extensionDays} days`);
    return await this.slaService.extendContract(userId, dto);
  }

  /**
   * Get contract violations
   */
  @Get('violations/:userId')
  @ApiOperation({ summary: 'Get violations for user contract' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Violations retrieved successfully',
  })
  async getViolations(@Param('userId') userId: string) {
    this.logger.log(`GET /violations/${userId} - Getting violations`);
    const status = await this.slaService.getStatus(userId);
    return await this.violationHandler.getContractViolations(status.id);
  }

  /**
   * Get remedies for violation
   */
  @Get('remedies/:violationId')
  @ApiOperation({ summary: 'Get remedies for violation' })
  @ApiParam({ name: 'violationId', description: 'Violation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Remedies retrieved successfully',
  })
  async getRemedies(@Param('violationId') violationId: string) {
    this.logger.log(`GET /remedies/${violationId} - Getting remedies`);
    return await this.violationHandler.getViolationRemedies(violationId);
  }

  /**
   * Approve remedy (admin only)
   */
  @Post('remedies/:remedyId/approve')
  @ApiOperation({ summary: 'Approve remedy (admin only)' })
  @ApiParam({ name: 'remedyId', description: 'Remedy ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Remedy approved successfully',
  })
  async approveRemedy(
    @Param('remedyId') remedyId: string,
    @Body() body: { approvedBy: string; notes?: string },
  ) {
    this.logger.log(`POST /remedies/${remedyId}/approve - Approving remedy`);
    return await this.violationHandler.approveRemedy(remedyId, body.approvedBy, body.notes);
  }

  /**
   * Manually check for violations (admin only)
   */
  @Post('check-violations')
  @ApiOperation({ summary: 'Manually trigger violation check (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Violation check completed',
  })
  async checkViolations() {
    this.logger.log(`POST /check-violations - Manual violation check`);
    await this.slaService.checkViolations();
    return { success: true, message: 'Violation check completed' };
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
  })
  async health() {
    return {
      status: 'ok',
      service: 'sla-service',
      timestamp: new Date().toISOString(),
    };
  }
}

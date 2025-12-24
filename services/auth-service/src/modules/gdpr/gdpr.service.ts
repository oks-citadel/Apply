import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { GdprRequest, GdprRequestStatus, GdprRequestType } from './entities/gdpr-request.entity';
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
  UserDataExportDto,
} from './dto/gdpr-response.dto';
import { UsersService } from '../users/users.service';
import { UserStatus } from '../users/entities/user.entity';

/** Default grace period for deletion requests in days */
const DEFAULT_GRACE_PERIOD_DAYS = 30;

/** Default download expiry in hours */
const DEFAULT_DOWNLOAD_EXPIRY_HOURS = 72;

/** Default estimated completion time for exports in minutes */
const DEFAULT_EXPORT_COMPLETION_MINUTES = 15;

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    @InjectRepository(GdprRequest)
    private readonly gdprRequestRepository: Repository<GdprRequest>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Request a data export (GDPR Article 20 - Right to Data Portability)
   */
  async requestDataExport(
    userId: string,
    dto: RequestDataExportDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<DataExportResponseDto> {
    this.logger.log(`Data export requested by user: ${userId}`);

    // Check for existing pending export requests
    const existingRequest = await this.findPendingRequest(userId, GdprRequestType.DATA_EXPORT);
    if (existingRequest) {
      throw new ConflictException(
        'A data export request is already pending. Please wait for it to complete or cancel it first.',
      );
    }

    // Get user information
    const user = await this.usersService.findByIdOrFail(userId);

    // Create the GDPR request
    const request = this.gdprRequestRepository.create({
      userId,
      userEmail: user.email,
      type: GdprRequestType.DATA_EXPORT,
      status: GdprRequestStatus.PENDING,
      reason: dto.reason,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    const savedRequest = await this.gdprRequestRepository.save(request);
    this.logger.log(`Data export request created: ${savedRequest.id}`);

    return {
      requestId: savedRequest.id,
      message: 'Data export request submitted successfully. You will be notified when your data is ready for download.',
      estimatedCompletionMinutes: DEFAULT_EXPORT_COMPLETION_MINUTES,
    };
  }

  /**
   * Request account deletion (GDPR Article 17 - Right to Erasure)
   */
  async requestDeletion(
    userId: string,
    dto: RequestDeletionDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<DeletionResponseDto> {
    this.logger.log(`Account deletion requested by user: ${userId}`);

    // Check for existing pending deletion requests
    const existingRequest = await this.findPendingRequest(userId, GdprRequestType.ACCOUNT_DELETION);
    if (existingRequest) {
      throw new ConflictException(
        'An account deletion request is already pending. You can cancel it if you changed your mind.',
      );
    }

    // Validate confirmation phrase if provided
    if (dto.confirmationPhrase && dto.confirmationPhrase !== 'DELETE MY ACCOUNT') {
      throw new BadRequestException('Confirmation phrase does not match. Please enter "DELETE MY ACCOUNT".');
    }

    // Get user information
    const user = await this.usersService.findByIdOrFail(userId);

    // Calculate scheduled deletion date (after grace period)
    const scheduledDeletionDate = new Date();
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + DEFAULT_GRACE_PERIOD_DAYS);

    // Create the GDPR request
    const request = this.gdprRequestRepository.create({
      userId,
      userEmail: user.email,
      type: GdprRequestType.ACCOUNT_DELETION,
      status: GdprRequestStatus.PENDING,
      reason: dto.reason,
      scheduledDeletionDate,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    const savedRequest = await this.gdprRequestRepository.save(request);
    this.logger.log(`Account deletion request created: ${savedRequest.id}, scheduled for: ${scheduledDeletionDate.toISOString()}`);

    return {
      requestId: savedRequest.id,
      message: `Account deletion request submitted. Your account and data will be deleted after the ${DEFAULT_GRACE_PERIOD_DAYS}-day grace period unless you cancel the request.`,
      scheduledDeletionDate,
      gracePeriodDays: DEFAULT_GRACE_PERIOD_DAYS,
    };
  }

  /**
   * Get user's GDPR requests with pagination
   */
  async getRequests(userId: string, query: GdprRequestQueryDto): Promise<PaginatedGdprRequestsDto> {
    this.logger.debug(`Fetching GDPR requests for user: ${userId}`);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<GdprRequest> = { userId };
    if (query.type) {
      where.type = query.type;
    }

    const [requests, total] = await this.gdprRequestRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const items = requests.map((request) => this.mapToResponseDto(request));
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get a single GDPR request by ID
   */
  async getRequest(userId: string, requestId: string): Promise<GdprRequestResponseDto> {
    const request = await this.gdprRequestRepository.findOne({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException(`GDPR request with ID ${requestId} not found`);
    }

    return this.mapToResponseDto(request);
  }

  /**
   * Cancel a pending GDPR request
   */
  async cancelRequest(
    userId: string,
    requestId: string,
    dto: CancelGdprRequestDto,
  ): Promise<GdprRequestResponseDto> {
    this.logger.log(`Cancelling GDPR request: ${requestId} for user: ${userId}`);

    const request = await this.gdprRequestRepository.findOne({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException(`GDPR request with ID ${requestId} not found`);
    }

    if (request.status !== GdprRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel request with status '${request.status}'. Only pending requests can be cancelled.`,
      );
    }

    request.status = GdprRequestStatus.CANCELLED;
    request.processingDetails = {
      ...request.processingDetails,
      cancellationReason: dto.reason,
      cancelledAt: new Date().toISOString(),
    };

    const updatedRequest = await this.gdprRequestRepository.save(request);
    this.logger.log(`GDPR request cancelled: ${requestId}`);

    return this.mapToResponseDto(updatedRequest);
  }

  /**
   * Process a data export request
   * This method collects all user data and generates a downloadable file
   */
  async processExport(requestId: string): Promise<void> {
    this.logger.log(`Processing data export request: ${requestId}`);

    const request = await this.gdprRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`GDPR request with ID ${requestId} not found`);
    }

    if (request.type !== GdprRequestType.DATA_EXPORT) {
      throw new BadRequestException('This method is only for data export requests');
    }

    if (request.status !== GdprRequestStatus.PENDING) {
      throw new BadRequestException(`Cannot process request with status '${request.status}'`);
    }

    try {
      // Update status to processing
      request.status = GdprRequestStatus.PROCESSING;
      await this.gdprRequestRepository.save(request);

      // Collect user data
      const userData = await this.collectUserData(request.userId);

      // Generate download URL (in production, this would upload to secure storage)
      const downloadUrl = await this.generateExportDownloadUrl(request.userId, userData);

      // Calculate download expiry
      const downloadExpiry = new Date();
      downloadExpiry.setHours(downloadExpiry.getHours() + DEFAULT_DOWNLOAD_EXPIRY_HOURS);

      // Update request with download information
      request.status = GdprRequestStatus.COMPLETED;
      request.downloadUrl = downloadUrl;
      request.downloadExpiry = downloadExpiry;
      request.completedAt = new Date();
      request.processedServices = ['auth-service', 'user-profile'];

      await this.gdprRequestRepository.save(request);
      this.logger.log(`Data export completed: ${requestId}`);

    } catch (error) {
      this.logger.error(`Failed to process data export: ${requestId}`, error);

      request.status = GdprRequestStatus.FAILED;
      request.errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.gdprRequestRepository.save(request);

      throw error;
    }
  }

  /**
   * Process an account deletion request
   * This method soft deletes user data and schedules hard deletion
   */
  async processDeletion(requestId: string): Promise<void> {
    this.logger.log(`Processing account deletion request: ${requestId}`);

    const request = await this.gdprRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`GDPR request with ID ${requestId} not found`);
    }

    if (request.type !== GdprRequestType.ACCOUNT_DELETION) {
      throw new BadRequestException('This method is only for account deletion requests');
    }

    if (request.status !== GdprRequestStatus.PENDING) {
      throw new BadRequestException(`Cannot process request with status '${request.status}'`);
    }

    // Check if grace period has passed
    const now = new Date();
    if (request.scheduledDeletionDate && now < request.scheduledDeletionDate) {
      throw new BadRequestException(
        `Grace period has not ended. Deletion is scheduled for ${request.scheduledDeletionDate.toISOString()}`,
      );
    }

    try {
      // Update status to processing
      request.status = GdprRequestStatus.PROCESSING;
      await this.gdprRequestRepository.save(request);

      // Soft delete user data
      await this.softDeleteUserData(request.userId);

      // Record soft deletion time
      request.softDeletedAt = new Date();
      request.processedServices = ['auth-service'];

      await this.gdprRequestRepository.save(request);
      this.logger.log(`User data soft deleted: ${request.userId}`);

      // Schedule hard deletion (in production, this would be a background job)
      await this.scheduleHardDeletion(request);

      // Mark as completed
      request.status = GdprRequestStatus.COMPLETED;
      request.completedAt = new Date();
      await this.gdprRequestRepository.save(request);

      this.logger.log(`Account deletion completed: ${requestId}`);

    } catch (error) {
      this.logger.error(`Failed to process account deletion: ${requestId}`, error);

      request.status = GdprRequestStatus.FAILED;
      request.errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.gdprRequestRepository.save(request);

      throw error;
    }
  }

  /**
   * Find a pending request for a user and type
   */
  private async findPendingRequest(
    userId: string,
    type: GdprRequestType,
  ): Promise<GdprRequest | null> {
    return this.gdprRequestRepository.findOne({
      where: {
        userId,
        type,
        status: GdprRequestStatus.PENDING,
      },
    });
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(userId: string): Promise<UserDataExportDto> {
    this.logger.debug(`Collecting user data for export: ${userId}`);

    const user = await this.usersService.findByIdOrFail(userId);

    // Build the export data structure
    const exportData: UserDataExportDto = {
      metadata: {
        exportedAt: new Date(),
        userId: user.id,
        exportFormat: 'JSON',
        version: '1.0.0',
      },
      profile: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
        status: user.status,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
        isMfaEnabled: user.isMfaEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        metadata: user.metadata,
      },
      // In a real implementation, these would be fetched from other services
      resumes: [],
      applications: [],
      savedJobs: [],
      jobAlerts: [],
      preferences: {},
      activityLogs: [],
    };

    return exportData;
  }

  /**
   * Generate a download URL for the exported data
   * In production, this would upload to secure cloud storage (e.g., Azure Blob Storage)
   */
  private async generateExportDownloadUrl(
    userId: string,
    _data: UserDataExportDto,
  ): Promise<string> {
    this.logger.debug(`Generating export download URL for user: ${userId}`);

    // In production, this would:
    // 1. Serialize data to JSON
    // 2. Encrypt the data
    // 3. Upload to secure storage (Azure Blob, S3, etc.)
    // 4. Generate a signed URL with expiration

    // For now, return a placeholder URL
    const exportId = `export-${userId}-${Date.now()}`;
    return `/api/v1/gdpr/downloads/${exportId}`;
  }

  /**
   * Soft delete user data (anonymize but keep for audit purposes)
   */
  private async softDeleteUserData(userId: string): Promise<void> {
    this.logger.log(`Soft deleting user data: ${userId}`);

    const user = await this.usersService.findByIdOrFail(userId);

    // Anonymize user data while keeping the record for audit
    await this.usersService.update(userId, {
      email: `deleted-${user.id}@anonymized.local`,
      username: null,
      password: null,
      firstName: null,
      lastName: null,
      phoneNumber: null,
      profilePicture: null,
      status: UserStatus.INACTIVE,
      refreshToken: null,
      mfaSecret: null,
      metadata: { deletedAt: new Date().toISOString(), originalEmail: user.email },
    });

    this.logger.log(`User data anonymized: ${userId}`);
  }

  /**
   * Schedule hard deletion of user data
   * In production, this would create a background job
   */
  private async scheduleHardDeletion(request: GdprRequest): Promise<void> {
    this.logger.log(`Scheduling hard deletion for user: ${request.userId}`);

    // In production, this would:
    // 1. Create a scheduled job for hard deletion
    // 2. The job would run after a retention period (e.g., 30 days after soft delete)
    // 3. The job would permanently delete all user data

    // For now, just record the scheduling
    request.processingDetails = {
      ...request.processingDetails,
      hardDeletionScheduled: true,
      hardDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    await this.gdprRequestRepository.save(request);
  }

  /**
   * Map GdprRequest entity to response DTO
   */
  private mapToResponseDto(request: GdprRequest): GdprRequestResponseDto {
    return {
      id: request.id,
      userId: request.userId,
      type: request.type,
      status: request.status,
      reason: request.reason,
      downloadUrl: request.downloadUrl,
      downloadExpiry: request.downloadExpiry,
      scheduledDeletionDate: request.scheduledDeletionDate,
      processedServices: request.processedServices,
      createdAt: request.createdAt,
      completedAt: request.completedAt,
    };
  }
}

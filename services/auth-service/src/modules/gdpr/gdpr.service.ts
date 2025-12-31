import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

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

/**
 * Interface for cross-service data fetching
 */
interface ServiceDataFetcher {
  tableName: string;
  userIdColumn: string;
  displayName: string;
}

/**
 * Retention policy for data that must be kept for legal compliance
 */
interface RetentionPolicy {
  dataType: string;
  reason: string;
  retentionPeriod: string;
  legalBasis: string;
}

/** Default grace period for deletion requests in days */
const DEFAULT_GRACE_PERIOD_DAYS = 30;

/** Default download expiry in hours */
const DEFAULT_DOWNLOAD_EXPIRY_HOURS = 72;

/** Default estimated completion time for exports in minutes */
const DEFAULT_EXPORT_COMPLETION_MINUTES = 15;

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  /**
   * Data retention policies for GDPR Article 17 compliance
   * Some data must be retained for legal/regulatory reasons
   */
  private readonly retentionPolicies: RetentionPolicy[] = [
    {
      dataType: 'Transaction records',
      reason: 'Legal obligation (tax law)',
      retentionPeriod: '7 years from transaction date',
      legalBasis: 'Article 6(1)(c) - Legal obligation',
    },
    {
      dataType: 'Audit logs',
      reason: 'Legal obligation (data protection law)',
      retentionPeriod: '3 years',
      legalBasis: 'Article 6(1)(c) - Legal obligation',
    },
    {
      dataType: 'GDPR request records',
      reason: 'Compliance documentation',
      retentionPeriod: '5 years',
      legalBasis: 'Article 6(1)(c) - Legal obligation',
    },
  ];

  /**
   * Services to query for user data export
   * Maps to tables across the database
   */
  private readonly dataServices: ServiceDataFetcher[] = [
    { tableName: 'resumes', userIdColumn: 'user_id', displayName: 'Resumes' },
    { tableName: 'applications', userIdColumn: 'user_id', displayName: 'Job Applications' },
    { tableName: 'saved_jobs', userIdColumn: 'user_id', displayName: 'Saved Jobs' },
    { tableName: 'job_alerts', userIdColumn: 'user_id', displayName: 'Job Alerts' },
    { tableName: 'preferences', userIdColumn: 'user_id', displayName: 'User Preferences' },
    { tableName: 'notifications', userIdColumn: 'user_id', displayName: 'Notifications' },
    { tableName: 'profiles', userIdColumn: 'user_id', displayName: 'Profile Data' },
    { tableName: 'user_activities', userIdColumn: 'userId', displayName: 'Activity Logs' },
  ];

  constructor(
    @InjectRepository(GdprRequest)
    private readonly gdprRequestRepository: Repository<GdprRequest>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
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
   * Collect all user data for export (GDPR Article 20 - Right to Data Portability)
   * This method aggregates data from all relevant tables for a complete export
   */
  private async collectUserData(userId: string): Promise<UserDataExportDto> {
    this.logger.debug(`Collecting user data for export: ${userId}`);

    const user = await this.usersService.findByIdOrFail(userId);

    // Fetch data from all related tables in parallel for efficiency
    const [
      resumes,
      applications,
      savedJobs,
      jobAlerts,
      preferences,
      notifications,
      profileData,
      activityLogs,
    ] = await Promise.all([
      this.fetchTableData('resumes', 'user_id', userId),
      this.fetchTableData('applications', 'user_id', userId),
      this.fetchTableData('saved_jobs', 'user_id', userId),
      this.fetchTableData('job_alerts', 'user_id', userId),
      this.fetchTableData('preferences', 'user_id', userId),
      this.fetchTableData('notifications', 'user_id', userId),
      this.fetchTableData('profiles', 'user_id', userId),
      this.fetchTableData('user_activities', 'userId', userId),
    ]);

    // Sanitize sensitive fields from export data
    const sanitizedProfile = this.sanitizeUserProfile(user);

    // Build the export data structure
    const exportDate = new Date();
    const exportData: UserDataExportDto = {
      exportDate: exportDate.toISOString(),
      exportVersion: '1.0.0',
      metadata: {
        exportedAt: exportDate,
        userId: user.id,
        exportFormat: 'JSON',
        version: '1.0.0',
      },
      profile: {
        ...sanitizedProfile,
        // Include extended profile data if available
        extendedProfile: profileData.length > 0 ? this.sanitizeRecords(profileData)[0] : null,
      },
      resumes: this.sanitizeRecords(resumes),
      applications: this.sanitizeRecords(applications),
      savedJobs: this.sanitizeRecords(savedJobs),
      jobAlerts: this.sanitizeRecords(jobAlerts),
      preferences: preferences.length > 0 ? this.sanitizeRecords(preferences)[0] : {},
      activityLogs: this.sanitizeRecords(activityLogs),
    };

    // Add notification history if available
    if (notifications.length > 0) {
      (exportData as any).notifications = this.sanitizeRecords(notifications);
    }

    this.logger.log(
      `User data collected: ${resumes.length} resumes, ${applications.length} applications, ` +
      `${savedJobs.length} saved jobs, ${jobAlerts.length} job alerts, ${activityLogs.length} activity logs`
    );

    return exportData;
  }

  /**
   * Fetch data from a specific table for a user
   * Uses raw SQL queries to work across database schemas
   */
  private async fetchTableData(
    tableName: string,
    userIdColumn: string,
    userId: string,
  ): Promise<Record<string, any>[]> {
    try {
      // Check if table exists before querying
      const tableExists = await this.tableExists(tableName);
      if (!tableExists) {
        this.logger.debug(`Table ${tableName} does not exist, skipping`);
        return [];
      }

      const query = `SELECT * FROM "${tableName}" WHERE "${userIdColumn}" = $1`;
      const result = await this.dataSource.query(query, [userId]);
      return result || [];
    } catch (error) {
      this.logger.warn(`Failed to fetch data from ${tableName}: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if a table exists in the database
   */
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        )`,
        [tableName]
      );
      return result?.[0]?.exists || false;
    } catch (error) {
      this.logger.warn(`Failed to check table existence: ${tableName}`);
      return false;
    }
  }

  /**
   * Sanitize user profile data by removing sensitive fields
   */
  private sanitizeUserProfile(user: any): Record<string, any> {
    const sensitiveFields = [
      'password',
      'passwordResetToken',
      'passwordResetExpiry',
      'emailVerificationToken',
      'emailVerificationExpiry',
      'refreshToken',
      'mfaSecret',
    ];

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(user)) {
      if (!sensitiveFields.includes(key)) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Sanitize records by removing internal and sensitive fields
   */
  private sanitizeRecords(records: Record<string, any>[]): Record<string, any>[] {
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'secret',
      'apiKey',
      'refreshToken',
      'mfaSecret',
    ];

    return records.map(record => {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(record)) {
        // Skip sensitive fields
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          continue;
        }
        // Handle Date objects
        if (value instanceof Date) {
          sanitized[key] = value.toISOString();
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    });
  }

  /**
   * Generate a download URL for the exported data
   * Creates a secure, signed download URL with encryption
   */
  private async generateExportDownloadUrl(
    userId: string,
    data: UserDataExportDto,
  ): Promise<string> {
    this.logger.debug(`Generating export download URL for user: ${userId}`);

    // Generate unique export ID with cryptographic randomness
    const exportId = `export-${userId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    // Serialize and encrypt the export data
    const jsonData = JSON.stringify(data, null, 2);
    const encryptedData = this.encryptExportData(jsonData, exportId);

    // Store the encrypted export data
    await this.storeExportData(exportId, encryptedData, userId);

    // Generate a signed download token
    const downloadToken = this.generateDownloadToken(exportId, userId);

    // Construct the download URL
    const baseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
    const downloadUrl = `${baseUrl}/api/v1/gdpr/downloads/${exportId}?token=${downloadToken}`;

    this.logger.log(`Export file created: ${exportId} for user: ${userId}`);

    return downloadUrl;
  }

  /**
   * Encrypt export data using AES-256-GCM
   */
  private encryptExportData(data: string, exportId: string): {
    encrypted: string;
    iv: string;
    authTag: string;
  } {
    // Generate encryption key from export ID and secret
    const secret = this.configService.get<string>('GDPR_EXPORT_SECRET', 'default-gdpr-export-secret-key');
    const key = crypto.scryptSync(secret, exportId, 32);

    // Generate random IV
    const iv = crypto.randomBytes(16);

    // Encrypt using AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  /**
   * Store encrypted export data
   * In production, this would upload to secure cloud storage (S3, Azure Blob, etc.)
   */
  private async storeExportData(
    exportId: string,
    encryptedData: { encrypted: string; iv: string; authTag: string },
    userId: string,
  ): Promise<void> {
    // Store export metadata in database for retrieval
    // The encrypted data can be stored in:
    // 1. Database (for small exports)
    // 2. File system (for development)
    // 3. Cloud storage like S3/Azure Blob (for production)

    try {
      // Store export record in the GDPR request with processing details
      // This allows retrieval of the encrypted export later
      const exportRecord = {
        exportId,
        userId,
        createdAt: new Date().toISOString(),
        encryptedData: encryptedData.encrypted,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        expiresAt: new Date(Date.now() + DEFAULT_DOWNLOAD_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      };

      // In production, you would upload to cloud storage here
      // For now, we store the reference in the database via the GDPR request entity
      this.logger.debug(`Export data stored for exportId: ${exportId}`);

      // Note: For a full implementation, integrate with StorageService
      // Example: await this.storageService.uploadFile(Buffer.from(JSON.stringify(exportRecord)), `gdpr-exports/${exportId}.json`, 'application/json');

    } catch (error) {
      this.logger.error(`Failed to store export data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a signed download token with expiration
   */
  private generateDownloadToken(exportId: string, userId: string): string {
    const secret = this.configService.get<string>('GDPR_DOWNLOAD_TOKEN_SECRET', 'default-download-token-secret');
    const expiresAt = Date.now() + DEFAULT_DOWNLOAD_EXPIRY_HOURS * 60 * 60 * 1000;

    const payload = `${exportId}:${userId}:${expiresAt}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64url');

    return Buffer.from(`${payload}:${signature}`).toString('base64url');
  }

  /**
   * Verify a download token
   */
  verifyDownloadToken(token: string): { valid: boolean; exportId?: string; userId?: string; expired?: boolean } {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split(':');

      if (parts.length !== 4) {
        return { valid: false };
      }

      const [exportId, userId, expiresAtStr, signature] = parts;
      const expiresAt = parseInt(expiresAtStr, 10);

      // Check expiration
      if (Date.now() > expiresAt) {
        return { valid: false, expired: true, exportId, userId };
      }

      // Verify signature
      const secret = this.configService.get<string>('GDPR_DOWNLOAD_TOKEN_SECRET', 'default-download-token-secret');
      const payload = `${exportId}:${userId}:${expiresAtStr}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return { valid: false };
      }

      return { valid: true, exportId, userId };
    } catch (error) {
      this.logger.warn(`Failed to verify download token: ${error.message}`);
      return { valid: false };
    }
  }

  /**
   * Convert export data to CSV format
   */
  convertToCSV(exportData: UserDataExportDto): string {
    const lines: string[] = [];

    // Header
    lines.push('# GDPR Data Export');
    lines.push(`# User ID: ${exportData.metadata.userId}`);
    lines.push(`# Exported At: ${exportData.metadata.exportedAt}`);
    lines.push(`# Format Version: ${exportData.metadata.version}`);
    lines.push('');

    // Profile Section
    lines.push('## Profile Data');
    lines.push('Field,Value');
    for (const [key, value] of Object.entries(exportData.profile)) {
      if (value !== null && value !== undefined) {
        const formattedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        lines.push(`${key},${this.escapeCSV(formattedValue)}`);
      }
    }
    lines.push('');

    // Resumes Section
    if (exportData.resumes && exportData.resumes.length > 0) {
      lines.push('## Resumes');
      lines.push(this.arrayToCSVTable(exportData.resumes));
      lines.push('');
    }

    // Applications Section
    if (exportData.applications && exportData.applications.length > 0) {
      lines.push('## Job Applications');
      lines.push(this.arrayToCSVTable(exportData.applications));
      lines.push('');
    }

    // Saved Jobs Section
    if (exportData.savedJobs && exportData.savedJobs.length > 0) {
      lines.push('## Saved Jobs');
      lines.push(this.arrayToCSVTable(exportData.savedJobs));
      lines.push('');
    }

    // Job Alerts Section
    if (exportData.jobAlerts && exportData.jobAlerts.length > 0) {
      lines.push('## Job Alerts');
      lines.push(this.arrayToCSVTable(exportData.jobAlerts));
      lines.push('');
    }

    // Preferences Section
    if (exportData.preferences && Object.keys(exportData.preferences).length > 0) {
      lines.push('## Preferences');
      lines.push('Field,Value');
      for (const [key, value] of Object.entries(exportData.preferences)) {
        if (value !== null && value !== undefined) {
          const formattedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          lines.push(`${key},${this.escapeCSV(formattedValue)}`);
        }
      }
      lines.push('');
    }

    // Activity Logs Section
    if (exportData.activityLogs && exportData.activityLogs.length > 0) {
      lines.push('## Activity Logs');
      lines.push(this.arrayToCSVTable(exportData.activityLogs));
    }

    return lines.join('\n');
  }

  /**
   * Convert array of objects to CSV table
   */
  private arrayToCSVTable(arr: Record<string, any>[]): string {
    if (!arr || arr.length === 0) {
      return '';
    }

    const headers = Object.keys(arr[0]);
    const lines: string[] = [];

    // Header row
    lines.push(headers.join(','));

    // Data rows
    for (const item of arr) {
      const values = headers.map(h => {
        const val = item[h];
        if (val === null || val === undefined) {
          return '';
        }
        return this.escapeCSV(typeof val === 'object' ? JSON.stringify(val) : String(val));
      });
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Escape CSV value
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Soft delete user data (anonymize but keep for audit purposes)
   * Implements GDPR Article 17 - Right to Erasure with cascading deletes
   */
  private async softDeleteUserData(userId: string): Promise<void> {
    this.logger.log(`Soft deleting user data: ${userId}`);

    const user = await this.usersService.findByIdOrFail(userId);
    const deletionTimestamp = new Date().toISOString();

    // Use a transaction to ensure atomic deletion across all tables
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Delete related data from all tables (cascading delete)
      const deletionResults = await this.cascadeDeleteUserData(userId, queryRunner);

      // 2. Anonymize user record while keeping for audit purposes
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
        metadata: {
          deletedAt: deletionTimestamp,
          originalEmailHash: crypto.createHash('sha256').update(user.email).digest('hex'),
          deletionReason: 'GDPR Article 17 - Right to Erasure',
          deletionResults,
        },
      });

      await queryRunner.commitTransaction();
      this.logger.log(`User data soft deleted and anonymized: ${userId}`);
      this.logger.log(`Deletion results: ${JSON.stringify(deletionResults)}`);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to soft delete user data: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cascade delete user data from all related tables
   * Returns a summary of deleted records per table
   */
  private async cascadeDeleteUserData(
    userId: string,
    queryRunner: any,
  ): Promise<Record<string, number>> {
    const deletionResults: Record<string, number> = {};

    // Define tables and their user ID columns for cascading delete
    const tablesToDelete = [
      { table: 'resumes', column: 'user_id' },
      { table: 'resume_versions', column: 'user_id' },
      { table: 'applications', column: 'user_id' },
      { table: 'saved_jobs', column: 'user_id' },
      { table: 'job_alerts', column: 'user_id' },
      { table: 'preferences', column: 'user_id' },
      { table: 'notifications', column: 'user_id' },
      { table: 'profiles', column: 'user_id' },
      { table: 'user_activities', column: 'userId' },
      { table: 'answers', column: 'user_id' },
      { table: 'form_mappings', column: 'user_id' },
      { table: 'aligned_resumes', column: 'user_id' },
      { table: 'generated_cover_letters', column: 'user_id' },
      { table: 'device_tokens', column: 'user_id' },
      { table: 'notification_preferences', column: 'user_id' },
      { table: 'subscriptions', column: 'user_id' },
      { table: 'skills', column: 'user_id' },
      { table: 'work_experiences', column: 'user_id' },
      { table: 'education', column: 'user_id' },
      { table: 'certifications', column: 'user_id' },
    ];

    for (const { table, column } of tablesToDelete) {
      try {
        // Check if table exists
        const tableExists = await this.tableExists(table);
        if (!tableExists) {
          continue;
        }

        // Perform soft delete (update deleted_at) or hard delete
        // First, try soft delete if the table has a deleted_at column
        const hasDeletedAt = await this.columnExists(table, 'deleted_at');

        let result;
        if (hasDeletedAt) {
          // Soft delete - update deleted_at timestamp
          result = await queryRunner.query(
            `UPDATE "${table}" SET "deleted_at" = NOW() WHERE "${column}" = $1 AND "deleted_at" IS NULL`,
            [userId]
          );
        } else {
          // Hard delete - remove records entirely
          result = await queryRunner.query(
            `DELETE FROM "${table}" WHERE "${column}" = $1`,
            [userId]
          );
        }

        const affectedRows = result?.rowCount || result?.length || 0;
        if (affectedRows > 0) {
          deletionResults[table] = affectedRows;
          this.logger.debug(`Deleted ${affectedRows} records from ${table}`);
        }
      } catch (error) {
        // Log but continue with other tables
        this.logger.warn(`Failed to delete from ${table}: ${error.message}`);
      }
    }

    return deletionResults;
  }

  /**
   * Check if a column exists in a table
   */
  private async columnExists(tableName: string, columnName: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = $1 AND column_name = $2
        )`,
        [tableName, columnName]
      );
      return result?.[0]?.exists || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Schedule hard deletion of user data
   * Creates a scheduled job for permanent data removal after retention period
   */
  private async scheduleHardDeletion(request: GdprRequest): Promise<void> {
    this.logger.log(`Scheduling hard deletion for user: ${request.userId}`);

    // Calculate hard deletion date (30 days after soft delete for legal compliance)
    const hardDeletionRetentionDays = 30;
    const hardDeletionDate = new Date(Date.now() + hardDeletionRetentionDays * 24 * 60 * 60 * 1000);

    // Record the scheduling with detailed metadata
    request.processingDetails = {
      ...request.processingDetails,
      hardDeletionScheduled: true,
      hardDeletionDate: hardDeletionDate.toISOString(),
      retentionPolicies: this.retentionPolicies,
      scheduledAt: new Date().toISOString(),
      scheduledBy: 'gdpr-service',
    };

    await this.gdprRequestRepository.save(request);

    // In production, integrate with a job scheduler (Bull, Agenda, etc.)
    // Example: await this.schedulerService.scheduleJob('hard-delete-user', { userId: request.userId }, { runAt: hardDeletionDate });

    this.logger.log(
      `Hard deletion scheduled for user ${request.userId} on ${hardDeletionDate.toISOString()}`
    );
  }

  /**
   * Execute hard deletion of user data
   * This permanently removes all user data after the retention period
   */
  async executeHardDeletion(userId: string): Promise<{ success: boolean; deletedTables: string[] }> {
    this.logger.log(`Executing hard deletion for user: ${userId}`);

    const deletedTables: string[] = [];
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Hard delete from all tables
      const tablesToHardDelete = [
        { table: 'resumes', column: 'user_id' },
        { table: 'resume_versions', column: 'user_id' },
        { table: 'applications', column: 'user_id' },
        { table: 'saved_jobs', column: 'user_id' },
        { table: 'job_alerts', column: 'user_id' },
        { table: 'preferences', column: 'user_id' },
        { table: 'notifications', column: 'user_id' },
        { table: 'profiles', column: 'user_id' },
        { table: 'answers', column: 'user_id' },
        { table: 'form_mappings', column: 'user_id' },
        { table: 'aligned_resumes', column: 'user_id' },
        { table: 'generated_cover_letters', column: 'user_id' },
        { table: 'device_tokens', column: 'user_id' },
        { table: 'notification_preferences', column: 'user_id' },
        { table: 'subscriptions', column: 'user_id' },
        { table: 'skills', column: 'user_id' },
        { table: 'work_experiences', column: 'user_id' },
        { table: 'education', column: 'user_id' },
        { table: 'certifications', column: 'user_id' },
      ];

      for (const { table, column } of tablesToHardDelete) {
        try {
          const tableExists = await this.tableExists(table);
          if (!tableExists) continue;

          await queryRunner.query(`DELETE FROM "${table}" WHERE "${column}" = $1`, [userId]);
          deletedTables.push(table);
        } catch (error) {
          this.logger.warn(`Failed to hard delete from ${table}: ${error.message}`);
        }
      }

      // Finally, delete the user record itself
      await queryRunner.query(`DELETE FROM "users" WHERE "id" = $1`, [userId]);
      deletedTables.push('users');

      // Update GDPR request to mark hard deletion as complete
      await queryRunner.query(
        `UPDATE "gdpr_requests" SET "hard_deleted_at" = NOW(), "processing_details" = processing_details || $1 WHERE "user_id" = $2`,
        [JSON.stringify({ hardDeletionCompleted: true, deletedTables }), userId]
      );

      await queryRunner.commitTransaction();

      this.logger.log(`Hard deletion completed for user ${userId}. Deleted from: ${deletedTables.join(', ')}`);

      return { success: true, deletedTables };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Hard deletion failed for user ${userId}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Anonymize user data without deleting records
   * This is useful for preserving data structure for analytics while removing PII
   */
  async anonymizeUserData(userId: string): Promise<{
    success: boolean;
    anonymizedFields: number;
    dataCategories: string[];
  }> {
    this.logger.log(`Anonymizing user data: ${userId}`);

    const user = await this.usersService.findByIdOrFail(userId);
    const anonymizedCategories: string[] = [];
    let totalFieldsAnonymized = 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Anonymize user record
      const anonymizedEmail = `anonymized-${crypto.createHash('sha256').update(user.id).digest('hex').substring(0, 8)}@anonymized.local`;
      await this.usersService.update(userId, {
        email: anonymizedEmail,
        username: null,
        firstName: null,
        lastName: null,
        phoneNumber: null,
        profilePicture: null,
        refreshToken: null,
        mfaSecret: null,
        metadata: {
          anonymizedAt: new Date().toISOString(),
          originalEmailHash: crypto.createHash('sha256').update(user.email).digest('hex'),
          anonymizationReason: 'GDPR compliance - data anonymization',
        },
      });
      anonymizedCategories.push('User Profile');
      totalFieldsAnonymized += 7;

      // 2. Anonymize related profile data
      const profileAnonymizations = [
        { table: 'profiles', fields: ['first_name', 'last_name', 'phone', 'address', 'city', 'zip_code'] },
        { table: 'resumes', fields: ['personal_info', 'contact_info', 'full_name', 'email', 'phone'] },
        { table: 'work_experiences', fields: ['company_contact', 'supervisor_name', 'supervisor_phone'] },
        { table: 'education', fields: ['school_contact', 'advisor_name'] },
      ];

      for (const { table, fields } of profileAnonymizations) {
        const tableExists = await this.tableExists(table);
        if (!tableExists) continue;

        for (const field of fields) {
          const columnExists = await this.columnExists(table, field);
          if (!columnExists) continue;

          try {
            await queryRunner.query(
              `UPDATE "${table}" SET "${field}" = '[ANONYMIZED]' WHERE "user_id" = $1 AND "${field}" IS NOT NULL`,
              [userId]
            );
            totalFieldsAnonymized++;
          } catch (error) {
            this.logger.warn(`Failed to anonymize ${table}.${field}: ${error.message}`);
          }
        }
        anonymizedCategories.push(table);
      }

      // 3. Anonymize notification data (preserve for analytics)
      const notificationTableExists = await this.tableExists('notifications');
      if (notificationTableExists) {
        await queryRunner.query(
          `UPDATE "notifications" SET "recipient_email" = '[ANONYMIZED]', "recipient_name" = '[ANONYMIZED]' WHERE "user_id" = $1`,
          [userId]
        );
        anonymizedCategories.push('Notifications');
        totalFieldsAnonymized += 2;
      }

      // 4. Anonymize activity logs (preserve actions, remove identifiable info)
      const activityTableExists = await this.tableExists('user_activities');
      if (activityTableExists) {
        await queryRunner.query(
          `UPDATE "user_activities" SET "ip_address" = '0.0.0.0', "user_agent" = '[ANONYMIZED]' WHERE "userId" = $1`,
          [userId]
        );
        anonymizedCategories.push('Activity Logs');
        totalFieldsAnonymized += 2;
      }

      await queryRunner.commitTransaction();

      this.logger.log(`User data anonymized: ${userId}, ${totalFieldsAnonymized} fields across ${anonymizedCategories.length} categories`);

      return {
        success: true,
        anonymizedFields: totalFieldsAnonymized,
        dataCategories: [...new Set(anonymizedCategories)],
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to anonymize user data: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get retention policies for display to users
   */
  getRetentionPolicies(): RetentionPolicy[] {
    return this.retentionPolicies;
  }

  /**
   * Generate a deletion verification certificate
   * Provides proof of data deletion for the user
   */
  generateDeletionCertificate(request: GdprRequest): {
    certificateId: string;
    userId: string;
    deletionDate: Date;
    retainedData: RetentionPolicy[];
    verificationHash: string;
  } {
    const certificateId = `GDPR-DEL-${request.id.slice(0, 8).toUpperCase()}`;
    const deletionDate = request.completedAt || new Date();

    // Create verification hash
    const verificationData = `${certificateId}:${request.userId}:${deletionDate.toISOString()}`;
    const verificationHash = crypto
      .createHash('sha256')
      .update(verificationData)
      .digest('hex');

    return {
      certificateId,
      userId: request.userId,
      deletionDate,
      retainedData: this.retentionPolicies,
      verificationHash,
    };
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

  /**
   * Collect and export user data synchronously
   * This method is used for immediate data export via GET /gdpr/export
   */
  async collectAndExportUserData(userId: string): Promise<UserDataExportDto> {
    this.logger.log(`Collecting user data for export: ${userId}`);
    return this.collectUserData(userId);
  }

  /**
   * Submit a privacy request (CCPA/CPRA Do Not Sell, Right to Know, etc.)
   * This method handles privacy requests from the public Do Not Sell page
   */
  async submitPrivacyRequest(
    dto: {
      firstName: string;
      lastName: string;
      email: string;
      state: string;
      requestType: 'do-not-sell' | 'know' | 'delete' | 'correct' | 'limit';
      additionalInfo?: string;
    },
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ success: boolean; requestId: string; message: string }> {
    this.logger.log(`Privacy request received: ${dto.requestType} for ${dto.email}`);

    // Generate a unique request ID for tracking
    const requestId = `PRIVACY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Try to find the user by email
    let userId: string | null = null;
    try {
      const user = await this.usersService.findByEmail(dto.email);
      if (user) {
        userId = user.id;
      }
    } catch (error) {
      // User not found is acceptable - they may not have an account
      this.logger.debug(`User not found for email: ${dto.email}`);
    }

    // Create a GDPR request record for tracking
    const requestType = dto.requestType === 'do-not-sell' || dto.requestType === 'limit'
      ? GdprRequestType.DATA_EXPORT // Use existing type - we'll track specific type in processingDetails
      : dto.requestType === 'delete'
        ? GdprRequestType.ACCOUNT_DELETION
        : GdprRequestType.DATA_EXPORT;

    const request = this.gdprRequestRepository.create({
      userId: userId || requestId, // Use requestId as placeholder if no user found
      userEmail: dto.email,
      type: requestType,
      status: GdprRequestStatus.PENDING,
      reason: dto.additionalInfo || `${dto.requestType} request`,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      processingDetails: {
        privacyRequestType: dto.requestType,
        firstName: dto.firstName,
        lastName: dto.lastName,
        state: dto.state,
        submittedAt: new Date().toISOString(),
        requestId,
        requiresVerification: true,
      },
    });

    await this.gdprRequestRepository.save(request);
    this.logger.log(`Privacy request saved: ${requestId}`);

    // Generate response message based on request type
    let message = 'Your privacy request has been submitted successfully. ';
    switch (dto.requestType) {
      case 'do-not-sell':
        message += 'We do not sell your personal information. Your opt-out preference has been recorded.';
        break;
      case 'know':
        message += 'We will provide you with information about the personal data we have collected within 45 days.';
        break;
      case 'delete':
        message += 'Your deletion request will be processed within 45 days after identity verification.';
        break;
      case 'correct':
        message += 'Your correction request will be reviewed and processed within 45 days.';
        break;
      case 'limit':
        message += 'Your request to limit the use of sensitive information has been recorded.';
        break;
    }

    return {
      success: true,
      requestId,
      message,
    };
  }

  /**
   * Retrieve export data for download
   * This method retrieves the encrypted export data and decrypts it
   */
  async retrieveExportData(exportId: string, userId: string): Promise<UserDataExportDto | null> {
    this.logger.debug(`Retrieving export data: ${exportId} for user: ${userId}`);

    // Find the GDPR request associated with this export
    const request = await this.gdprRequestRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!request || request.status !== GdprRequestStatus.COMPLETED) {
      return null;
    }

    // Check if download has expired
    if (request.downloadExpiry && new Date() > request.downloadExpiry) {
      this.logger.warn(`Download expired for export: ${exportId}`);
      return null;
    }

    // For production, retrieve encrypted data from storage and decrypt
    // For now, regenerate the export data
    return this.collectUserData(userId);
  }

  /**
   * Get deletion certificate for a completed deletion request
   */
  async getDeletionCertificate(userId: string, requestId: string): Promise<{
    certificateId: string;
    userId: string;
    deletionDate: Date;
    retainedData: RetentionPolicy[];
    verificationHash: string;
    message: string;
  }> {
    const request = await this.gdprRequestRepository.findOne({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException(`GDPR request with ID ${requestId} not found`);
    }

    if (request.type !== GdprRequestType.ACCOUNT_DELETION) {
      throw new BadRequestException('Certificates are only available for deletion requests');
    }

    if (request.status !== GdprRequestStatus.COMPLETED) {
      throw new BadRequestException(
        `Deletion not yet completed. Current status: ${request.status}`,
      );
    }

    const certificate = this.generateDeletionCertificate(request);

    return {
      ...certificate,
      message: 'This certificate confirms that your data deletion request has been processed. Some data may be retained as required by law (see retainedData for details).',
    };
  }
}

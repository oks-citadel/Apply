import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Inject, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

import type { Readable } from 'stream';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size?: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly profilePhotosPrefix: string;
  private readonly resumesPrefix: string;
  private readonly maxFileSize: number;
  private readonly allowedImageTypes: string[];

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET', 'job-apply-platform-user-uploads');
    this.profilePhotosPrefix = this.configService.get<string>('AWS_S3_PROFILE_PHOTOS_PREFIX', 'profile-photos/');
    this.resumesPrefix = this.configService.get<string>('AWS_S3_RESUMES_PREFIX', 'resumes/');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 5242880); // 5MB default
    this.allowedImageTypes = this.configService.get<string>('ALLOWED_IMAGE_TYPES', 'image/jpeg,image/png,image/webp').split(',');

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn('AWS credentials not configured. Storage service will not function properly.');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: accessKeyId && secretAccessKey ? {
        accessKeyId,
        secretAccessKey,
      } : undefined,
    });

    this.logger.log(`StorageService initialized with bucket: ${this.bucketName} in region: ${this.region}`);
  }

  /**
   * Upload a file to S3
   * @param file - File buffer to upload
   * @param key - S3 object key (path)
   * @param contentType - MIME type of the file
   * @param options - Additional upload options
   * @returns URL of the uploaded file
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
    options?: UploadOptions,
  ): Promise<string> {
    try {
      if (!file || file.length === 0) {
        throw new BadRequestException('File is empty or invalid');
      }

      if (file.length > this.maxFileSize) {
        throw new BadRequestException(
          `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
        );
      }

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType || 'application/octet-stream',
        Metadata: options?.metadata || {},
        ACL: options?.acl as any || 'private',
      };

      this.logger.debug(`Uploading file to S3: ${key}`);

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully: ${key}`);
      return fileUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }

  /**
   * Download a file from S3
   * @param key - S3 object key (path)
   * @returns File buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      this.logger.debug(`Downloading file from S3: ${key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new InternalServerErrorException('File body is empty');
      }

      // Convert stream to buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      this.logger.error(`Failed to download file from S3: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to download file from storage');
    }
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key (path) or full URL
   */
  async deleteFile(key: string): Promise<void> {
    try {
      // Extract key from URL if a full URL is provided
      const fileKey = this.extractKeyFromUrl(key);

      this.logger.debug(`Deleting file from S3: ${fileKey}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully: ${fileKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete file from storage');
    }
  }

  /**
   * Get a signed URL for temporary access to a private file
   * @param key - S3 object key (path)
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      this.logger.debug(`Generating signed URL for: ${key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  /**
   * Upload a profile picture with validation and optimization
   * @param userId - User ID
   * @param file - File buffer
   * @param mimeType - MIME type of the image
   * @returns URL of the uploaded profile picture
   */
  async uploadProfilePicture(userId: string, file: Buffer, mimeType: string): Promise<string> {
    try {
      // Validate image type
      if (!this.allowedImageTypes.includes(mimeType)) {
        throw new BadRequestException(
          `Invalid image type. Allowed types: ${this.allowedImageTypes.join(', ')}`,
        );
      }

      // Validate file size
      if (file.length > this.maxFileSize) {
        throw new BadRequestException(
          `Image size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
        );
      }

      // Generate unique key for the profile picture
      const fileExtension = this.getFileExtension(mimeType);
      const fileName = `${userId}-${uuidv4()}.${fileExtension}`;
      const key = `${this.profilePhotosPrefix}${fileName}`;

      // Optional: Optimize/resize image here using sharp if installed
      let processedFile = file;
      try {
        // Try to use sharp for image optimization if available
        const sharp = require('sharp');

        this.logger.debug('Optimizing image with sharp');
        processedFile = await sharp(file)
          .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        this.logger.debug(`Image optimized: ${file.length} -> ${processedFile.length} bytes`);
      } catch (error) {
        // Sharp not available or optimization failed, use original file
        this.logger.debug('Sharp not available or optimization failed, using original image');
        processedFile = file;
      }

      // Upload to S3
      const url = await this.uploadFile(processedFile, key, mimeType, {
        metadata: {
          userId,
          type: 'profile-picture',
          uploadedAt: new Date().toISOString(),
        },
        acl: 'public-read', // Make profile pictures publicly accessible
      });

      return url;
    } catch (error) {
      this.logger.error(`Failed to upload profile picture: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to upload profile picture');
    }
  }

  /**
   * Upload a resume document
   * @param userId - User ID
   * @param file - File buffer
   * @param mimeType - MIME type of the document
   * @param fileName - Original file name
   * @returns Upload result with key and URL
   */
  async uploadResume(
    userId: string,
    file: Buffer,
    mimeType: string,
    fileName: string,
  ): Promise<UploadResult> {
    try {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

      if (!allowedTypes.includes(mimeType)) {
        throw new BadRequestException(
          'Invalid document type. Allowed types: PDF, DOC, DOCX',
        );
      }

      // Generate unique key for the resume
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${userId}-${uuidv4()}.${fileExtension}`;
      const key = `${this.resumesPrefix}${uniqueFileName}`;

      // Upload to S3
      const url = await this.uploadFile(file, key, mimeType, {
        metadata: {
          userId,
          type: 'resume',
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
        },
        acl: 'private', // Keep resumes private
      });

      return {
        key,
        url,
        bucket: this.bucketName,
        size: file.length,
      };
    } catch (error) {
      this.logger.error(`Failed to upload resume: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to upload resume');
    }
  }

  /**
   * Check if a file exists in S3
   * @param key - S3 object key (path)
   * @returns True if file exists, false otherwise
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   * @param key - S3 object key (path)
   * @returns File metadata
   */
  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata: Record<string, string>;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        metadata: response.Metadata || {},
      };
    } catch (error) {
      this.logger.error(`Failed to get file metadata: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get file metadata');
    }
  }

  /**
   * Extract S3 key from a full URL
   * @param urlOrKey - Full S3 URL or just the key
   * @returns S3 key
   */
  private extractKeyFromUrl(urlOrKey: string): string {
    if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
      // Extract key from URL
      const url = new URL(urlOrKey);
      // Remove leading slash
      return url.pathname.substring(1);
    }
    return urlOrKey;
  }

  /**
   * Get file extension from MIME type
   * @param mimeType - MIME type
   * @returns File extension
   */
  private getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };

    return mimeToExt[mimeType] || 'bin';
  }
}

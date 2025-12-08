import { registerAs } from '@nestjs/config';

export interface StorageConfig {
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3: {
      bucket: string;
      profilePhotosPrefix: string;
      resumesPrefix: string;
    };
  };
  upload: {
    maxFileSize: number;
    allowedImageTypes: string[];
    allowedDocumentTypes: string[];
  };
}

export default registerAs('storage', (): StorageConfig => ({
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'job-apply-platform-user-uploads',
      profilePhotosPrefix: process.env.AWS_S3_PROFILE_PHOTOS_PREFIX || 'profile-photos/',
      resumesPrefix: process.env.AWS_S3_RESUMES_PREFIX || 'resumes/',
    },
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
    allowedDocumentTypes: (
      process.env.ALLOWED_DOCUMENT_TYPES ||
      'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ).split(','),
  },
}));

# StorageService Implementation

This module provides a comprehensive AWS S3 storage service for the Job-Apply-Platform user service.

## Features

- **File Upload**: Upload files to AWS S3 with customizable options
- **File Download**: Download files from S3
- **File Delete**: Delete files from S3
- **Signed URLs**: Generate temporary signed URLs for private file access
- **Profile Picture Upload**: Specialized method with image validation and optimization
- **Resume Upload**: Specialized method for document uploads
- **File Metadata**: Retrieve file information and metadata
- **File Existence Check**: Check if a file exists in S3

## Installation

The required dependencies are already included in the `package.json`:

```json
{
  "@aws-sdk/client-s3": "^3.476.0",
  "@aws-sdk/s3-request-presigner": "^3.476.0",
  "uuid": "^9.0.1"
}
```

### Optional: Image Optimization

For image optimization support, install Sharp:

```bash
npm install sharp
```

If Sharp is not installed, the service will still work but skip image optimization.

## Configuration

Add the following environment variables to your `.env` file:

```env
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=job-apply-platform-user-uploads
AWS_S3_PROFILE_PHOTOS_PREFIX=profile-photos/
AWS_S3_RESUMES_PREFIX=resumes/

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
ALLOWED_DOCUMENT_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

## Usage

### Import the Module

The StorageModule is a global module and can be injected anywhere in your application:

```typescript
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [StorageModule],
  // ...
})
export class YourModule {}
```

### Inject the Service

```typescript
import { StorageService } from '../storage/storage.service';

@Injectable()
export class YourService {
  constructor(private readonly storageService: StorageService) {}
}
```

## Methods

### uploadFile(file, key, contentType, options?)

Upload a file to S3.

```typescript
const url = await this.storageService.uploadFile(
  fileBuffer,
  'path/to/file.jpg',
  'image/jpeg',
  {
    acl: 'public-read',
    metadata: { userId: '123' }
  }
);
```

### downloadFile(key)

Download a file from S3.

```typescript
const buffer = await this.storageService.downloadFile('path/to/file.jpg');
```

### deleteFile(key)

Delete a file from S3. Accepts either a key or full URL.

```typescript
await this.storageService.deleteFile('path/to/file.jpg');
// or
await this.storageService.deleteFile('https://bucket.s3.region.amazonaws.com/path/to/file.jpg');
```

### getSignedUrl(key, expiresIn?)

Generate a temporary signed URL for private file access.

```typescript
const signedUrl = await this.storageService.getSignedUrl(
  'path/to/file.jpg',
  3600 // expires in 1 hour
);
```

### uploadProfilePicture(userId, file, mimeType)

Upload a profile picture with validation and optimization.

```typescript
const url = await this.storageService.uploadProfilePicture(
  'user-123',
  fileBuffer,
  'image/jpeg'
);
```

**Features:**
- Validates image type against allowed types
- Checks file size limits
- Optimizes image (resize to 800x800, compress to 85% quality) if Sharp is available
- Generates unique filename with UUID
- Sets ACL to public-read
- Adds metadata (userId, type, uploadedAt)

### uploadResume(userId, file, mimeType, fileName)

Upload a resume document with validation.

```typescript
const result = await this.storageService.uploadResume(
  'user-123',
  fileBuffer,
  'application/pdf',
  'my-resume.pdf'
);

// Returns: { key, url, bucket, size }
```

**Features:**
- Validates document type (PDF, DOC, DOCX)
- Generates unique filename with UUID
- Sets ACL to private
- Adds metadata (userId, type, originalName, uploadedAt)

### fileExists(key)

Check if a file exists in S3.

```typescript
const exists = await this.storageService.fileExists('path/to/file.jpg');
```

### getFileMetadata(key)

Get file metadata from S3.

```typescript
const metadata = await this.storageService.getFileMetadata('path/to/file.jpg');
// Returns: { size, contentType, lastModified, metadata }
```

## Error Handling

The service includes comprehensive error handling with custom exceptions:

- `StorageException`: Base exception for storage errors
- `FileUploadException`: Failed to upload file
- `FileDownloadException`: Failed to download file
- `FileDeleteException`: Failed to delete file
- `FileNotFoundException`: File not found
- `InvalidFileTypeException`: Invalid file type
- `FileSizeExceededException`: File size exceeds limit
- `StorageConfigurationException`: Storage service not configured

All exceptions include detailed error messages and appropriate HTTP status codes.

## Security

- **Private Files**: Files are private by default (ACL: 'private')
- **Public Files**: Profile pictures are set to 'public-read'
- **Signed URLs**: Use signed URLs for temporary access to private files
- **File Validation**: Validates file types and sizes before upload
- **Unique Filenames**: Uses UUIDs to prevent filename collisions

## Profile Service Integration

The StorageService is already integrated with the ProfileService:

```typescript
// Upload profile photo
const result = await profileService.uploadProfilePhoto(userId, file);

// Delete profile photo
await profileService.deleteProfilePhoto(userId);
```

## Testing

To test the StorageService:

1. **Setup AWS credentials**: Add your AWS credentials to `.env`
2. **Create S3 bucket**: Create the bucket specified in `AWS_S3_BUCKET`
3. **Configure CORS** (if accessing from browser):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

4. **Test file upload**:

```bash
curl -X POST http://localhost:8002/api/v1/profile/photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/image.jpg"
```

## Image Optimization with Sharp

If Sharp is installed, profile pictures are automatically optimized:

- **Resize**: Maximum 800x800 pixels (maintains aspect ratio)
- **Format**: Converts to JPEG
- **Quality**: 85% compression
- **Size reduction**: Typically 50-80% smaller files

To install Sharp:

```bash
npm install sharp
```

## AWS S3 Bucket Setup

1. **Create S3 bucket** in AWS Console
2. **Set bucket policy** for public access (if needed)
3. **Configure bucket lifecycle rules** (optional, for automatic cleanup)
4. **Enable versioning** (optional, for file history)
5. **Configure IAM user** with S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

## File Structure

```
storage/
├── README.md                       # This file
├── storage.module.ts              # Module definition
├── storage.service.ts             # Main service implementation
├── index.ts                       # Barrel export
├── config/
│   └── storage.config.ts          # Configuration provider
├── dto/
│   ├── upload-file.dto.ts         # Upload file DTO
│   ├── upload-result.dto.ts       # Upload result DTO
│   └── index.ts                   # DTO barrel export
└── exceptions/
    ├── storage.exception.ts       # Custom exceptions
    └── index.ts                   # Exception barrel export
```

## Best Practices

1. **Use unique filenames**: The service automatically generates UUIDs
2. **Set appropriate ACLs**: Use 'private' for sensitive files, 'public-read' for public assets
3. **Add metadata**: Include useful metadata for tracking and debugging
4. **Handle errors**: Wrap storage calls in try-catch blocks
5. **Use signed URLs**: For temporary access to private files
6. **Optimize images**: Install Sharp for automatic image optimization
7. **Clean up old files**: Implement lifecycle rules or cleanup jobs
8. **Monitor costs**: Track S3 usage and costs in AWS Console

## Future Enhancements

- [ ] Multi-part upload for large files
- [ ] Progress tracking for uploads/downloads
- [ ] Image thumbnail generation
- [ ] CDN integration (CloudFront)
- [ ] File compression for documents
- [ ] Virus scanning integration
- [ ] Storage analytics and reporting
- [ ] Backup and disaster recovery

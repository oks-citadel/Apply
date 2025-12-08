# StorageService Quick Reference

## Quick Start

```typescript
import { StorageService } from '../storage/storage.service';

@Injectable()
export class YourService {
  constructor(private readonly storageService: StorageService) {}
}
```

## Common Operations

### Upload Profile Picture

```typescript
const url = await this.storageService.uploadProfilePicture(
  userId,
  file.buffer,
  file.mimetype
);
```

### Upload Resume

```typescript
const result = await this.storageService.uploadResume(
  userId,
  file.buffer,
  file.mimetype,
  file.originalname
);
console.log(result.url); // S3 URL
```

### Generic File Upload

```typescript
const url = await this.storageService.uploadFile(
  fileBuffer,
  'custom-folder/filename.ext',
  'image/jpeg',
  {
    acl: 'public-read',
    metadata: { userId: '123' }
  }
);
```

### Delete File

```typescript
// Using URL
await this.storageService.deleteFile(
  'https://bucket.s3.region.amazonaws.com/path/to/file.jpg'
);

// Using key
await this.storageService.deleteFile('path/to/file.jpg');
```

### Download File

```typescript
const buffer = await this.storageService.downloadFile('path/to/file.jpg');
```

### Generate Signed URL

```typescript
const signedUrl = await this.storageService.getSignedUrl(
  'path/to/file.jpg',
  3600 // expires in 1 hour
);
```

### Check File Exists

```typescript
const exists = await this.storageService.fileExists('path/to/file.jpg');
```

### Get File Metadata

```typescript
const metadata = await this.storageService.getFileMetadata('path/to/file.jpg');
console.log(metadata.size);
console.log(metadata.contentType);
console.log(metadata.lastModified);
```

## Environment Variables

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket-name
AWS_S3_PROFILE_PHOTOS_PREFIX=profile-photos/
AWS_S3_RESUMES_PREFIX=resumes/
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
ALLOWED_DOCUMENT_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

## File Type Validation

### Allowed Image Types (default)
- `image/jpeg`
- `image/png`
- `image/webp`

### Allowed Document Types (default)
- `application/pdf`
- `application/msword`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

## Size Limits

- Default: 5MB (5,242,880 bytes)
- Configurable via `MAX_FILE_SIZE` env variable

## Image Optimization

When Sharp is installed, profile pictures are automatically:
- Resized to max 800x800px (maintains aspect ratio)
- Compressed to 85% JPEG quality
- Typically 50-80% smaller file size

Install Sharp: `npm install sharp`

## Error Handling

```typescript
import {
  FileUploadException,
  InvalidFileTypeException,
  FileSizeExceededException
} from '../storage/exceptions';

try {
  await this.storageService.uploadProfilePicture(userId, file, mimeType);
} catch (error) {
  if (error instanceof InvalidFileTypeException) {
    // Handle invalid file type
  } else if (error instanceof FileSizeExceededException) {
    // Handle file too large
  } else {
    // Handle other errors
  }
}
```

## Access Control

### Public Files
```typescript
await this.storageService.uploadFile(buffer, key, type, { acl: 'public-read' });
```

### Private Files (default)
```typescript
await this.storageService.uploadFile(buffer, key, type, { acl: 'private' });
// Access via signed URL
const url = await this.storageService.getSignedUrl(key);
```

## Metadata

Add custom metadata to files:

```typescript
await this.storageService.uploadFile(buffer, key, type, {
  metadata: {
    userId: '123',
    category: 'profile',
    uploadedAt: new Date().toISOString()
  }
});
```

Retrieve metadata:

```typescript
const metadata = await this.storageService.getFileMetadata(key);
console.log(metadata.metadata.userId);
```

## Testing Endpoints

### Upload Profile Picture
```bash
curl -X POST http://localhost:8002/api/v1/profile/photo \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@image.jpg"
```

### Delete Profile Picture
```bash
curl -X DELETE http://localhost:8002/api/v1/profile/photo \
  -H "Authorization: Bearer TOKEN"
```

## Common Patterns

### Upload with Progress
```typescript
// For large files, consider streaming
const key = 'large-file.zip';
const stream = fs.createReadStream('path/to/large-file.zip');
// Implement progress tracking as needed
```

### Batch Operations
```typescript
// Upload multiple files
const uploadPromises = files.map(file =>
  this.storageService.uploadFile(file.buffer, file.key, file.mimetype)
);
const urls = await Promise.all(uploadPromises);
```

### Cleanup Old Files
```typescript
// Example: Delete user's old profile picture before uploading new one
if (user.profilePhotoUrl) {
  await this.storageService.deleteFile(user.profilePhotoUrl);
}
const newUrl = await this.storageService.uploadProfilePicture(userId, newFile, mimeType);
```

## File Structure

```
storage/
├── storage.service.ts         # Main service
├── storage.module.ts          # Module definition
├── storage.service.spec.ts    # Tests
├── README.md                  # Full documentation
├── QUICK_REFERENCE.md         # This file
├── config/
│   └── storage.config.ts      # Configuration
├── dto/
│   ├── upload-file.dto.ts
│   ├── upload-result.dto.ts
│   └── index.ts
└── exceptions/
    ├── storage.exception.ts
    └── index.ts
```

## AWS IAM Permissions Required

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
        "s3:ListBucket",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

## Debugging

Enable debug logging:
```env
LOG_LEVEL=debug
```

Check logs for:
- `Uploading file to S3: {key}`
- `File uploaded successfully: {key}`
- `Deleting file from S3: {key}`
- `Image optimized: {before} -> {after} bytes`

## Performance Tips

1. **Use CloudFront CDN** for frequently accessed files
2. **Enable S3 Transfer Acceleration** for faster uploads
3. **Compress images** with Sharp (automatic if installed)
4. **Use signed URLs** for private files instead of proxying
5. **Implement caching** for file metadata
6. **Batch operations** when possible

## Security Best Practices

1. Never commit AWS credentials
2. Use IAM roles when deploying to AWS
3. Set restrictive bucket policies
4. Use signed URLs for sensitive files
5. Validate file types on both client and server
6. Scan files for viruses (consider ClamAV integration)
7. Implement rate limiting on upload endpoints
8. Log all storage operations
9. Regular security audits
10. Use AWS Secrets Manager for credentials

## Troubleshooting

| Error | Solution |
|-------|----------|
| Access Denied | Check IAM permissions |
| Bucket Not Found | Verify bucket name and region |
| Invalid File Type | Check ALLOWED_IMAGE_TYPES config |
| File Too Large | Check MAX_FILE_SIZE config |
| Sharp Error | Install Sharp: `npm install sharp` |
| CORS Error | Configure bucket CORS policy |

## Support

- Full docs: [README.md](./README.md)
- Setup guide: [STORAGE_SETUP_GUIDE.md](../../STORAGE_SETUP_GUIDE.md)
- Tests: [storage.service.spec.ts](./storage.service.spec.ts)

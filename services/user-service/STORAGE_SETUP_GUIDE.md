# StorageService Setup Guide

This guide will help you set up and configure the StorageService for production use.

## Prerequisites

- Node.js 18+ installed
- AWS account with S3 access
- AWS CLI configured (optional but recommended)

## Step 1: Install Optional Dependencies

For image optimization support, install Sharp:

```bash
cd services/user-service
npm install sharp
```

**Note**: Sharp is optional. If not installed, the service will still work but skip image optimization.

## Step 2: Configure AWS S3

### Create S3 Bucket

1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click "Create bucket"
3. Configure:
   - **Bucket name**: `job-apply-platform-user-uploads` (or your preferred name)
   - **Region**: `us-east-1` (or your preferred region)
   - **Block Public Access**: Uncheck "Block all public access" if you want public profile pictures
   - **Bucket Versioning**: Enable (optional, recommended)
4. Click "Create bucket"

### Configure Bucket CORS (Optional, for browser uploads)

If you plan to upload files directly from the browser, configure CORS:

1. Go to your bucket → Permissions → CORS
2. Add this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Configure Bucket Policy (Optional, for public access)

If you want profile pictures to be publicly accessible:

1. Go to your bucket → Permissions → Bucket Policy
2. Add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::job-apply-platform-user-uploads/profile-photos/*"
    }
  ]
}
```

## Step 3: Create IAM User

### Create IAM User with S3 Access

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Add users"
3. Configure:
   - **User name**: `jobpilot-s3-user`
   - **Access type**: Access key - Programmatic access
4. Click "Next: Permissions"

### Attach S3 Policy

1. Click "Attach existing policies directly"
2. Create a custom policy or use these permissions:

**Option A: Use AmazonS3FullAccess (easier but less secure)**
- Search for "AmazonS3FullAccess" and select it

**Option B: Create custom policy (recommended for production)**

Click "Create policy" and use this JSON:

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
        "s3:GetObjectMetadata",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::job-apply-platform-user-uploads/*",
        "arn:aws:s3:::job-apply-platform-user-uploads"
      ]
    }
  ]
}
```

3. Name the policy: `JobPilotS3Policy`
4. Attach it to your user
5. Click "Create user"
6. **IMPORTANT**: Save the Access Key ID and Secret Access Key

## Step 4: Configure Environment Variables

Update your `.env` file in `services/user-service/`:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=job-apply-platform-user-uploads

# S3 Folder Prefixes
AWS_S3_PROFILE_PHOTOS_PREFIX=profile-photos/
AWS_S3_RESUMES_PREFIX=resumes/

# File Upload Limits
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
ALLOWED_DOCUMENT_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

**Security Best Practices**:
- Never commit `.env` file to git
- Use different AWS accounts/users for dev/staging/production
- Rotate credentials regularly
- Use AWS Secrets Manager or environment variables in production

## Step 5: Test the Implementation

### Start the Service

```bash
cd services/user-service
npm run start:dev
```

### Test File Upload

```bash
# Upload a profile picture
curl -X POST http://localhost:8002/api/v1/profile/photo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

Expected response:
```json
{
  "url": "https://job-apply-platform-user-uploads.s3.us-east-1.amazonaws.com/profile-photos/user-123-uuid.jpg"
}
```

### Test File Delete

```bash
# Delete profile picture
curl -X DELETE http://localhost:8002/api/v1/profile/photo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 6: Monitor and Optimize

### Monitor S3 Usage

1. Go to [S3 Console](https://console.aws.amazon.com/s3/)
2. Click on your bucket
3. Go to "Metrics" tab to see:
   - Storage usage
   - Number of objects
   - Request metrics

### Set Up CloudWatch Alarms (Optional)

Create alarms for:
- High storage usage
- High request rates
- Failed requests

### Configure Lifecycle Rules (Optional)

To automatically delete old files:

1. Go to bucket → Management → Lifecycle rules
2. Create rule:
   - **Rule name**: `delete-old-temp-files`
   - **Prefix**: `temp/`
   - **Expiration**: 7 days

### Enable S3 Access Logs (Optional)

For security and debugging:

1. Create a logging bucket
2. Go to your main bucket → Properties → Server access logging
3. Enable logging and select target bucket

## Step 7: Production Deployment

### Environment-Specific Configuration

**Development**:
```env
AWS_S3_BUCKET=jobpilot-dev-uploads
```

**Staging**:
```env
AWS_S3_BUCKET=jobpilot-staging-uploads
```

**Production**:
```env
AWS_S3_BUCKET=jobpilot-prod-uploads
```

### Use AWS Secrets Manager (Recommended)

Instead of storing credentials in `.env`:

1. Store credentials in AWS Secrets Manager
2. Update code to retrieve from Secrets Manager:

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getAwsCredentials() {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "jobpilot/s3" })
  );
  return JSON.parse(response.SecretString);
}
```

### Use IAM Roles (for EC2/ECS/Lambda)

If deploying to AWS infrastructure:

1. Create IAM role with S3 permissions
2. Attach role to EC2/ECS/Lambda
3. Remove `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from `.env`
4. AWS SDK will automatically use role credentials

## Troubleshooting

### Issue: "Access Denied" Error

**Solution**:
- Verify IAM user has correct permissions
- Check bucket policy allows the operations
- Verify AWS credentials are correct in `.env`

### Issue: "Bucket Not Found" Error

**Solution**:
- Verify bucket name in `.env` matches actual bucket
- Verify bucket is in the correct region
- Check if bucket exists in S3 console

### Issue: CORS Errors in Browser

**Solution**:
- Configure bucket CORS (see Step 2)
- Verify AllowedOrigins includes your domain
- Check browser console for specific CORS error

### Issue: Sharp Installation Fails

**Solution**:
- Ensure Node.js version is compatible (18+)
- Try: `npm install --platform=linux --arch=x64 sharp` for Linux
- Check Sharp documentation for platform-specific issues

### Issue: Images Not Optimized

**Solution**:
- Verify Sharp is installed: `npm list sharp`
- Check logs for Sharp-related errors
- Sharp is optional - service works without it

## Cost Optimization

### Estimate Costs

Use [AWS Pricing Calculator](https://calculator.aws.amazon.com/):

Example for 10,000 users:
- Storage: 10,000 users × 1MB profile picture = 10GB = ~$0.23/month
- PUT requests: 10,000 uploads = ~$0.05
- GET requests: 100,000 views = ~$0.04

**Total**: ~$0.32/month

### Optimize Costs

1. **Enable Intelligent-Tiering**: Automatically moves infrequently accessed files to cheaper storage
2. **Use CloudFront CDN**: Reduces S3 GET requests and improves performance
3. **Compress Images**: Sharp automatically compresses (saves ~50-80%)
4. **Delete Unused Files**: Implement cleanup jobs
5. **Use S3 Lifecycle Rules**: Automatically transition to cheaper storage tiers

## Security Checklist

- [ ] AWS credentials stored securely (not in code)
- [ ] Different credentials for dev/staging/prod
- [ ] IAM user has minimum required permissions
- [ ] Bucket has appropriate access controls
- [ ] CORS configured correctly
- [ ] Bucket versioning enabled (optional)
- [ ] Server-side encryption enabled (optional)
- [ ] MFA Delete enabled for production (optional)
- [ ] CloudTrail logging enabled (optional)
- [ ] Regular security audits scheduled

## Performance Optimization

### Use CloudFront CDN

1. Create CloudFront distribution
2. Set origin to S3 bucket
3. Update uploaded URLs to use CloudFront domain
4. Benefits:
   - Faster global access
   - Reduced S3 costs
   - Better security (can hide S3 bucket)

### Enable Transfer Acceleration (Optional)

For faster uploads from distant regions:

1. Enable Transfer Acceleration on bucket
2. Update endpoint in code:
   ```typescript
   useAccelerateEndpoint: true
   ```

## Next Steps

1. ✅ Install Sharp: `npm install sharp`
2. ✅ Create S3 bucket
3. ✅ Create IAM user and save credentials
4. ✅ Update `.env` file
5. ✅ Test file upload/delete
6. ✅ Monitor S3 usage
7. ✅ Set up production environment
8. ✅ Configure CloudFront (optional)
9. ✅ Enable monitoring and alerts
10. ✅ Document for team

## Support

For issues or questions:
- Check the [README.md](./src/modules/storage/README.md) in storage module
- Review AWS S3 documentation
- Check application logs for detailed error messages
- Contact DevOps team for AWS access issues

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadResultDto {
  @ApiProperty({
    description: 'S3 object key',
    example: 'profile-photos/user-123-abc-def.jpg',
  })
  key: string;

  @ApiProperty({
    description: 'Public URL of the uploaded file',
    example: 'https://bucket-name.s3.us-east-1.amazonaws.com/profile-photos/user-123-abc-def.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'S3 bucket name',
    example: 'job-apply-platform-user-uploads',
  })
  bucket: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1024567,
  })
  size?: number;

  @ApiPropertyOptional({
    description: 'Content type of the file',
    example: 'image/jpeg',
  })
  contentType?: string;
}

import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FileAccessLevel {
  PUBLIC = 'public-read',
  PRIVATE = 'private',
}

export class UploadFileDto {
  @ApiProperty({
    description: 'File to upload',
    type: 'string',
    format: 'binary',
  })
  file: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'Custom file name (optional)',
    example: 'my-profile-picture',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'File access level',
    enum: FileAccessLevel,
    default: FileAccessLevel.PRIVATE,
  })
  @IsOptional()
  @IsEnum(FileAccessLevel)
  acl?: FileAccessLevel;

  @ApiPropertyOptional({
    description: 'Additional metadata for the file',
    example: { category: 'profile', userId: '123' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ResumeContent } from '../entities/resume.entity';

@Exclude()
export class ResumeResponseDto {
  @Expose()
  @ApiProperty({ description: 'Resume ID' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @Expose()
  @ApiProperty({ description: 'Resume title' })
  title: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Template ID' })
  templateId?: string;

  @Expose()
  @ApiProperty({ description: 'Resume content', type: 'object' })
  content: ResumeContent;

  @Expose()
  @ApiPropertyOptional({ description: 'ATS Score' })
  atsScore?: number;

  @Expose()
  @ApiProperty({ description: 'Is primary resume' })
  isPrimary: boolean;

  @Expose()
  @ApiProperty({ description: 'Version number' })
  version: number;

  @Expose()
  @ApiPropertyOptional({ description: 'File path' })
  filePath?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Original filename' })
  originalFilename?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'File type' })
  fileType?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'File size in bytes' })
  fileSize?: number;

  @Expose()
  @ApiProperty({ description: 'Created at' })
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Updated at' })
  @Type(() => Date)
  updatedAt: Date;
}

export class ResumeListResponseDto {
  @ApiProperty({ type: [ResumeResponseDto] })
  resumes: ResumeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

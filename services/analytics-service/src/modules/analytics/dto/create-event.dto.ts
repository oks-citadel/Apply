import { IsEnum, IsOptional, IsString, IsObject, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType, EventCategory } from '../entities/analytics-event.entity';

export class CreateEventDto {
  @ApiProperty({
    enum: EventType,
    description: 'Type of the analytics event',
    example: EventType.APPLICATION_SUBMITTED,
  })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({
    enum: EventCategory,
    description: 'Category of the event',
    example: EventCategory.APPLICATION,
  })
  @IsEnum(EventCategory)
  category: EventCategory;

  @ApiPropertyOptional({
    description: 'User ID associated with the event',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Session ID',
    example: 'sess_123456789',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Application ID if event is related to an application',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiPropertyOptional({
    description: 'Job ID if event is related to a job',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the event',
    example: { source: 'web', device: 'desktop' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'URL path where the event occurred',
    example: '/jobs/search',
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    description: 'Referrer URL',
    example: 'https://google.com',
  })
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiPropertyOptional({
    description: 'Duration of the event in milliseconds',
    example: 1500,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Whether the event was successful',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isSuccessful?: boolean;

  @ApiPropertyOptional({
    description: 'Error message if event failed',
    example: 'Failed to submit application',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}

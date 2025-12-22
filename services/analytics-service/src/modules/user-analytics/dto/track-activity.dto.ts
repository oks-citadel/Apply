import {
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
  IsBoolean,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserActivityType } from '../entities/user-activity.entity';

export class TrackActivityDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    enum: UserActivityType,
    description: 'Type of user activity',
    example: UserActivityType.LOGIN,
  })
  @IsEnum(UserActivityType)
  activityType: UserActivityType;

  @ApiPropertyOptional({
    description: 'Session ID for tracking session-based activities',
    example: 'sess_123456789',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the activity',
    example: { query: 'software engineer', filters: { location: 'NYC' } },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'URL path where activity occurred',
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
    description: 'Duration of the activity in milliseconds',
    example: 5000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Whether the activity was successful',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isSuccessful?: boolean;

  @ApiPropertyOptional({
    description: 'Error message if activity failed',
    example: 'Session expired',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class BatchTrackActivityDto {
  @ApiProperty({
    type: [TrackActivityDto],
    description: 'Array of activities to track',
  })
  activities: TrackActivityDto[];
}

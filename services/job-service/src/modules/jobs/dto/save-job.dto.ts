import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator';

export enum SavedJobStatus {
  INTERESTED = 'interested',
  APPLIED = 'applied',
  INTERVIEWING = 'interviewing',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
}

export class SaveJobDto {
  @ApiPropertyOptional({ description: 'Notes about this job' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Custom tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Job application status', enum: SavedJobStatus })
  @IsOptional()
  @IsEnum(SavedJobStatus)
  status?: SavedJobStatus;
}

export class UpdateSavedJobDto {
  @ApiPropertyOptional({ description: 'Notes about this job' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Custom tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Job application status', enum: SavedJobStatus })
  @IsOptional()
  @IsEnum(SavedJobStatus)
  status?: SavedJobStatus;
}

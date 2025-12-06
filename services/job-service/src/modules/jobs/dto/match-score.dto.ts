import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class MatchScoreDto {
  @ApiProperty({ description: 'Job ID' })
  @IsNotEmpty()
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Resume ID' })
  @IsNotEmpty()
  @IsUUID()
  resumeId: string;
}

export class MatchScoreResponseDto {
  @ApiProperty({ description: 'Job ID' })
  jobId: string;

  @ApiProperty({ description: 'Resume ID' })
  resumeId: string;

  @ApiProperty({ description: 'Overall match score (0-100)' })
  overallScore: number;

  @ApiProperty({
    description: 'Score breakdown by category',
    example: {
      skillsMatch: 85,
      experienceMatch: 70,
      educationMatch: 90,
      locationMatch: 100,
    },
  })
  breakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    locationMatch: number;
  };

  @ApiProperty({ description: 'Skills that match', type: [String] })
  matchedSkills: string[];

  @ApiProperty({ description: 'Skills that are missing', type: [String] })
  missingSkills: string[];

  @ApiProperty({ description: 'Recommendations for improvement', type: [String] })
  recommendations: string[];
}

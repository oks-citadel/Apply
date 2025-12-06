import { ApiProperty } from '@nestjs/swagger';

export class InterviewQuestionsResponseDto {
  @ApiProperty({ description: 'Technical interview questions', type: [String] })
  technical: string[];

  @ApiProperty({ description: 'Behavioral interview questions', type: [String] })
  behavioral: string[];

  @ApiProperty({ description: 'Company-specific interview questions', type: [String] })
  companySpecific: string[];
}

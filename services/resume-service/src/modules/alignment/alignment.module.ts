import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AlignmentController } from './alignment.controller';
import { ResumeAlignmentService } from './services/resume-alignment.service';
import { CoverLetterService } from './services/cover-letter.service';
import { AIServiceClient } from './services/ai-service.client';
import { AlignedResume } from './entities/aligned-resume.entity';
import { GeneratedCoverLetter } from './entities/generated-cover-letter.entity';
import { AlignmentAnalysis } from './entities/alignment-analysis.entity';
import { Resume } from '../resumes/entities/resume.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlignedResume,
      GeneratedCoverLetter,
      AlignmentAnalysis,
      Resume,
    ]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [AlignmentController],
  providers: [
    ResumeAlignmentService,
    CoverLetterService,
    AIServiceClient,
  ],
  exports: [
    ResumeAlignmentService,
    CoverLetterService,
    AIServiceClient,
  ],
})
export class AlignmentModule {}

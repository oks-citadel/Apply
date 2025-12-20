import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployerProfile } from './entities/employer-profile.entity';
import { JobReport } from './entities/job-report.entity';
import { JobTaxonomy, JobTitleMapping, SkillMapping, IndustryMapping } from './entities/job-taxonomy.entity';
import { NormalizedJob } from './entities/normalized-job.entity';
import { NormalizationController } from './normalization.controller';
import { NormalizationProcessor } from './processors/normalization.processor';
import { DuplicateDetectorService } from './services/duplicate-detector.service';
import { EmployerCredibilityService } from './services/employer-credibility.service';
import { FraudDetectorService } from './services/fraud-detector.service';
import { NormalizationService } from './services/normalization.service';
import { QualityScorerService } from './services/quality-scorer.service';
import { SkillExtractorService } from './services/skill-extractor.service';
import { TitleNormalizerService } from './services/title-normalizer.service';
import { Company } from '../companies/entities/company.entity';
import { Job } from '../jobs/entities/job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NormalizedJob,
      JobTaxonomy,
      JobTitleMapping,
      SkillMapping,
      IndustryMapping,
      EmployerProfile,
      JobReport,
      Job,
      Company,
    ]),
    BullModule.registerQueue({
      name: 'normalization',
    }),
  ],
  controllers: [NormalizationController],
  providers: [
    NormalizationService,
    TitleNormalizerService,
    SkillExtractorService,
    DuplicateDetectorService,
    FraudDetectorService,
    QualityScorerService,
    EmployerCredibilityService,
    NormalizationProcessor,
  ],
  exports: [
    NormalizationService,
    TitleNormalizerService,
    SkillExtractorService,
    DuplicateDetectorService,
    FraudDetectorService,
    QualityScorerService,
    EmployerCredibilityService,
  ],
})
export class NormalizationModule {}

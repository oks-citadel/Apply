import { Module } from '@nestjs/common';
import { RecruiterPredictionController } from './recruiter-prediction.controller';
import { RecruiterPredictionService } from './recruiter-prediction.service';

/**
 * Module for recruiter behavior prediction functionality.
 *
 * This module provides services and endpoints for:
 * - Predicting the likelihood of recruiter responses
 * - Estimating response times
 * - Analyzing recruiter activity patterns
 * - Scoring recruiter engagement levels
 * - Generating actionable insights for job seekers
 *
 * The predictions are based on statistical/heuristic methods using:
 * - Historical interaction data
 * - Company characteristics (size, industry)
 * - Role level and job posting age
 * - Platform and connection information
 * - Temporal patterns (day of week, time of day)
 */
@Module({
  imports: [],
  controllers: [RecruiterPredictionController],
  providers: [RecruiterPredictionService],
  exports: [RecruiterPredictionService],
})
export class RecruiterPredictionModule {}

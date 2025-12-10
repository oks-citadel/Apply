import { Module } from '@nestjs/common';
import { FieldDetectionEngine } from './field-detection.engine';
import { SemanticMatchingEngine } from './semantic-matching.engine';
import { ValidationEngine } from './validation.engine';
import { ConfidenceScoringEngine } from './confidence-scoring.engine';
import { AutofillService } from './autofill.service';

@Module({
  providers: [
    FieldDetectionEngine,
    SemanticMatchingEngine,
    ValidationEngine,
    ConfidenceScoringEngine,
    AutofillService,
  ],
  exports: [
    FieldDetectionEngine,
    SemanticMatchingEngine,
    ValidationEngine,
    ConfidenceScoringEngine,
    AutofillService,
  ],
})
export class AutofillModule {}

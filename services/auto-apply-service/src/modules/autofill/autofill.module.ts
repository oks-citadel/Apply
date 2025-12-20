import { Module } from '@nestjs/common';

import { AutofillService } from './autofill.service';
import { ConfidenceScoringEngine } from './confidence-scoring.engine';
import { FieldDetectionEngine } from './field-detection.engine';
import { SemanticMatchingEngine } from './semantic-matching.engine';
import { ValidationEngine } from './validation.engine';

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

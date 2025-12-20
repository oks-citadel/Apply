import { Injectable, Logger } from '@nestjs/common';


import type { ConfidenceScoringEngine, ApplicationConfidence } from './confidence-scoring.engine';
import type { FieldDetectionEngine, DetectedField } from './field-detection.engine';
import type { SemanticMatchingEngine, UserProfile, ResumeData, FieldMatch } from './semantic-matching.engine';
import type { ValidationEngine, ValidationResult } from './validation.engine';
import type { Page } from 'playwright';

export interface AutofillResult {
  success: boolean;
  fieldCount: number;
  filledCount: number;
  confidence: ApplicationConfidence;
  fieldResults: AutofillFieldResult[];
  requiresReview: boolean;
  errors: string[];
}

export interface AutofillFieldResult {
  fieldId: string;
  fieldLabel: string;
  value: string;
  source: string;
  confidence: number;
  validation: ValidationResult;
  filled: boolean;
  requiresReview: boolean;
}

export interface AutofillOptions {
  dryRun: boolean; // Don't actually fill, just analyze
  fillHighConfidenceOnly: boolean;
  confidenceThreshold: number;
  skipValidationFailed: boolean;
  userReviewCallback?: (fields: AutofillFieldResult[]) => Promise<Map<string, string>>;
}

@Injectable()
export class AutofillService {
  private readonly logger = new Logger(AutofillService.name);

  constructor(
    private readonly fieldDetection: FieldDetectionEngine,
    private readonly semanticMatching: SemanticMatchingEngine,
    private readonly validation: ValidationEngine,
    private readonly confidenceScoring: ConfidenceScoringEngine,
  ) {}

  /**
   * Main autofill entry point - analyzes and fills a form
   */
  async autofillForm(
    page: Page,
    profile: UserProfile,
    resume: ResumeData,
    savedAnswers: Map<string, string> = new Map(),
    options: Partial<AutofillOptions> = {},
  ): Promise<AutofillResult> {
    const finalOptions: AutofillOptions = {
      dryRun: false,
      fillHighConfidenceOnly: false,
      confidenceThreshold: 60,
      skipValidationFailed: true,
      ...options,
    };

    this.logger.log('Starting form autofill process');

    const errors: string[] = [];
    const fieldResults: AutofillFieldResult[] = [];

    try {
      // Step 1: Detect all form fields
      this.logger.log('Step 1: Detecting form fields');
      const detectedFields = await this.fieldDetection.detectFields(page);
      this.logger.log(`Detected ${detectedFields.length} fields`);

      if (detectedFields.length === 0) {
        return {
          success: false,
          fieldCount: 0,
          filledCount: 0,
          confidence: this.createEmptyConfidence(),
          fieldResults: [],
          requiresReview: false,
          errors: ['No form fields detected on the page'],
        };
      }

      // Step 2: Match fields with user data
      this.logger.log('Step 2: Matching fields with user data');
      const fieldMatches = await this.semanticMatching.matchFields(
        detectedFields,
        profile,
        resume,
        savedAnswers,
      );

      // Step 3: Validate matched values
      this.logger.log('Step 3: Validating matched values');
      const validationResults = new Map<string, ValidationResult>();
      const values = new Map<string, string>();

      for (const match of fieldMatches) {
        values.set(match.field.id, match.matchedValue);
        const validation = this.validation.validateField(match.field, match.matchedValue);
        validationResults.set(match.field.id, validation);

        // Apply formatting if available
        if (validation.formattedValue) {
          values.set(match.field.id, validation.formattedValue);
        }
      }

      // Step 4: Calculate confidence scores
      this.logger.log('Step 4: Calculating confidence scores');
      const validationPassMap = new Map<string, boolean>();
      for (const [fieldId, result] of validationResults) {
        validationPassMap.set(fieldId, result.isValid);
      }
      const confidence = this.confidenceScoring.calculateApplicationConfidence(
        fieldMatches,
        validationPassMap,
      );

      // Step 5: Build field results
      for (const match of fieldMatches) {
        const validation = validationResults.get(match.field.id)!;
        const fieldConfidence = confidence.fieldScores.get(match.field.id);

        const shouldFill = this.shouldFillField(
          match,
          validation,
          fieldConfidence?.overall || 0,
          finalOptions,
        );

        fieldResults.push({
          fieldId: match.field.id,
          fieldLabel: match.field.label,
          value: values.get(match.field.id) || '',
          source: match.source,
          confidence: fieldConfidence?.overall || 0,
          validation,
          filled: shouldFill && !finalOptions.dryRun,
          requiresReview: match.requiresReview || !validation.isValid,
        });
      }

      // Step 6: Fill fields (if not dry run)
      let filledCount = 0;
      if (!finalOptions.dryRun) {
        this.logger.log('Step 6: Filling form fields');

        // Check if user review is needed
        const fieldsNeedingReview = fieldResults.filter((f) => f.requiresReview);
        if (fieldsNeedingReview.length > 0 && finalOptions.userReviewCallback) {
          this.logger.log(`${fieldsNeedingReview.length} fields require review`);
          const reviewedValues = await finalOptions.userReviewCallback(fieldsNeedingReview);

          // Update values with reviewed data
          for (const [fieldId, value] of reviewedValues) {
            values.set(fieldId, value);
            const fieldResult = fieldResults.find((f) => f.fieldId === fieldId);
            if (fieldResult) {
              fieldResult.value = value;
              fieldResult.requiresReview = false;
            }
          }
        }

        // Actually fill the fields
        for (const result of fieldResults) {
          if (result.filled || (result.value && !result.requiresReview)) {
            try {
              const field = fieldMatches.find((m) => m.field.id === result.fieldId)?.field;
              if (field) {
                await this.fillField(page, field, result.value);
                result.filled = true;
                filledCount++;
              }
            } catch (error) {
              this.logger.warn(`Failed to fill field ${result.fieldLabel}: ${error.message}`);
              errors.push(`Failed to fill ${result.fieldLabel}: ${error.message}`);
              result.filled = false;
            }
          }
        }
      }

      this.logger.log(`Autofill complete. Filled ${filledCount}/${detectedFields.length} fields`);

      return {
        success: errors.length === 0,
        fieldCount: detectedFields.length,
        filledCount,
        confidence,
        fieldResults,
        requiresReview: fieldResults.some((f) => f.requiresReview),
        errors,
      };
    } catch (error) {
      this.logger.error(`Autofill failed: ${error.message}`);
      return {
        success: false,
        fieldCount: 0,
        filledCount: 0,
        confidence: this.createEmptyConfidence(),
        fieldResults,
        requiresReview: true,
        errors: [error.message],
      };
    }
  }

  /**
   * Preview autofill without actually filling fields
   */
  async previewAutofill(
    page: Page,
    profile: UserProfile,
    resume: ResumeData,
    savedAnswers: Map<string, string> = new Map(),
  ): Promise<AutofillResult> {
    return this.autofillForm(page, profile, resume, savedAnswers, { dryRun: true });
  }

  /**
   * Analyze form and get field mapping suggestions
   */
  async analyzeForm(page: Page): Promise<DetectedField[]> {
    return this.fieldDetection.detectFields(page);
  }

  /**
   * Fill a single field
   */
  private async fillField(page: Page, field: DetectedField, value: string): Promise<void> {
    if (!value) {return;}

    try {
      const element = await page.$(field.selector);
      if (!element) {
        throw new Error(`Element not found: ${field.selector}`);
      }

      switch (field.type) {
        case 'select':
          await this.fillSelectField(page, field.selector, value, field.options);
          break;

        case 'checkbox':
          await this.fillCheckboxField(page, field.selector, value);
          break;

        case 'radio':
          await this.fillRadioField(page, field.selector, value);
          break;

        case 'file':
          await this.fillFileField(page, field.selector, value);
          break;

        default:
          await this.fillTextField(page, field.selector, value);
          break;
      }
    } catch (error) {
      this.logger.warn(`Error filling field ${field.label}: ${error.message}`);
      throw error;
    }
  }

  private async fillTextField(page: Page, selector: string, value: string): Promise<void> {
    await page.fill(selector, value);
  }

  private async fillSelectField(
    page: Page,
    selector: string,
    value: string,
    options?: string[],
  ): Promise<void> {
    // Try exact match first
    try {
      await page.selectOption(selector, value);
      return;
    } catch (error) {
      // If exact match fails, try partial match
    }

    // Try partial match with options
    if (options) {
      const normalizedValue = value.toLowerCase();
      const matchingOption = options.find(
        (opt) =>
          opt.toLowerCase() === normalizedValue ||
          opt.toLowerCase().includes(normalizedValue) ||
          normalizedValue.includes(opt.toLowerCase()),
      );

      if (matchingOption) {
        await page.selectOption(selector, matchingOption);
      }
    }
  }

  private async fillCheckboxField(page: Page, selector: string, value: string): Promise<void> {
    const shouldCheck = ['yes', 'true', '1', 'checked'].includes(value.toLowerCase());
    const element = await page.$(selector);
    if (!element) {return;}

    const isChecked = await element.isChecked();
    if (shouldCheck !== isChecked) {
      await page.click(selector);
    }
  }

  private async fillRadioField(page: Page, selector: string, value: string): Promise<void> {
    // Find radio button with matching value or label
    const radios = await page.$$(`${selector}, input[type="radio"][name="${selector}"]`);

    for (const radio of radios) {
      const radioValue = await radio.getAttribute('value');
      const labelText = await radio.evaluate((el) => {
        const label = el.closest('label');
        return label?.textContent?.trim() || '';
      });

      if (
        radioValue?.toLowerCase() === value.toLowerCase() ||
        labelText.toLowerCase().includes(value.toLowerCase())
      ) {
        await radio.click();
        return;
      }
    }
  }

  private async fillFileField(page: Page, selector: string, filePath: string): Promise<void> {
    const element = await page.$(selector);
    if (element) {
      await element.setInputFiles(filePath);
    }
  }

  private shouldFillField(
    match: FieldMatch,
    validation: ValidationResult,
    confidence: number,
    options: AutofillOptions,
  ): boolean {
    // Skip if validation failed and option is set
    if (options.skipValidationFailed && !validation.isValid) {
      return false;
    }

    // Skip if below confidence threshold
    if (options.fillHighConfidenceOnly && confidence < options.confidenceThreshold) {
      return false;
    }

    // Skip if no value
    if (!match.matchedValue) {
      return false;
    }

    return true;
  }

  private createEmptyConfidence(): ApplicationConfidence {
    return {
      overallScore: 0,
      fieldScores: new Map(),
      lowConfidenceFields: [],
      highConfidenceFields: [],
      criticalIssues: [],
      warnings: [],
      readyToSubmit: false,
    };
  }
}

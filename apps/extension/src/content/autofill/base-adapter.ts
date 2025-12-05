/**
 * Abstract base class for all ATS adapters
 * Provides common functionality for form autofill
 */

import {
  ResumeData,
  FormField,
  FieldMapping,
  AutofillResult,
  AutofillConfig,
  AutofillError,
  AdapterMetadata,
  FormSubmissionResult,
  ATSPlatform,
  AutofillProgress,
  WaitForElementOptions,
} from './types';
import { FieldDetector } from './field-detector';
import { SemanticMatcher } from './semantic-matcher';
import { CustomQuestionHandler } from './custom-questions';
import { FileUploadHandler } from './file-upload';
import { FormSubmitter } from './form-submit';
import { ProgressTracker } from './progress';

export abstract class BaseAdapter {
  protected fieldDetector: FieldDetector;
  protected semanticMatcher: SemanticMatcher;
  protected questionHandler: CustomQuestionHandler;
  protected fileUploader: FileUploadHandler;
  protected formSubmitter: FormSubmitter;
  protected progressTracker: ProgressTracker;

  protected config: AutofillConfig;
  protected resumeData: ResumeData;
  protected errors: AutofillError[] = [];
  protected warnings: string[] = [];

  constructor(config: AutofillConfig = {}) {
    this.config = {
      fillDelay: 100,
      waitForElements: true,
      maxWaitTime: 10000,
      skipCustomQuestions: false,
      autoSubmit: false,
      highlightFields: true,
      showProgress: true,
      handleFileUploads: true,
      ...config,
    };

    this.fieldDetector = new FieldDetector();
    this.semanticMatcher = new SemanticMatcher();
    this.questionHandler = new CustomQuestionHandler();
    this.fileUploader = new FileUploadHandler();
    this.formSubmitter = new FormSubmitter();
    this.progressTracker = new ProgressTracker();
  }

  /**
   * Get adapter metadata
   */
  abstract getMetadata(): AdapterMetadata;

  /**
   * Get platform-specific field mappings
   */
  abstract getFieldMappings(): FieldMapping[];

  /**
   * Get platform-specific selectors for form detection
   */
  abstract getFormSelectors(): string[];

  /**
   * Check if the current page is a valid application form for this platform
   */
  abstract isValidForm(): boolean;

  /**
   * Platform-specific initialization
   */
  protected async initialize(): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Platform-specific cleanup
   */
  protected async cleanup(): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Main autofill method
   */
  async autofill(resumeData: ResumeData): Promise<AutofillResult> {
    this.resumeData = resumeData;
    this.errors = [];
    this.warnings = [];

    try {
      this.progressTracker.start();
      this.progressTracker.updateStatus('detecting', 'Detecting form fields...');

      // Initialize platform-specific setup
      await this.initialize();

      // Validate form
      if (!this.isValidForm()) {
        throw new Error('Invalid or unsupported form detected');
      }

      // Detect all form fields
      const fields = await this.detectFields();
      this.progressTracker.setTotalSteps(fields.length);

      // Fill standard fields
      this.progressTracker.updateStatus('filling', 'Filling form fields...');
      const filledFields = await this.fillFields(fields);

      // Handle file uploads
      if (this.config.handleFileUploads && resumeData.resumeFile) {
        this.progressTracker.updateStatus('uploading', 'Uploading resume...');
        await this.handleFileUploads();
      }

      // Handle custom questions
      let customQuestions = [];
      if (!this.config.skipCustomQuestions) {
        customQuestions = await this.handleCustomQuestions();
      }

      // Validate form
      this.progressTracker.updateStatus('validating', 'Validating form...');
      const missingRequired = await this.validateForm(fields);

      // Auto-submit if configured
      let submissionResult = null;
      if (this.config.autoSubmit && missingRequired.length === 0) {
        this.progressTracker.updateStatus('submitting', 'Submitting form...');
        submissionResult = await this.submitForm();
      }

      // Cleanup
      await this.cleanup();

      this.progressTracker.updateStatus('completed', 'Autofill completed');
      this.progressTracker.complete();

      return {
        success: missingRequired.length === 0,
        filledFields: filledFields.length,
        totalFields: fields.length,
        errors: this.errors,
        warnings: this.warnings,
        customQuestions,
        missingRequired,
      };
    } catch (error) {
      this.progressTracker.updateStatus('error', `Error: ${error.message}`);
      this.progressTracker.error(error.message);

      this.errors.push({
        field: 'general',
        message: error.message,
        type: 'interaction_failed',
        severity: 'error',
      });

      return {
        success: false,
        filledFields: 0,
        totalFields: 0,
        errors: this.errors,
        warnings: this.warnings,
        customQuestions: [],
        missingRequired: [],
      };
    }
  }

  /**
   * Detect all form fields
   */
  protected async detectFields(): Promise<FormField[]> {
    const formSelectors = this.getFormSelectors();
    let allFields: FormField[] = [];

    for (const selector of formSelectors) {
      if (this.config.waitForElements) {
        await this.waitForElement(selector);
      }

      const formElement = document.querySelector(selector);
      if (formElement) {
        const fields = this.fieldDetector.detectAllFields(formElement as HTMLElement);
        allFields = [...allFields, ...fields];
      }
    }

    return allFields;
  }

  /**
   * Fill all detected fields
   */
  protected async fillFields(fields: FormField[]): Promise<FormField[]> {
    const filledFields: FormField[] = [];
    const mappings = this.getFieldMappings();

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      try {
        this.progressTracker.updateProgress(i + 1, fields.length);
        this.progressTracker.setCurrentField(field.label || field.name);

        // Try to match field using semantic matcher
        const match = this.semanticMatcher.matchFieldToData(field, this.resumeData, mappings);

        if (match && match.value) {
          await this.fillField(field, match.value);
          filledFields.push(field);

          if (this.config.highlightFields) {
            this.highlightField(field.element, 'success');
          }
        } else if (field.required) {
          this.warnings.push(`Could not find data for required field: ${field.label}`);
          if (this.config.highlightFields) {
            this.highlightField(field.element, 'warning');
          }
        }

        // Add delay between fields to avoid triggering anti-bot measures
        if (this.config.fillDelay > 0) {
          await this.delay(this.config.fillDelay);
        }
      } catch (error) {
        this.errors.push({
          field: field.label || field.name,
          message: error.message,
          type: 'interaction_failed',
          severity: 'error',
        });

        if (this.config.highlightFields) {
          this.highlightField(field.element, 'error');
        }
      }
    }

    return filledFields;
  }

  /**
   * Fill a single field
   */
  protected async fillField(field: FormField, value: string): Promise<void> {
    const element = field.element;

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.delay(100);

    // Focus the element
    element.focus();

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
      case 'number':
      case 'date':
        await this.fillTextInput(element as HTMLInputElement, value);
        break;

      case 'textarea':
        await this.fillTextarea(element as HTMLTextAreaElement, value);
        break;

      case 'select':
        await this.fillSelect(element as HTMLSelectElement, value);
        break;

      case 'checkbox':
        await this.fillCheckbox(element as HTMLInputElement, value === 'true');
        break;

      case 'radio':
        await this.fillRadio(element as HTMLInputElement);
        break;

      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }

    // Trigger change events
    this.triggerEvents(element);
  }

  /**
   * Fill text input field
   */
  protected async fillTextInput(element: HTMLInputElement, value: string): Promise<void> {
    // Clear existing value
    element.value = '';

    // Set value character by character to simulate typing
    for (const char of value) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await this.delay(10);
    }
  }

  /**
   * Fill textarea field
   */
  protected async fillTextarea(element: HTMLTextAreaElement, value: string): Promise<void> {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Fill select field
   */
  protected async fillSelect(element: HTMLSelectElement, value: string): Promise<void> {
    // Try exact match first
    for (const option of Array.from(element.options)) {
      if (option.value === value || option.text === value) {
        element.value = option.value;
        return;
      }
    }

    // Try partial match
    for (const option of Array.from(element.options)) {
      if (option.text.toLowerCase().includes(value.toLowerCase())) {
        element.value = option.value;
        return;
      }
    }

    throw new Error(`Could not find matching option for value: ${value}`);
  }

  /**
   * Fill checkbox field
   */
  protected async fillCheckbox(element: HTMLInputElement, checked: boolean): Promise<void> {
    if (element.checked !== checked) {
      element.checked = checked;
    }
  }

  /**
   * Fill radio button
   */
  protected async fillRadio(element: HTMLInputElement): Promise<void> {
    element.checked = true;
  }

  /**
   * Handle file uploads
   */
  protected async handleFileUploads(): Promise<void> {
    const fileInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');

    for (const input of Array.from(fileInputs)) {
      try {
        await this.fileUploader.handleFileUpload(input, this.resumeData.resumeFile!);
      } catch (error) {
        this.errors.push({
          field: 'file_upload',
          message: error.message,
          type: 'interaction_failed',
          severity: 'error',
        });
      }
    }
  }

  /**
   * Handle custom questions
   */
  protected async handleCustomQuestions() {
    return this.questionHandler.detectAndAnswerQuestions(this.resumeData);
  }

  /**
   * Validate form before submission
   */
  protected async validateForm(fields: FormField[]): Promise<FormField[]> {
    return this.formSubmitter.validateForm(fields);
  }

  /**
   * Submit the form
   */
  protected async submitForm(): Promise<FormSubmissionResult> {
    return this.formSubmitter.submitForm();
  }

  /**
   * Wait for element to appear
   */
  protected async waitForElement(
    selector: string,
    options: WaitForElementOptions = {}
  ): Promise<HTMLElement | null> {
    const { timeout = this.config.maxWaitTime, interval = 100, visible = true } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout!) {
      const element = document.querySelector<HTMLElement>(selector);

      if (element) {
        if (!visible || (element.offsetWidth > 0 && element.offsetHeight > 0)) {
          return element;
        }
      }

      await this.delay(interval!);
    }

    return null;
  }

  /**
   * Trigger all necessary events on an element
   */
  protected triggerEvents(element: HTMLElement): void {
    const events = ['input', 'change', 'blur'];

    events.forEach((eventType) => {
      element.dispatchEvent(new Event(eventType, { bubbles: true }));
    });

    // Trigger React/Angular change detection
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter && element instanceof HTMLInputElement) {
      const event = new Event('input', { bubbles: true });
      nativeInputValueSetter.call(element, element.value);
      element.dispatchEvent(event);
    }
  }

  /**
   * Highlight field with visual feedback
   */
  protected highlightField(element: HTMLElement, status: 'success' | 'warning' | 'error'): void {
    const colors = {
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    };

    const originalBorder = element.style.border;
    element.style.border = `2px solid ${colors[status]}`;
    element.style.transition = 'border 0.3s ease';

    setTimeout(() => {
      element.style.border = originalBorder;
    }, 2000);
  }

  /**
   * Delay helper
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Subscribe to progress updates
   */
  public onProgress(callback: (progress: AutofillProgress) => void): void {
    this.progressTracker.onProgress(callback);
  }

  /**
   * Get current progress
   */
  public getProgress(): AutofillProgress {
    return this.progressTracker.getProgress();
  }
}

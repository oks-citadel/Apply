import { Injectable, Logger } from '@nestjs/common';
import { DetectedField } from './field-detection.engine';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  formattedValue?: string;
}

export interface ValidationRule {
  name: string;
  validate: (value: string, field: DetectedField) => ValidationResult;
}

@Injectable()
export class ValidationEngine {
  private readonly logger = new Logger(ValidationEngine.name);

  // Common validation patterns
  private readonly patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
    zipCode: /^\d{5}(-\d{4})?$/,
    url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    date: /^\d{4}[-\/]\d{2}[-\/]\d{2}$|^\d{2}[-\/]\d{2}[-\/]\d{4}$/,
    salary: /^\$?[\d,]+(\.\d{2})?(\s*-\s*\$?[\d,]+(\.\d{2})?)?$/,
    linkedinUrl: /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[\w-]+\/?$/i,
    githubUrl: /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/?$/i,
  };

  // Field-specific validators
  private readonly validators: Map<string, ValidationRule[]> = new Map([
    [
      'email',
      [
        {
          name: 'format',
          validate: (value) => this.validateEmail(value),
        },
      ],
    ],
    [
      'phone',
      [
        {
          name: 'format',
          validate: (value) => this.validatePhone(value),
        },
      ],
    ],
    [
      'contact',
      [
        {
          name: 'phone',
          validate: (value, field) => {
            if (field.label.toLowerCase().includes('phone')) {
              return this.validatePhone(value);
            }
            return { isValid: true, errors: [], warnings: [], suggestions: [] };
          },
        },
        {
          name: 'email',
          validate: (value, field) => {
            if (field.label.toLowerCase().includes('email')) {
              return this.validateEmail(value);
            }
            return { isValid: true, errors: [], warnings: [], suggestions: [] };
          },
        },
      ],
    ],
    [
      'personal_info',
      [
        {
          name: 'name',
          validate: (value, field) => this.validateName(value, field),
        },
      ],
    ],
  ]);

  /**
   * Validate a field value
   */
  validateField(field: DetectedField, value: string): ValidationResult {
    this.logger.debug(`Validating field: ${field.label} with value: ${value}`);

    const results: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Check for empty required fields
    if (field.required && (!value || value.trim() === '')) {
      results.isValid = false;
      results.errors.push(`${field.label} is required`);
      return results;
    }

    // Skip validation for empty optional fields
    if (!value || value.trim() === '') {
      return results;
    }

    // Run type-specific validation
    const typeResult = this.validateByType(field, value);
    this.mergeResults(results, typeResult);

    // Run category-specific validation
    const categoryValidators = this.validators.get(field.fieldCategory) || [];
    for (const validator of categoryValidators) {
      const validatorResult = validator.validate(value, field);
      this.mergeResults(results, validatorResult);
    }

    // Run field type validators
    const fieldTypeValidators = this.validators.get(field.type) || [];
    for (const validator of fieldTypeValidators) {
      const validatorResult = validator.validate(value, field);
      this.mergeResults(results, validatorResult);
    }

    // Check for format suggestions
    const formatResult = this.checkFormatSuggestions(field, value);
    this.mergeResults(results, formatResult);

    return results;
  }

  /**
   * Validate multiple fields
   */
  validateFields(fields: DetectedField[], values: Map<string, string>): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    for (const field of fields) {
      const value = values.get(field.id) || '';
      results.set(field.id, this.validateField(field, value));
    }

    return results;
  }

  /**
   * Format a value according to field type
   */
  formatValue(field: DetectedField, value: string): string {
    if (!value) return value;

    switch (field.type) {
      case 'phone':
        return this.formatPhone(value);
      case 'email':
        return value.toLowerCase().trim();
      case 'date':
        return this.formatDate(value);
      case 'number':
        return this.formatNumber(value);
      default:
        break;
    }

    // Category-specific formatting
    if (field.label.toLowerCase().includes('salary')) {
      return this.formatSalary(value);
    }

    if (field.label.toLowerCase().includes('linkedin')) {
      return this.formatLinkedInUrl(value);
    }

    return value.trim();
  }

  // Private validation methods

  private validateByType(field: DetectedField, value: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    switch (field.type) {
      case 'email':
        return this.validateEmail(value);

      case 'phone':
        return this.validatePhone(value);

      case 'date':
        return this.validateDate(value);

      case 'number':
        return this.validateNumber(value);

      case 'select':
        return this.validateSelect(value, field.options);

      default:
        return result;
    }
  }

  private validateEmail(value: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    if (!this.patterns.email.test(value)) {
      result.isValid = false;
      result.errors.push('Invalid email format');
      result.suggestions.push('Email should be in format: example@domain.com');
    }

    // Check for common typos
    const commonDomainTypos = [
      { typo: 'gmial.com', correct: 'gmail.com' },
      { typo: 'gmai.com', correct: 'gmail.com' },
      { typo: 'hotmal.com', correct: 'hotmail.com' },
      { typo: 'yahooo.com', correct: 'yahoo.com' },
    ];

    for (const { typo, correct } of commonDomainTypos) {
      if (value.toLowerCase().includes(typo)) {
        result.warnings.push(`Did you mean @${correct}?`);
        result.formattedValue = value.replace(typo, correct);
      }
    }

    return result;
  }

  private validatePhone(value: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Remove common formatting characters for validation
    const cleanedPhone = value.replace(/[\s\-\(\)\.]*/g, '');

    if (cleanedPhone.length < 10) {
      result.isValid = false;
      result.errors.push('Phone number is too short');
      result.suggestions.push('Phone number should have at least 10 digits');
    }

    if (cleanedPhone.length > 15) {
      result.isValid = false;
      result.errors.push('Phone number is too long');
    }

    if (!/^\+?\d+$/.test(cleanedPhone)) {
      result.isValid = false;
      result.errors.push('Phone number contains invalid characters');
    }

    // Format suggestion
    if (result.isValid && cleanedPhone.length === 10) {
      result.formattedValue = `(${cleanedPhone.slice(0, 3)}) ${cleanedPhone.slice(3, 6)}-${cleanedPhone.slice(6)}`;
    }

    return result;
  }

  private validateDate(value: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      result.isValid = false;
      result.errors.push('Invalid date format');
      result.suggestions.push('Use format: YYYY-MM-DD or MM/DD/YYYY');
    }

    // Check for future dates in certain contexts
    if (date > new Date()) {
      result.warnings.push('Date is in the future');
    }

    // Check for very old dates
    const minYear = 1900;
    if (date.getFullYear() < minYear) {
      result.warnings.push('Date seems unusually old');
    }

    return result;
  }

  private validateNumber(value: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const num = parseFloat(value.replace(/[,\$]/g, ''));

    if (isNaN(num)) {
      result.isValid = false;
      result.errors.push('Invalid number format');
    }

    return result;
  }

  private validateSelect(value: string, options?: string[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    if (options && options.length > 0) {
      const normalizedValue = value.toLowerCase().trim();
      const normalizedOptions = options.map((o) => o.toLowerCase().trim());

      if (!normalizedOptions.includes(normalizedValue)) {
        result.isValid = false;
        result.errors.push('Selected value not in available options');
        result.suggestions.push(`Available options: ${options.slice(0, 5).join(', ')}${options.length > 5 ? '...' : ''}`);
      }
    }

    return result;
  }

  private validateName(value: string, field: DetectedField): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Check for minimum length
    if (value.length < 2) {
      result.warnings.push('Name seems too short');
    }

    // Check for numbers in name
    if (/\d/.test(value)) {
      result.warnings.push('Name contains numbers');
    }

    // Check for special characters
    if (/[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      result.warnings.push('Name contains special characters');
    }

    // Suggest proper capitalization
    const properCase = value.split(' ').map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

    if (value !== properCase) {
      result.suggestions.push('Consider proper capitalization');
      result.formattedValue = properCase;
    }

    return result;
  }

  private checkFormatSuggestions(field: DetectedField, value: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const label = field.label.toLowerCase();

    // LinkedIn URL
    if (label.includes('linkedin') && value && !this.patterns.linkedinUrl.test(value)) {
      if (value.includes('linkedin.com')) {
        result.warnings.push('LinkedIn URL format may not be correct');
        result.suggestions.push('Use format: https://www.linkedin.com/in/your-profile');
      } else {
        result.suggestions.push('Enter your full LinkedIn profile URL');
      }
    }

    // GitHub URL
    if (label.includes('github') && value && !this.patterns.githubUrl.test(value)) {
      result.suggestions.push('Use format: https://github.com/username');
    }

    // Salary
    if (label.includes('salary') && value) {
      if (!value.includes('$') && /^\d/.test(value)) {
        result.suggestions.push('Consider adding currency symbol ($)');
        result.formattedValue = `$${value}`;
      }
    }

    return result;
  }

  // Private formatting methods

  private formatPhone(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return value;
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
  }

  private formatNumber(value: string): string {
    const num = parseFloat(value.replace(/[,\$]/g, ''));
    if (isNaN(num)) return value;
    return num.toLocaleString();
  }

  private formatSalary(value: string): string {
    const num = parseFloat(value.replace(/[,\$]/g, ''));
    if (isNaN(num)) return value;
    return `$${num.toLocaleString()}`;
  }

  private formatLinkedInUrl(value: string): string {
    if (!value) return value;
    if (value.startsWith('http')) return value;
    if (value.startsWith('www.')) return `https://${value}`;
    if (value.startsWith('linkedin.com')) return `https://www.${value}`;
    return value;
  }

  private mergeResults(target: ValidationResult, source: ValidationResult): void {
    target.isValid = target.isValid && source.isValid;
    target.errors.push(...source.errors);
    target.warnings.push(...source.warnings);
    target.suggestions.push(...source.suggestions);
    if (source.formattedValue && !target.formattedValue) {
      target.formattedValue = source.formattedValue;
    }
  }
}

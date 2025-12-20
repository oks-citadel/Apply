import { Injectable, Logger } from '@nestjs/common';

import type { Page, ElementHandle } from 'playwright';

export interface DetectedField {
  id: string;
  selector: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'number';
  label: string;
  placeholder?: string;
  required: boolean;
  fieldCategory: FieldCategory;
  confidence: number;
  options?: string[]; // For select/radio fields
  attributes: Record<string, string>;
}

export type FieldCategory =
  | 'personal_info'
  | 'contact'
  | 'employment'
  | 'education'
  | 'skills'
  | 'experience'
  | 'salary'
  | 'availability'
  | 'authorization'
  | 'documents'
  | 'custom_question'
  | 'unknown';

@Injectable()
export class FieldDetectionEngine {
  private readonly logger = new Logger(FieldDetectionEngine.name);

  // Field detection patterns
  private readonly fieldPatterns: Map<FieldCategory, RegExp[]> = new Map([
    [
      'personal_info',
      [
        /first[\s_-]?name/i,
        /last[\s_-]?name/i,
        /full[\s_-]?name/i,
        /middle[\s_-]?name/i,
        /preferred[\s_-]?name/i,
        /suffix/i,
        /prefix/i,
        /title/i,
        /date[\s_-]?of[\s_-]?birth/i,
        /dob/i,
        /gender/i,
        /veteran[\s_-]?status/i,
        /disability/i,
        /ethnicity/i,
        /race/i,
      ],
    ],
    [
      'contact',
      [
        /email/i,
        /phone/i,
        /mobile/i,
        /cell/i,
        /telephone/i,
        /address/i,
        /street/i,
        /city/i,
        /state/i,
        /zip[\s_-]?code/i,
        /postal[\s_-]?code/i,
        /country/i,
        /linkedin/i,
        /portfolio/i,
        /website/i,
        /github/i,
      ],
    ],
    [
      'employment',
      [
        /company[\s_-]?name/i,
        /employer/i,
        /job[\s_-]?title/i,
        /position/i,
        /start[\s_-]?date/i,
        /end[\s_-]?date/i,
        /responsibilities/i,
        /duties/i,
        /achievements/i,
        /reason[\s_-]?for[\s_-]?leaving/i,
        /supervisor/i,
        /manager/i,
        /may[\s_-]?we[\s_-]?contact/i,
      ],
    ],
    [
      'education',
      [
        /school[\s_-]?name/i,
        /university/i,
        /college/i,
        /institution/i,
        /degree/i,
        /major/i,
        /minor/i,
        /field[\s_-]?of[\s_-]?study/i,
        /gpa/i,
        /graduation[\s_-]?date/i,
        /graduation[\s_-]?year/i,
      ],
    ],
    [
      'skills',
      [
        /skills/i,
        /competencies/i,
        /proficiencies/i,
        /certifications/i,
        /licenses/i,
        /languages/i,
        /software/i,
        /tools/i,
      ],
    ],
    [
      'experience',
      [
        /years[\s_-]?of[\s_-]?experience/i,
        /experience[\s_-]?level/i,
        /total[\s_-]?experience/i,
        /relevant[\s_-]?experience/i,
      ],
    ],
    [
      'salary',
      [
        /salary/i,
        /compensation/i,
        /pay/i,
        /hourly[\s_-]?rate/i,
        /annual[\s_-]?salary/i,
        /expected[\s_-]?salary/i,
        /desired[\s_-]?salary/i,
        /salary[\s_-]?expectation/i,
      ],
    ],
    [
      'availability',
      [
        /start[\s_-]?date/i,
        /available[\s_-]?to[\s_-]?start/i,
        /notice[\s_-]?period/i,
        /availability/i,
        /when[\s_-]?can[\s_-]?you[\s_-]?start/i,
      ],
    ],
    [
      'authorization',
      [
        /work[\s_-]?authorization/i,
        /visa[\s_-]?status/i,
        /sponsorship/i,
        /legally[\s_-]?authorized/i,
        /citizen/i,
        /permanent[\s_-]?resident/i,
        /require[\s_-]?sponsorship/i,
        /eligible[\s_-]?to[\s_-]?work/i,
      ],
    ],
    [
      'documents',
      [
        /resume/i,
        /cv/i,
        /cover[\s_-]?letter/i,
        /portfolio/i,
        /transcript/i,
        /attachment/i,
        /upload/i,
        /document/i,
      ],
    ],
  ]);

  /**
   * Detect all form fields on a page
   */
  async detectFields(page: Page): Promise<DetectedField[]> {
    this.logger.log('Starting field detection...');

    const fields: DetectedField[] = [];

    // Detect input fields
    const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    for (const input of inputs) {
      const field = await this.analyzeInputField(page, input);
      if (field) {
        fields.push(field);
      }
    }

    // Detect textarea fields
    const textareas = await page.$$('textarea');
    for (const textarea of textareas) {
      const field = await this.analyzeTextareaField(page, textarea);
      if (field) {
        fields.push(field);
      }
    }

    // Detect select fields
    const selects = await page.$$('select');
    for (const select of selects) {
      const field = await this.analyzeSelectField(page, select);
      if (field) {
        fields.push(field);
      }
    }

    this.logger.log(`Detected ${fields.length} fields`);
    return fields;
  }

  /**
   * Analyze an input field
   */
  private async analyzeInputField(page: Page, element: ElementHandle): Promise<DetectedField | null> {
    try {
      const attributes = await this.getElementAttributes(element);
      const label = await this.findFieldLabel(page, element, attributes);
      const type = this.determineInputType(attributes);

      if (!attributes.id && !attributes.name && !label) {
        return null;
      }

      const category = this.categorizeField(label, attributes);
      const selector = this.buildSelector(attributes);

      return {
        id: attributes.id || attributes.name || `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        selector,
        type,
        label,
        placeholder: attributes.placeholder,
        required: attributes.required === 'true' || attributes['aria-required'] === 'true',
        fieldCategory: category,
        confidence: this.calculateDetectionConfidence(label, attributes, category),
        attributes,
      };
    } catch (error) {
      this.logger.warn(`Error analyzing input field: ${error.message}`);
      return null;
    }
  }

  /**
   * Analyze a textarea field
   */
  private async analyzeTextareaField(page: Page, element: ElementHandle): Promise<DetectedField | null> {
    try {
      const attributes = await this.getElementAttributes(element);
      const label = await this.findFieldLabel(page, element, attributes);

      const category = this.categorizeField(label, attributes);
      const selector = this.buildSelector(attributes);

      return {
        id: attributes.id || attributes.name || `textarea-${Date.now()}`,
        selector,
        type: 'textarea',
        label,
        placeholder: attributes.placeholder,
        required: attributes.required === 'true',
        fieldCategory: category,
        confidence: this.calculateDetectionConfidence(label, attributes, category),
        attributes,
      };
    } catch (error) {
      this.logger.warn(`Error analyzing textarea field: ${error.message}`);
      return null;
    }
  }

  /**
   * Analyze a select field
   */
  private async analyzeSelectField(page: Page, element: ElementHandle): Promise<DetectedField | null> {
    try {
      const attributes = await this.getElementAttributes(element);
      const label = await this.findFieldLabel(page, element, attributes);
      const options = await this.getSelectOptions(element);

      const category = this.categorizeField(label, attributes);
      const selector = this.buildSelector(attributes);

      return {
        id: attributes.id || attributes.name || `select-${Date.now()}`,
        selector,
        type: 'select',
        label,
        required: attributes.required === 'true',
        fieldCategory: category,
        confidence: this.calculateDetectionConfidence(label, attributes, category),
        options,
        attributes,
      };
    } catch (error) {
      this.logger.warn(`Error analyzing select field: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all relevant attributes from an element
   */
  private async getElementAttributes(element: ElementHandle): Promise<Record<string, string>> {
    return element.evaluate((el: Element) => {
      const attrs: Record<string, string> = {};
      const attributeNames = ['id', 'name', 'type', 'placeholder', 'required', 'aria-required',
                             'aria-label', 'data-field', 'class', 'autocomplete', 'pattern'];

      for (const attr of attributeNames) {
        const value = el.getAttribute(attr);
        if (value) {
          attrs[attr] = value;
        }
      }
      return attrs;
    });
  }

  /**
   * Find the label for a field
   */
  private async findFieldLabel(
    page: Page,
    element: ElementHandle,
    attributes: Record<string, string>,
  ): Promise<string> {
    // Try aria-label
    if (attributes['aria-label']) {
      return attributes['aria-label'];
    }

    // Try associated label element
    if (attributes.id) {
      const label = await page.$(`label[for="${attributes.id}"]`);
      if (label) {
        const text = await label.textContent();
        if (text) {return text.trim();}
      }
    }

    // Try parent label
    const parentLabel = await element.evaluate((el: Element) => {
      const parent = el.closest('label');
      if (parent) {
        return parent.textContent?.trim() || '';
      }
      return '';
    });
    if (parentLabel) {return parentLabel;}

    // Try nearby text
    const nearbyText = await element.evaluate((el: Element) => {
      // Check previous sibling
      const prev = el.previousElementSibling;
      if (prev && prev.tagName === 'LABEL') {
        return prev.textContent?.trim() || '';
      }

      // Check parent's previous sibling
      const parent = el.parentElement;
      if (parent) {
        const parentPrev = parent.previousElementSibling;
        if (parentPrev && (parentPrev.tagName === 'LABEL' || parentPrev.tagName === 'SPAN')) {
          return parentPrev.textContent?.trim() || '';
        }
      }

      return '';
    });
    if (nearbyText) {return nearbyText;}

    // Fall back to name or placeholder
    return attributes.name || attributes.placeholder || '';
  }

  /**
   * Determine input type
   */
  private determineInputType(attributes: Record<string, string>): DetectedField['type'] {
    const type = attributes.type?.toLowerCase() || 'text';

    switch (type) {
      case 'email':
        return 'email';
      case 'tel':
        return 'phone';
      case 'file':
        return 'file';
      case 'checkbox':
        return 'checkbox';
      case 'radio':
        return 'radio';
      case 'date':
        return 'date';
      case 'number':
        return 'number';
      default:
        return 'text';
    }
  }

  /**
   * Categorize a field based on its label and attributes
   */
  private categorizeField(label: string, attributes: Record<string, string>): FieldCategory {
    const searchText = `${label} ${attributes.name || ''} ${attributes.id || ''} ${attributes.placeholder || ''}`.toLowerCase();

    for (const [category, patterns] of this.fieldPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(searchText)) {
          return category;
        }
      }
    }

    // Special handling for file inputs
    if (attributes.type === 'file') {
      return 'documents';
    }

    return 'unknown';
  }

  /**
   * Build a reliable selector for the field
   */
  private buildSelector(attributes: Record<string, string>): string {
    if (attributes.id) {
      return `#${attributes.id}`;
    }
    if (attributes.name) {
      return `[name="${attributes.name}"]`;
    }
    if (attributes['data-field']) {
      return `[data-field="${attributes['data-field']}"]`;
    }
    // Fall back to class-based selector (less reliable)
    if (attributes.class) {
      const firstClass = attributes.class.split(' ')[0];
      return `.${firstClass}`;
    }
    return '';
  }

  /**
   * Calculate detection confidence score
   */
  private calculateDetectionConfidence(
    label: string,
    attributes: Record<string, string>,
    category: FieldCategory,
  ): number {
    let confidence = 50; // Base confidence

    // Boost for having an ID
    if (attributes.id) {confidence += 15;}

    // Boost for having a name
    if (attributes.name) {confidence += 10;}

    // Boost for having a clear label
    if (label && label.length > 2) {confidence += 15;}

    // Boost for recognized category
    if (category !== 'unknown') {confidence += 10;}

    // Boost for semantic HTML attributes
    if (attributes.autocomplete) {confidence += 5;}
    if (attributes['aria-label']) {confidence += 5;}

    return Math.min(100, confidence);
  }

  /**
   * Get options from a select element
   */
  private async getSelectOptions(element: ElementHandle): Promise<string[]> {
    return element.$$eval('option', (options) =>
      options.map((opt) => opt.textContent?.trim() || '').filter(Boolean),
    );
  }
}

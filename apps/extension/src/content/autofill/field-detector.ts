/**
 * Field detection engine for form autofill
 * Identifies and classifies form fields
 */

import { FormField, FieldType } from './types';

export class FieldDetector {
  private readonly inputSelectors = [
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
    'textarea',
    'select',
  ];

  /**
   * Detect all form fields within an element
   */
  public detectAllFields(container: HTMLElement): FormField[] {
    const fields: FormField[] = [];
    const selector = this.inputSelectors.join(', ');
    const elements = container.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(selector);

    elements.forEach((element) => {
      // Skip hidden elements
      if (this.isHidden(element)) {
        return;
      }

      try {
        const field = this.createFormField(element);
        if (field) {
          fields.push(field);
        }
      } catch (error) {
        console.warn('Failed to detect field:', element, error);
      }
    });

    return fields;
  }

  /**
   * Create a FormField object from an HTML element
   */
  private createFormField(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  ): FormField | null {
    const type = this.classifyField(element);
    const label = this.getFieldLabel(element);
    const required = this.isRequired(element);

    const field: FormField = {
      element,
      type,
      label,
      name: element.name || element.id || '',
      id: element.id || '',
      placeholder: 'placeholder' in element ? element.placeholder : undefined,
      required,
    };

    // Add options for select elements
    if (element instanceof HTMLSelectElement) {
      field.options = Array.from(element.options).map((opt) => opt.text);
    }

    // Add options for radio buttons
    if (element instanceof HTMLInputElement && element.type === 'radio' && element.name) {
      const radioGroup = document.querySelectorAll<HTMLInputElement>(
        `input[type="radio"][name="${element.name}"]`
      );
      field.options = Array.from(radioGroup).map(
        (radio) => this.getFieldLabel(radio) || radio.value
      );
    }

    return field;
  }

  /**
   * Classify field type
   */
  public classifyField(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  ): FieldType {
    if (element instanceof HTMLTextAreaElement) {
      return 'textarea';
    }

    if (element instanceof HTMLSelectElement) {
      return 'select';
    }

    if (element instanceof HTMLInputElement) {
      const type = element.type.toLowerCase();

      switch (type) {
        case 'email':
          return 'email';
        case 'tel':
          return 'phone';
        case 'url':
          return 'url';
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
        case 'text':
        case 'search':
        default:
          // Try to infer from context
          return this.inferFieldType(element);
      }
    }

    return 'text';
  }

  /**
   * Infer field type from context (label, name, placeholder, etc.)
   */
  private inferFieldType(element: HTMLInputElement): FieldType {
    const context = this.getFieldContext(element).toLowerCase();

    if (this.matchesPattern(context, ['email', 'e-mail'])) {
      return 'email';
    }

    if (this.matchesPattern(context, ['phone', 'mobile', 'telephone', 'tel'])) {
      return 'phone';
    }

    if (this.matchesPattern(context, ['website', 'url', 'portfolio', 'linkedin', 'github'])) {
      return 'url';
    }

    if (this.matchesPattern(context, ['date', 'birth', 'graduation', 'start', 'end'])) {
      return 'date';
    }

    if (
      this.matchesPattern(context, ['age', 'years', 'salary', 'gpa', 'experience', 'number'])
    ) {
      return 'number';
    }

    return 'text';
  }

  /**
   * Get field label
   */
  public getFieldLabel(element: HTMLElement): string {
    // Try explicit label element
    if (element.id) {
      const label = document.querySelector<HTMLLabelElement>(`label[for="${element.id}"]`);
      if (label) {
        return this.cleanLabel(label.textContent || '');
      }
    }

    // Try parent label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      // Get label text excluding the input element's value
      const labelText = Array.from(parentLabel.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join(' ');
      if (labelText.trim()) {
        return this.cleanLabel(labelText);
      }
    }

    // Try aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return this.cleanLabel(ariaLabel);
    }

    // Try aria-labelledby
    const ariaLabelledby = element.getAttribute('aria-labelledby');
    if (ariaLabelledby) {
      const labelElement = document.getElementById(ariaLabelledby);
      if (labelElement) {
        return this.cleanLabel(labelElement.textContent || '');
      }
    }

    // Try placeholder
    if ('placeholder' in element && element.placeholder) {
      return this.cleanLabel(element.getAttribute('name') || '');
    }

    // Try name attribute
    if (element.getAttribute('name')) {
      return this.cleanLabel(element.getAttribute('name')!);
    }

    // Try data attributes
    const dataLabel =
      element.getAttribute('data-label') ||
      element.getAttribute('data-field-name') ||
      element.getAttribute('data-automation-id');
    if (dataLabel) {
      return this.cleanLabel(dataLabel);
    }

    // Try previous sibling text
    const prevSibling = element.previousElementSibling;
    if (prevSibling && prevSibling.textContent) {
      return this.cleanLabel(prevSibling.textContent);
    }

    // Try finding nearby text
    const parent = element.parentElement;
    if (parent) {
      const textContent = Array.from(parent.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
        .map((node) => node.textContent)
        .join(' ');
      if (textContent.trim()) {
        return this.cleanLabel(textContent);
      }
    }

    return '';
  }

  /**
   * Check if field is required
   */
  public isRequired(element: HTMLElement): boolean {
    // Check required attribute
    if ('required' in element && (element as HTMLInputElement).required) {
      return true;
    }

    // Check aria-required
    if (element.getAttribute('aria-required') === 'true') {
      return true;
    }

    // Check for required indicator in label
    const label = this.getFieldLabel(element);
    if (label && /[*]|required/i.test(label)) {
      return true;
    }

    // Check for required class
    if (
      element.classList.contains('required') ||
      element.closest('.required') ||
      element.closest('[class*="required"]')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get field context (combines label, name, id, placeholder)
   */
  private getFieldContext(element: HTMLElement): string {
    const parts = [
      this.getFieldLabel(element),
      element.getAttribute('name') || '',
      element.id || '',
      'placeholder' in element ? (element as HTMLInputElement).placeholder : '',
      element.getAttribute('data-automation-id') || '',
      element.getAttribute('data-field-name') || '',
    ];

    return parts.filter(Boolean).join(' ');
  }

  /**
   * Check if context matches any of the patterns
   */
  private matchesPattern(context: string, patterns: string[]): boolean {
    return patterns.some((pattern) => context.includes(pattern.toLowerCase()));
  }

  /**
   * Clean label text
   */
  private cleanLabel(text: string): string {
    return text
      .replace(/\*/g, '') // Remove asterisks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[:：]/g, '') // Remove colons
      .trim();
  }

  /**
   * Check if element is hidden
   */
  private isHidden(element: HTMLElement): boolean {
    // Check display none
    if (element.offsetWidth === 0 && element.offsetHeight === 0) {
      return true;
    }

    // Check visibility
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return true;
    }

    // Check opacity
    if (style.opacity === '0') {
      return true;
    }

    return false;
  }

  /**
   * Group related fields (e.g., address fields, date ranges)
   */
  public groupRelatedFields(fields: FormField[]): Map<string, FormField[]> {
    const groups = new Map<string, FormField[]>();

    // Group by common patterns
    fields.forEach((field) => {
      const label = field.label.toLowerCase();

      if (label.includes('address') || label.includes('street') || label.includes('city')) {
        this.addToGroup(groups, 'address', field);
      } else if (label.includes('start') || label.includes('end')) {
        this.addToGroup(groups, 'dateRange', field);
      } else if (label.includes('first') && label.includes('name')) {
        this.addToGroup(groups, 'name', field);
      } else if (label.includes('last') && label.includes('name')) {
        this.addToGroup(groups, 'name', field);
      } else {
        this.addToGroup(groups, 'other', field);
      }
    });

    return groups;
  }

  private addToGroup(groups: Map<string, FormField[]>, key: string, field: FormField): void {
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(field);
  }

  /**
   * Find fields by keyword
   */
  public findFieldsByKeyword(fields: FormField[], keyword: string): FormField[] {
    const normalizedKeyword = keyword.toLowerCase();
    return fields.filter((field) => {
      const context = this.getFieldContext(field.element).toLowerCase();
      return context.includes(normalizedKeyword);
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormMapping } from './entities/form-mapping.entity';
import { Page } from 'playwright';

export interface FormField {
  selector: string;
  type: string;
  label?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  semanticField?: string;
}

@Injectable()
export class FormMappingService {
  private readonly logger = new Logger(FormMappingService.name);

  constructor(
    @InjectRepository(FormMapping)
    private readonly formMappingRepository: Repository<FormMapping>,
  ) {}

  async detectFormFields(page: Page): Promise<FormField[]> {
    this.logger.log('Detecting form fields on page');

    const fields = await page.evaluate(() => {
      const formFields: any[] = [];
      const inputs = document.querySelectorAll('input, select, textarea');

      inputs.forEach((element: any) => {
        const field = {
          selector: '',
          type: element.type || element.tagName.toLowerCase(),
          label: '',
          placeholder: element.placeholder || '',
          name: element.name || '',
          id: element.id || '',
          required: element.required || false,
        };

        // Generate selector
        if (element.id) {
          field.selector = `#${element.id}`;
        } else if (element.name) {
          field.selector = `[name="${element.name}"]`;
        } else {
          field.selector = element.tagName.toLowerCase();
        }

        // Find associated label
        if (element.id) {
          const label = document.querySelector(`label[for="${element.id}"]`);
          if (label) {
            field.label = label.textContent?.trim() || '';
          }
        }

        // Look for nearby label
        if (!field.label) {
          const parent = element.closest('div, fieldset');
          if (parent) {
            const label = parent.querySelector('label');
            if (label) {
              field.label = label.textContent?.trim() || '';
            }
          }
        }

        formFields.push(field);
      });

      return formFields;
    });

    // Detect semantic meaning of each field
    const enrichedFields = fields.map(field => ({
      ...field,
      semanticField: this.detectSemanticField(field),
    }));

    return enrichedFields;
  }

  private detectSemanticField(field: FormField): string {
    const text = `${field.label} ${field.placeholder} ${field.name} ${field.id}`.toLowerCase();

    // Email detection
    if (text.includes('email') || field.type === 'email') {
      return 'email';
    }

    // Phone detection
    if (text.includes('phone') || text.includes('mobile') || field.type === 'tel') {
      return 'phone';
    }

    // Name detection
    if (text.includes('first name') || text.includes('firstname')) {
      return 'first_name';
    }
    if (text.includes('last name') || text.includes('lastname') || text.includes('surname')) {
      return 'last_name';
    }
    if (text.includes('full name') && !text.includes('first') && !text.includes('last')) {
      return 'full_name';
    }

    // Address fields
    if (text.includes('address') && text.includes('line 1')) {
      return 'address_line1';
    }
    if (text.includes('address') && text.includes('line 2')) {
      return 'address_line2';
    }
    if (text.includes('city')) {
      return 'city';
    }
    if (text.includes('state') || text.includes('province')) {
      return 'state';
    }
    if (text.includes('zip') || text.includes('postal')) {
      return 'postal_code';
    }
    if (text.includes('country')) {
      return 'country';
    }

    // Resume/CV
    if (text.includes('resume') || text.includes('cv')) {
      return 'resume';
    }

    // Cover letter
    if (text.includes('cover letter')) {
      return 'cover_letter';
    }

    // LinkedIn
    if (text.includes('linkedin')) {
      return 'linkedin_url';
    }

    // Portfolio/Website
    if (text.includes('portfolio') || text.includes('website')) {
      return 'portfolio_url';
    }

    // Years of experience
    if (text.includes('years') && text.includes('experience')) {
      return 'years_of_experience';
    }

    // Current company
    if (text.includes('current') && (text.includes('company') || text.includes('employer'))) {
      return 'current_company';
    }

    // Current title
    if (text.includes('current') && text.includes('title')) {
      return 'current_title';
    }

    // Salary expectations
    if (text.includes('salary') || text.includes('compensation')) {
      return 'salary_expectation';
    }

    // Availability
    if (text.includes('available') || text.includes('start date')) {
      return 'availability';
    }

    // Work authorization
    if (text.includes('authorized') || text.includes('visa') || text.includes('work permit')) {
      return 'work_authorization';
    }

    // Sponsorship
    if (text.includes('sponsor')) {
      return 'requires_sponsorship';
    }

    // Custom question
    if (text.includes('why') || text.includes('how') || text.includes('describe')) {
      return 'custom_question';
    }

    return 'unknown';
  }

  async saveMapping(
    companyName: string,
    atsPlatform: string,
    field: FormField,
  ): Promise<FormMapping> {
    const existingMapping = await this.formMappingRepository.findOne({
      where: {
        company_name: companyName,
        ats_platform: atsPlatform,
        field_selector: field.selector,
      },
    });

    if (existingMapping) {
      existingMapping.usage_count += 1;
      return await this.formMappingRepository.save(existingMapping);
    }

    const mapping = this.formMappingRepository.create({
      company_name: companyName,
      ats_platform: atsPlatform,
      field_selector: field.selector,
      field_type: field.type,
      semantic_field: field.semanticField || 'unknown',
      field_attributes: {
        label: field.label,
        placeholder: field.placeholder,
        name: field.name,
        id: field.id,
        required: field.required,
      },
    });

    return await this.formMappingRepository.save(mapping);
  }

  async getMappings(companyName: string, atsPlatform: string): Promise<FormMapping[]> {
    return await this.formMappingRepository.find({
      where: {
        company_name: companyName,
        ats_platform: atsPlatform,
        is_active: true,
      },
      order: {
        confidence_score: 'DESC',
        usage_count: 'DESC',
      },
    });
  }

  async generateAIAnswer(question: string, userProfile: any): Promise<string> {
    // This would integrate with your AI service (e.g., OpenAI, Anthropic)
    // For now, return a placeholder
    this.logger.log(`Generating AI answer for question: ${question}`);

    // Common patterns and generic answers
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('why') && lowerQuestion.includes('work')) {
      return `I am excited about this opportunity because it aligns with my career goals and expertise. I am particularly interested in contributing to your team's success and growing professionally in this role.`;
    }

    if (lowerQuestion.includes('relocate')) {
      return 'Yes, I am open to relocation for the right opportunity.';
    }

    if (lowerQuestion.includes('visa') || lowerQuestion.includes('authorized')) {
      return 'Yes, I am authorized to work in this location.';
    }

    if (lowerQuestion.includes('sponsor')) {
      return 'No, I do not require sponsorship.';
    }

    // Default response
    return 'Please see my resume for detailed information regarding this question.';
  }
}

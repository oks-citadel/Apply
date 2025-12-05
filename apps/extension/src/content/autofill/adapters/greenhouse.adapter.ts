/**
 * Greenhouse ATS Adapter
 * Handles Greenhouse's simple single-page application form
 */

import { BaseAdapter } from '../base-adapter';
import { AdapterMetadata, FieldMapping, ResumeData } from '../types';

export class GreenhouseAdapter extends BaseAdapter {
  public getMetadata(): AdapterMetadata {
    return {
      name: 'Greenhouse',
      platform: 'greenhouse',
      version: '1.0.0',
      features: {
        multiPage: false,
        dynamicForms: false,
        fileUpload: true,
        customQuestions: true,
        profileImport: false,
        autoSave: false,
      },
    };
  }

  public getFormSelectors(): string[] {
    return [
      '#application_form',
      '.application-form',
      'form[action*="applications"]',
    ];
  }

  public isValidForm(): boolean {
    const hasGreenhouseForm = document.querySelector('#application_form') !== null;
    const hasGreenhouseUrl = /greenhouse\.io|grnh\.se/i.test(window.location.href);

    return hasGreenhouseForm || hasGreenhouseUrl;
  }

  public getFieldMappings(): FieldMapping[] {
    return [
      // Personal Information
      {
        fieldType: 'firstName',
        selectors: [
          'input[name="job_application[first_name]"]',
          '#first_name',
        ],
        getValue: (resume) => resume.personalInfo.firstName,
      },
      {
        fieldType: 'lastName',
        selectors: [
          'input[name="job_application[last_name]"]',
          '#last_name',
        ],
        getValue: (resume) => resume.personalInfo.lastName,
      },
      {
        fieldType: 'email',
        selectors: [
          'input[name="job_application[email]"]',
          '#email',
        ],
        getValue: (resume) => resume.personalInfo.email,
      },
      {
        fieldType: 'phone',
        selectors: [
          'input[name="job_application[phone]"]',
          '#phone',
        ],
        getValue: (resume) => resume.personalInfo.phone,
      },
      {
        fieldType: 'resume',
        selectors: [
          'input[name="job_application[resume]"]',
          '#resume',
        ],
        getValue: (resume) => resume.resumeUrl || '',
      },
      {
        fieldType: 'coverLetter',
        selectors: [
          'textarea[name="job_application[cover_letter]"]',
          '#cover_letter',
        ],
        getValue: (resume) => resume.summary,
      },
      {
        fieldType: 'linkedin',
        selectors: [
          'input[name="job_application[social_media][linkedin]"]',
          'input[placeholder*="linkedin"]',
        ],
        getValue: (resume) => resume.personalInfo.linkedin,
      },
      {
        fieldType: 'github',
        selectors: [
          'input[name="job_application[social_media][github]"]',
          'input[placeholder*="github"]',
        ],
        getValue: (resume) => resume.personalInfo.github,
      },
      {
        fieldType: 'website',
        selectors: [
          'input[name="job_application[social_media][website]"]',
          'input[placeholder*="website"]',
          'input[placeholder*="portfolio"]',
        ],
        getValue: (resume) => resume.personalInfo.website || resume.personalInfo.portfolio,
      },
      {
        fieldType: 'location',
        selectors: [
          'input[name="job_application[location]"]',
          '#location',
        ],
        getValue: (resume) => {
          const addr = resume.personalInfo.address;
          if (addr) {
            return addr.full || `${addr.city}, ${addr.state}`;
          }
          return '';
        },
      },
    ];
  }

  protected async initialize(): Promise<void> {
    // Wait for form to be visible
    await this.waitForElement('#application_form', { timeout: 5000 });
    await this.delay(300);
  }

  /**
   * Handle custom questions specific to Greenhouse
   */
  protected async handleCustomQuestions(): Promise<any[]> {
    const questions = await super.handleCustomQuestions();

    // Handle EEOC questions
    await this.handleEEOCQuestions();

    return questions;
  }

  /**
   * Handle EEOC (Equal Employment Opportunity Commission) questions
   */
  private async handleEEOCQuestions(): Promise<void> {
    const eeocSection = document.querySelector('.eeoc-questions, [class*="eeoc"]');

    if (!eeocSection) {
      return;
    }

    // These are typically optional, so we'll select "prefer not to answer"
    const preferNotToAnswerOptions = eeocSection.querySelectorAll<HTMLInputElement>(
      'input[value*="prefer"], input[value*="decline"], input[value*="no answer"]'
    );

    for (const option of Array.from(preferNotToAnswerOptions)) {
      if (option.type === 'radio' || option.type === 'checkbox') {
        option.checked = true;
        this.triggerEvents(option);
        await this.delay(100);
      }
    }
  }

  /**
   * Handle resume upload with text fallback
   */
  protected async handleFileUploads(): Promise<void> {
    const fileInput = document.querySelector<HTMLInputElement>('input[name="job_application[resume]"]');
    const textResumeOption = document.querySelector<HTMLTextAreaElement>('#resume_text');

    if (fileInput && this.resumeData.resumeFile) {
      try {
        await this.fileUploader.handleFileUpload(fileInput, this.resumeData.resumeFile);
      } catch (error) {
        console.warn('File upload failed, trying text fallback:', error);

        // If file upload fails and text option exists, use summary
        if (textResumeOption && this.resumeData.summary) {
          textResumeOption.value = this.generateTextResume(this.resumeData);
          this.triggerEvents(textResumeOption);
        }
      }
    } else if (textResumeOption && this.resumeData.summary) {
      // Use text option if file input not available
      textResumeOption.value = this.generateTextResume(this.resumeData);
      this.triggerEvents(textResumeOption);
    }
  }

  /**
   * Generate text resume from resume data
   */
  private generateTextResume(resume: ResumeData): string {
    const sections: string[] = [];

    // Personal Info
    sections.push(`${resume.personalInfo.fullName}`);
    sections.push(`${resume.personalInfo.email} | ${resume.personalInfo.phone}`);
    if (resume.personalInfo.address) {
      sections.push(resume.personalInfo.address.full || `${resume.personalInfo.address.city}, ${resume.personalInfo.address.state}`);
    }
    sections.push('');

    // Summary
    if (resume.summary) {
      sections.push('SUMMARY');
      sections.push(resume.summary);
      sections.push('');
    }

    // Experience
    if (resume.experience && resume.experience.length > 0) {
      sections.push('EXPERIENCE');
      resume.experience.forEach((exp) => {
        const endDate = exp.current ? 'Present' : exp.endDate?.toLocaleDateString();
        sections.push(`${exp.position} at ${exp.company}`);
        sections.push(`${exp.startDate.toLocaleDateString()} - ${endDate}`);
        sections.push(exp.description);
        sections.push('');
      });
    }

    // Education
    if (resume.education && resume.education.length > 0) {
      sections.push('EDUCATION');
      resume.education.forEach((edu) => {
        sections.push(`${edu.degree} in ${edu.field}`);
        sections.push(edu.institution);
        if (edu.endDate) {
          sections.push(`Graduated: ${edu.endDate.toLocaleDateString()}`);
        }
        sections.push('');
      });
    }

    // Skills
    if (resume.skills && resume.skills.length > 0) {
      sections.push('SKILLS');
      sections.push(resume.skills.join(', '));
    }

    return sections.join('\n');
  }

  /**
   * Override submit to handle Greenhouse-specific submission
   */
  protected async submitForm(): Promise<any> {
    // Greenhouse has terms and conditions checkbox sometimes
    const termsCheckbox = document.querySelector<HTMLInputElement>(
      'input[name*="terms"], input[name*="agree"], input[type="checkbox"][required]'
    );

    if (termsCheckbox && !termsCheckbox.checked) {
      termsCheckbox.checked = true;
      this.triggerEvents(termsCheckbox);
      await this.delay(200);
    }

    return super.submitForm();
  }
}

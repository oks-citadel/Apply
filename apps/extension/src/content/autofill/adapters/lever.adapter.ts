/**
 * Lever ATS Adapter
 * Handles Lever's clean, modern application forms
 */

import { BaseAdapter } from '../base-adapter';
import { AdapterMetadata, FieldMapping } from '../types';

export class LeverAdapter extends BaseAdapter {
  public getMetadata(): AdapterMetadata {
    return {
      name: 'Lever',
      platform: 'lever',
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
      '.application-form',
      'form.application',
      '[class*="lever-application"]',
    ];
  }

  public isValidForm(): boolean {
    const hasLeverForm = document.querySelector('.application-form') !== null;
    const hasLeverUrl = /lever\.co|jobs\.lever\.co/i.test(window.location.href);

    return hasLeverForm || hasLeverUrl;
  }

  public getFieldMappings(): FieldMapping[] {
    return [
      {
        fieldType: 'fullName',
        selectors: [
          'input[name="name"]',
          'input[placeholder*="Full name"]',
        ],
        getValue: (resume) => resume.personalInfo.fullName,
      },
      {
        fieldType: 'email',
        selectors: [
          'input[name="email"]',
          'input[type="email"]',
        ],
        getValue: (resume) => resume.personalInfo.email,
      },
      {
        fieldType: 'phone',
        selectors: [
          'input[name="phone"]',
          'input[type="tel"]',
        ],
        getValue: (resume) => resume.personalInfo.phone,
      },
      {
        fieldType: 'location',
        selectors: [
          'input[name="location"]',
          'input[placeholder*="location"]',
        ],
        getValue: (resume) => {
          const addr = resume.personalInfo.address;
          if (addr) {
            return addr.full || `${addr.city}, ${addr.state}`;
          }
          return '';
        },
      },
      {
        fieldType: 'resume',
        selectors: [
          'input[name="resume"]',
          'input[type="file"]',
        ],
        getValue: (resume) => resume.resumeUrl || '',
      },
      {
        fieldType: 'linkedin',
        selectors: [
          'input[name="urls[LinkedIn]"]',
          'input[placeholder*="linkedin"]',
        ],
        getValue: (resume) => resume.personalInfo.linkedin,
      },
      {
        fieldType: 'github',
        selectors: [
          'input[name="urls[GitHub]"]',
          'input[placeholder*="github"]',
        ],
        getValue: (resume) => resume.personalInfo.github,
      },
      {
        fieldType: 'portfolio',
        selectors: [
          'input[name="urls[Portfolio]"]',
          'input[name="urls[Website]"]',
          'input[placeholder*="portfolio"]',
        ],
        getValue: (resume) => resume.personalInfo.portfolio || resume.personalInfo.website,
      },
      {
        fieldType: 'additionalInfo',
        selectors: [
          'textarea[name="comments"]',
          'textarea[placeholder*="additional"]',
        ],
        getValue: (resume) => resume.summary,
      },
    ];
  }

  protected async initialize(): Promise<void> {
    await this.waitForElement('.application-form', { timeout: 5000 });
    await this.delay(300);
  }

  /**
   * Handle resume upload with paste option
   */
  protected async handleFileUploads(): Promise<void> {
    // Lever sometimes has both upload and paste options
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    const pasteOption = document.querySelector<HTMLTextAreaElement>('textarea[name="resume_text"]');

    if (fileInput && this.resumeData.resumeFile) {
      try {
        await this.fileUploader.handleFileUpload(fileInput, this.resumeData.resumeFile);
      } catch (error) {
        console.warn('File upload failed:', error);

        // Try paste option if available
        if (pasteOption) {
          await this.handlePasteResume(pasteOption);
        }
      }
    } else if (pasteOption) {
      await this.handlePasteResume(pasteOption);
    }
  }

  /**
   * Handle paste resume option
   */
  private async handlePasteResume(textarea: HTMLTextAreaElement): Promise<void> {
    const resumeText = this.generateTextResume();
    textarea.value = resumeText;
    this.triggerEvents(textarea);
  }

  /**
   * Generate text resume
   */
  private generateTextResume(): string {
    const resume = this.resumeData;
    const parts: string[] = [];

    // Header
    parts.push(resume.personalInfo.fullName);
    parts.push(`${resume.personalInfo.email} | ${resume.personalInfo.phone}`);
    if (resume.personalInfo.linkedin) {
      parts.push(resume.personalInfo.linkedin);
    }
    parts.push('\n');

    // Summary
    if (resume.summary) {
      parts.push(resume.summary);
      parts.push('\n');
    }

    // Experience
    if (resume.experience?.length) {
      parts.push('WORK EXPERIENCE\n');
      resume.experience.forEach((exp) => {
        const endDate = exp.current ? 'Present' : exp.endDate?.getFullYear();
        parts.push(`${exp.position} | ${exp.company} | ${exp.startDate.getFullYear()} - ${endDate}`);
        parts.push(exp.description);
        parts.push('\n');
      });
    }

    // Education
    if (resume.education?.length) {
      parts.push('EDUCATION\n');
      resume.education.forEach((edu) => {
        parts.push(`${edu.degree} in ${edu.field} | ${edu.institution}`);
        if (edu.endDate) {
          parts.push(`Graduated: ${edu.endDate.getFullYear()}`);
        }
        parts.push('\n');
      });
    }

    // Skills
    if (resume.skills?.length) {
      parts.push('SKILLS\n');
      parts.push(resume.skills.join(' • '));
    }

    return parts.join('\n');
  }

  /**
   * Handle Lever's link fields
   */
  protected async fillFields(fields: any[]): Promise<any[]> {
    const filledFields = await super.fillFields(fields);

    // Handle social links section separately
    await this.fillSocialLinks();

    return filledFields;
  }

  /**
   * Fill social links section
   */
  private async fillSocialLinks(): Promise<void> {
    const linksSection = document.querySelector('.links-section, [class*="social"]');

    if (!linksSection) {
      return;
    }

    const links = [
      { name: 'LinkedIn', url: this.resumeData.personalInfo.linkedin },
      { name: 'GitHub', url: this.resumeData.personalInfo.github },
      { name: 'Portfolio', url: this.resumeData.personalInfo.portfolio },
      { name: 'Website', url: this.resumeData.personalInfo.website },
    ];

    for (const link of links) {
      if (!link.url) continue;

      const input = linksSection.querySelector<HTMLInputElement>(
        `input[name*="${link.name}"], input[placeholder*="${link.name.toLowerCase()}"]`
      );

      if (input) {
        await this.fillTextInput(input, link.url);
      }
    }
  }
}

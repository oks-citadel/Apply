/**
 * Form Filler
 * Handles autofilling job application forms
 */

import { AdapterFactory } from './autofill/adapter-factory';
import { BaseAdapter } from './autofill/base-adapter';
import { ResumeData } from './autofill/types';

export class FormFiller {
  private adapter: BaseAdapter | null = null;

  /**
   * Auto-fill form with resume data
   */
  async autofillForm(resumeData: any): Promise<any> {
    try {
      // Convert resume data to ResumeData format
      const formattedResumeData = this.formatResumeData(resumeData);

      // Detect and get appropriate adapter
      this.adapter = AdapterFactory.getAdapter('generic' as ATSPlatform);

      if (!this.adapter) {
        throw new Error('Could not detect application form');
      }

      // Start autofill process
      const result = await this.adapter.autofill(formattedResumeData);

      return {
        success: result.success,
        filledFields: result.filledFields,
        totalFields: result.totalFields,
        errors: result.errors,
        warnings: result.warnings,
      };
    } catch (error) {
      console.error('[FormFiller] Autofill failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        filledFields: 0,
        totalFields: 0,
        errors: [
          {
            field: 'general',
            message: errorMessage,
            type: 'interaction_failed',
            severity: 'error',
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * Format resume data to match expected structure
   */
  private formatResumeData(resume: any): ResumeData {
    return {
      personalInfo: {
        firstName: resume.personalInfo?.fullName?.split(' ')[0] || '',
        lastName: resume.personalInfo?.fullName?.split(' ').slice(1).join(' ') || '',
        fullName: resume.personalInfo?.fullName || '',
        email: resume.personalInfo?.email || '',
        phone: resume.personalInfo?.phone || '',
        address: resume.personalInfo?.location
          ? this.parseAddress(resume.personalInfo.location)
          : undefined,
        linkedin: resume.personalInfo?.linkedIn,
        github: resume.personalInfo?.github,
        portfolio: resume.personalInfo?.portfolio,
        website: resume.personalInfo?.portfolio,
      },
      summary: resume.personalInfo?.summary || '',
      experience: (resume.experience || []).map((exp: any) => ({
        id: exp.id,
        company: exp.company,
        position: exp.position,
        location: exp.location,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate ? new Date(exp.endDate) : undefined,
        current: exp.current,
        description: exp.description,
        achievements: exp.achievements || [],
      })),
      education: (resume.education || []).map((edu: any) => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        location: edu.location,
        startDate: new Date(edu.startDate),
        endDate: edu.endDate ? new Date(edu.endDate) : undefined,
        gpa: edu.gpa ? parseFloat(edu.gpa) : undefined,
        honors: edu.achievements?.join(', '),
      })),
      skills: resume.skills || [],
      certifications: (resume.certifications || []).map((cert: any) => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        issueDate: new Date(cert.date),
        expiryDate: cert.expirationDate ? new Date(cert.expirationDate) : undefined,
        credentialId: cert.credentialId,
        url: cert.url,
      })),
      languages: resume.languages,
      resumeUrl: resume.resumeUrl,
      resumeFile: resume.resumeFile,
    };
  }

  /**
   * Parse address string into components
   */
  private parseAddress(
    location: string
  ): {
    street?: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    full?: string;
  } | undefined {
    if (!location) return undefined;

    // Simple address parsing - can be enhanced
    const parts = location.split(',').map((p) => p.trim());

    if (parts.length >= 2) {
      return {
        city: parts[0] || '',
        state: parts[1] || '',
        country: parts[2] || 'USA',
        zipCode: '',
        full: location,
      };
    }

    return {
      city: location,
      state: '',
      country: 'USA',
      zipCode: '',
      full: location,
    };
  }

  /**
   * Get current adapter
   */
  getAdapter(): BaseAdapter | null {
    return this.adapter;
  }
}

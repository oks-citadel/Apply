/**
 * Custom question handler - AI-powered answer generation
 * Handles non-standard application questions
 */

import { CustomQuestion, ResumeData, CommonQuestionPattern } from './types';

export class CustomQuestionHandler {
  private commonPatterns: CommonQuestionPattern[] = [
    // Work Authorization
    {
      pattern: /authorized|eligible|legally\s*allowed.*work/i,
      category: 'legal',
      answerStrategy: () => 'Yes',
    },
    {
      pattern: /require.*sponsorship|visa\s*sponsorship|work\s*permit/i,
      category: 'legal',
      answerStrategy: () => 'No',
    },

    // Salary
    {
      pattern: /salary.*expectation|expected\s*salary|desired\s*salary|salary\s*requirement/i,
      category: 'preferences',
      answerStrategy: () => 'Competitive salary based on market standards',
    },
    {
      pattern: /minimum.*salary|salary.*range/i,
      category: 'preferences',
      answerStrategy: () => 'Open to discussion',
    },

    // Start Date
    {
      pattern: /start\s*date|available.*start|when.*available|earliest.*start/i,
      category: 'preferences',
      answerStrategy: () => {
        const twoWeeks = new Date();
        twoWeeks.setDate(twoWeeks.getDate() + 14);
        return twoWeeks.toISOString().split('T')[0];
      },
    },
    {
      pattern: /notice\s*period|how\s*much\s*notice/i,
      category: 'employment',
      answerStrategy: () => '2 weeks',
    },

    // Relocation
    {
      pattern: /willing.*relocate|open.*relocation|relocate/i,
      category: 'preferences',
      answerStrategy: () => 'Yes',
    },

    // Remote Work
    {
      pattern: /remote|work.*home|hybrid/i,
      category: 'preferences',
      answerStrategy: () => 'Open to all work arrangements',
    },

    // Years of Experience
    {
      pattern: /years.*experience|how\s*long.*experience/i,
      category: 'qualifications',
      answerStrategy: (resume) => {
        const years = this.calculateYearsOfExperience(resume);
        return `${years} years`;
      },
    },

    // Education
    {
      pattern: /highest.*education|education.*level|degree/i,
      category: 'qualifications',
      answerStrategy: (resume) => {
        if (resume.education && resume.education.length > 0) {
          return resume.education[0].degree;
        }
        return 'Bachelor\'s Degree';
      },
    },

    // References
    {
      pattern: /reference|professional\s*reference/i,
      category: 'personal',
      answerStrategy: () => 'Available upon request',
    },

    // Criminal Background
    {
      pattern: /criminal|convicted|felony/i,
      category: 'legal',
      answerStrategy: () => 'No',
    },

    // Drug Test
    {
      pattern: /drug.*test|substance.*test/i,
      category: 'legal',
      answerStrategy: () => 'Yes',
    },

    // Background Check
    {
      pattern: /background.*check|consent.*background/i,
      category: 'legal',
      answerStrategy: () => 'Yes',
    },

    // Cover Letter
    {
      pattern: /cover\s*letter|why.*interested|why.*apply|motivation/i,
      category: 'personal',
      answerStrategy: (resume) => {
        return this.generateCoverLetterSnippet(resume);
      },
    },

    // Why this company
    {
      pattern: /why.*company|why.*join|why.*work.*us/i,
      category: 'personal',
      answerStrategy: () => {
        return 'I am impressed by the company\'s innovation and growth, and believe my skills align well with the role and company culture.';
      },
    },

    // Strengths
    {
      pattern: /strength|what.*good.*at/i,
      category: 'personal',
      answerStrategy: (resume) => {
        if (resume.skills && resume.skills.length > 0) {
          const topSkills = resume.skills.slice(0, 3).join(', ');
          return `Strong expertise in ${topSkills}`;
        }
        return 'Problem-solving, teamwork, and technical expertise';
      },
    },

    // Weaknesses
    {
      pattern: /weakness|area.*improve|development\s*area/i,
      category: 'personal',
      answerStrategy: () => {
        return 'I am always looking to improve my skills and stay updated with the latest technologies.';
      },
    },

    // Team or Individual
    {
      pattern: /team\s*or\s*individual|prefer.*work/i,
      category: 'preferences',
      answerStrategy: () => 'Both - I work well independently and as part of a team',
    },

    // Diversity Questions
    {
      pattern: /gender|race|ethnicity|veteran|disability/i,
      category: 'personal',
      answerStrategy: () => 'Prefer not to answer',
    },

    // LinkedIn Profile
    {
      pattern: /linkedin/i,
      category: 'personal',
      answerStrategy: (resume) => resume.personalInfo.linkedin || '',
    },

    // Portfolio/GitHub
    {
      pattern: /portfolio|github|work\s*sample/i,
      category: 'personal',
      answerStrategy: (resume) => {
        return resume.personalInfo.github || resume.personalInfo.portfolio || '';
      },
    },
  ];

  /**
   * Detect and answer custom questions
   */
  public async detectAndAnswerQuestions(resumeData: ResumeData): Promise<CustomQuestion[]> {
    const questions = this.detectCustomQuestions();
    const answeredQuestions: CustomQuestion[] = [];

    for (const question of questions) {
      const answer = this.generateAnswer(question.question, resumeData);

      if (answer) {
        question.answer = answer;
        question.confidence = this.calculateConfidence(question.question);

        // Fill the field if confidence is high enough
        if (question.confidence > 0.7) {
          await this.fillQuestion(question);
        }

        answeredQuestions.push(question);
      }
    }

    return answeredQuestions;
  }

  /**
   * Detect custom questions on the page
   */
  private detectCustomQuestions(): CustomQuestion[] {
    const questions: CustomQuestion[] = [];
    const containers = document.querySelectorAll(
      '.question, .form-question, [class*="question"], [data-question]'
    );

    containers.forEach((container) => {
      const question = this.extractQuestion(container as HTMLElement);
      if (question) {
        questions.push(question);
      }
    });

    // Also look for standalone labels with associated inputs
    const labels = document.querySelectorAll('label');
    labels.forEach((label) => {
      const input = this.findAssociatedInput(label);
      if (input && !this.isStandardField(label.textContent || '')) {
        const question = this.createQuestionFromLabel(label, input);
        if (question) {
          questions.push(question);
        }
      }
    });

    return questions;
  }

  /**
   * Extract question from container element
   */
  private extractQuestion(container: HTMLElement): CustomQuestion | null {
    // Find question text
    const questionText =
      container.querySelector('.question-text, [class*="question-text"]')?.textContent ||
      container.querySelector('label')?.textContent ||
      container.textContent;

    if (!questionText || questionText.trim().length === 0) {
      return null;
    }

    // Find input element
    const input =
      container.querySelector('input, textarea, select') ||
      this.findAssociatedInput(container);

    if (!input) {
      return null;
    }

    return this.createQuestion(questionText.trim(), input);
  }

  /**
   * Create question object
   */
  private createQuestion(questionText: string, element: Element): CustomQuestion | null {
    if (element instanceof HTMLTextAreaElement) {
      return {
        element,
        question: questionText,
        type: 'textarea',
        required: element.required,
      };
    }

    if (element instanceof HTMLSelectElement) {
      return {
        element,
        question: questionText,
        type: 'select',
        required: element.required,
        options: Array.from(element.options).map((opt) => opt.text),
      };
    }

    if (element instanceof HTMLInputElement) {
      const type = element.type;

      if (type === 'checkbox') {
        return {
          element,
          question: questionText,
          type: 'checkbox',
          required: element.required,
        };
      }

      if (type === 'radio') {
        const radioGroup = document.querySelectorAll<HTMLInputElement>(
          `input[type="radio"][name="${element.name}"]`
        );
        return {
          element,
          question: questionText,
          type: 'radio',
          required: element.required,
          options: Array.from(radioGroup).map((radio) => {
            const label = this.findLabelForElement(radio);
            return label?.textContent?.trim() || radio.value;
          }),
        };
      }

      return {
        element,
        question: questionText,
        type: 'text',
        required: element.required,
      };
    }

    return null;
  }

  /**
   * Create question from label and input
   */
  private createQuestionFromLabel(label: HTMLLabelElement, input: Element): CustomQuestion | null {
    const questionText = label.textContent?.trim() || '';
    if (!questionText) {
      return null;
    }

    return this.createQuestion(questionText, input);
  }

  /**
   * Find associated input for a container or label
   */
  private findAssociatedInput(element: Element): Element | null {
    // Check for id reference
    const forAttr = element.getAttribute('for');
    if (forAttr) {
      return document.getElementById(forAttr);
    }

    // Check children
    const input = element.querySelector('input, textarea, select');
    if (input) {
      return input;
    }

    // Check next sibling
    const nextSibling = element.nextElementSibling;
    if (nextSibling && nextSibling.matches('input, textarea, select')) {
      return nextSibling;
    }

    return null;
  }

  /**
   * Find label for an element
   */
  private findLabelForElement(element: HTMLElement): HTMLLabelElement | null {
    if (element.id) {
      return document.querySelector<HTMLLabelElement>(`label[for="${element.id}"]`);
    }

    return element.closest('label');
  }

  /**
   * Check if field is a standard field (not a custom question)
   */
  private isStandardField(text: string): boolean {
    const standardFields = [
      'name',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zip',
      'country',
    ];

    const normalizedText = text.toLowerCase();
    return standardFields.some((field) => normalizedText.includes(field));
  }

  /**
   * Generate answer for a question
   */
  public generateAnswer(question: string, resumeData: ResumeData): string {
    // Try to match against common patterns
    for (const pattern of this.commonPatterns) {
      if (pattern.pattern.test(question)) {
        return pattern.answerStrategy(resumeData, question);
      }
    }

    // Default fallback
    return '';
  }

  /**
   * Calculate confidence score for answer
   */
  private calculateConfidence(question: string): number {
    for (const pattern of this.commonPatterns) {
      if (pattern.pattern.test(question)) {
        return 0.9;
      }
    }

    return 0.5;
  }

  /**
   * Fill a question field
   */
  private async fillQuestion(question: CustomQuestion): Promise<void> {
    if (!question.answer) {
      return;
    }

    const element = question.element;

    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      element.value = question.answer;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element instanceof HTMLSelectElement) {
      // Try to find matching option
      for (const option of Array.from(element.options)) {
        if (
          option.value === question.answer ||
          option.text.toLowerCase().includes(question.answer.toLowerCase())
        ) {
          element.value = option.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    }
  }

  /**
   * Calculate years of experience from resume
   */
  private calculateYearsOfExperience(resume: ResumeData): number {
    if (!resume.experience || resume.experience.length === 0) {
      return 0;
    }

    let totalMonths = 0;

    for (const exp of resume.experience) {
      const startDate = new Date(exp.startDate);
      const endDate = exp.current ? new Date() : new Date(exp.endDate!);

      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());

      totalMonths += months;
    }

    return Math.floor(totalMonths / 12);
  }

  /**
   * Generate cover letter snippet
   */
  private generateCoverLetterSnippet(resume: ResumeData): string {
    const skills = resume.skills?.slice(0, 3).join(', ') || 'relevant skills';
    const years = this.calculateYearsOfExperience(resume);
    const currentRole =
      resume.experience?.[0]?.position || 'professional in the industry';

    return `I am a ${currentRole} with ${years} years of experience and expertise in ${skills}. I am excited about this opportunity and believe my skills align well with the role requirements.`;
  }

  /**
   * Get all detected questions (for UI review)
   */
  public getDetectedQuestions(): CustomQuestion[] {
    return this.detectCustomQuestions();
  }

  /**
   * Cache answers for common questions
   */
  private answerCache = new Map<string, string>();

  public cacheAnswer(question: string, answer: string): void {
    this.answerCache.set(question.toLowerCase().trim(), answer);
  }

  public getCachedAnswer(question: string): string | undefined {
    return this.answerCache.get(question.toLowerCase().trim());
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

import { FormMapping } from './entities/form-mapping.entity';
import { Answer, QuestionCategory } from '../answer-library/entities/answer.entity';

import type { Page } from 'playwright';


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
  private readonly aiServiceUrl: string;

  constructor(
    @InjectRepository(FormMapping)
    private readonly formMappingRepository: Repository<FormMapping>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8007');
  }

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

  async generateAIAnswer(question: string, userProfile: any, userId?: string): Promise<string> {
    this.logger.log(`Generating AI answer for question: ${question}`);

    // Step 1: Check answer library for a saved answer
    if (userId) {
      const savedAnswer = await this.findSavedAnswer(userId, question);
      if (savedAnswer) {
        this.logger.log(`Found saved answer for question from answer library`);
        return savedAnswer;
      }
    }

    // Step 2: Try to get AI-generated answer from AI service
    try {
      const aiAnswer = await this.getAIGeneratedAnswer(question, userProfile);
      if (aiAnswer) {
        return aiAnswer;
      }
    } catch (error) {
      this.logger.warn(`AI service call failed, falling back to rule-based answers: ${error.message}`);
    }

    // Step 3: Fallback to rule-based answers
    return this.generateRuleBasedAnswer(question, userProfile);
  }

  /**
   * Find a saved answer from the answer library
   */
  private async findSavedAnswer(userId: string, question: string): Promise<string | null> {
    try {
      const normalizedQuestion = question.toLowerCase().trim();

      // Try exact match first
      const exactMatch = await this.answerRepository.findOne({
        where: {
          user_id: userId,
          is_active: true,
        },
        order: { usage_count: 'DESC' },
      });

      // Check keywords in question against stored answers
      const allAnswers = await this.answerRepository.find({
        where: { user_id: userId, is_active: true },
      });

      for (const answer of allAnswers) {
        if (!answer.keywords || answer.keywords.length === 0) continue;

        const matchingKeywords = answer.keywords.filter(
          kw => normalizedQuestion.includes(kw.toLowerCase())
        );

        // If at least 50% of keywords match, use this answer
        if (matchingKeywords.length >= Math.ceil(answer.keywords.length * 0.5)) {
          // Increment usage count
          await this.answerRepository.increment({ id: answer.id }, 'usage_count', 1);
          return answer.answer_value;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Error finding saved answer: ${error.message}`);
      return null;
    }
  }

  /**
   * Get AI-generated answer from AI service
   */
  private async getAIGeneratedAnswer(question: string, userProfile: any): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/api/v1/nlp/generate-answer`, {
          question,
          context: {
            name: userProfile?.name || userProfile?.firstName,
            skills: userProfile?.skills || [],
            experience: userProfile?.workExperience || userProfile?.experience || [],
            education: userProfile?.education || [],
            currentTitle: userProfile?.currentTitle || userProfile?.headline,
            yearsOfExperience: userProfile?.yearsOfExperience,
            desiredSalary: userProfile?.desiredSalary || userProfile?.salaryExpectation,
            availability: userProfile?.availability,
            workAuthorization: userProfile?.workAuthorization,
            requiresSponsorship: userProfile?.requiresSponsorship,
          },
        }).pipe(
          timeout(15000),
          catchError((error) => {
            this.logger.warn(`AI service error: ${error.message}`);
            return of(null);
          }),
        ),
      );

      if (response && response.data?.answer) {
        return response.data.answer;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to get AI-generated answer: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate rule-based answer based on question patterns
   */
  private generateRuleBasedAnswer(question: string, userProfile: any): string {
    const lowerQuestion = question.toLowerCase();

    // Work motivation questions
    if (lowerQuestion.includes('why') && (lowerQuestion.includes('work') || lowerQuestion.includes('company') || lowerQuestion.includes('role') || lowerQuestion.includes('position'))) {
      const skills = userProfile?.skills?.slice(0, 3)?.join(', ') || 'relevant skills';
      return `I am excited about this opportunity because it aligns with my career goals and expertise in ${skills}. I am particularly interested in contributing to your team's success and growing professionally in this role.`;
    }

    // Cover letter / introduction
    if (lowerQuestion.includes('cover letter') || lowerQuestion.includes('introduce yourself') || lowerQuestion.includes('tell us about yourself')) {
      const name = userProfile?.name || userProfile?.firstName || 'I';
      const title = userProfile?.currentTitle || userProfile?.headline || 'professional';
      return `${name} am a ${title} with experience in the industry. I bring a strong track record of delivering results and am excited about this opportunity to contribute to your organization's success.`;
    }

    // Relocation
    if (lowerQuestion.includes('relocate') || lowerQuestion.includes('relocation')) {
      return userProfile?.willingToRelocate === false
        ? 'I prefer to remain in my current location, but I am open to remote work arrangements.'
        : 'Yes, I am open to relocation for the right opportunity.';
    }

    // Work authorization
    if (lowerQuestion.includes('authorized') && lowerQuestion.includes('work')) {
      return userProfile?.workAuthorization !== false
        ? 'Yes, I am authorized to work in this location.'
        : 'I may require work authorization assistance.';
    }

    // Visa sponsorship
    if (lowerQuestion.includes('sponsor') || lowerQuestion.includes('visa')) {
      return userProfile?.requiresSponsorship
        ? 'Yes, I would require visa sponsorship.'
        : 'No, I do not require sponsorship.';
    }

    // Salary expectations
    if (lowerQuestion.includes('salary') || lowerQuestion.includes('compensation') || lowerQuestion.includes('pay')) {
      if (userProfile?.desiredSalary || userProfile?.salaryExpectation) {
        return `My salary expectation is ${userProfile.desiredSalary || userProfile.salaryExpectation}, though I am open to discussing total compensation.`;
      }
      return 'I am open to discussing compensation based on the full scope of the role and total benefits package.';
    }

    // Availability / Start date
    if (lowerQuestion.includes('start') || lowerQuestion.includes('available') || lowerQuestion.includes('availability')) {
      return userProfile?.availability || 'I can start within 2 weeks of accepting an offer.';
    }

    // Years of experience
    if (lowerQuestion.includes('years') && lowerQuestion.includes('experience')) {
      const years = userProfile?.yearsOfExperience;
      if (years) {
        return `I have ${years} years of professional experience in this field.`;
      }
      return 'I have several years of relevant professional experience.';
    }

    // Remote work
    if (lowerQuestion.includes('remote') || lowerQuestion.includes('work from home') || lowerQuestion.includes('hybrid')) {
      return userProfile?.remotePreference
        ? `My preference is ${userProfile.remotePreference} work, but I am flexible based on team needs.`
        : 'I am flexible with work arrangements and can work effectively in remote, hybrid, or on-site settings.';
    }

    // Background check
    if (lowerQuestion.includes('background check') || lowerQuestion.includes('criminal')) {
      return 'Yes, I consent to a background check as part of the hiring process.';
    }

    // How did you hear about us
    if (lowerQuestion.includes('hear about') || lowerQuestion.includes('how did you find') || lowerQuestion.includes('source')) {
      return 'I discovered this position through the company career page while researching exciting opportunities in the industry.';
    }

    // Travel requirements
    if (lowerQuestion.includes('travel') && (lowerQuestion.includes('willing') || lowerQuestion.includes('able') || lowerQuestion.includes('percentage'))) {
      return 'Yes, I am willing to travel as required for the role.';
    }

    // Default response with more context
    const resumeRef = userProfile?.resumeUrl ? 'For more details, please refer to my resume.' : '';
    return `I would be happy to discuss this further during an interview. ${resumeRef}`.trim();
  }
}

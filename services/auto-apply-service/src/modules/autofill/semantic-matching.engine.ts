import { Injectable, Logger } from '@nestjs/common';
import { DetectedField, FieldCategory } from './field-detection.engine';

export interface UserProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    preferredName?: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  links: {
    linkedin?: string;
    portfolio?: string;
    github?: string;
    website?: string;
  };
  authorization: {
    workAuthorized: boolean;
    requiresSponsorship: boolean;
    citizenshipStatus?: string;
    visaStatus?: string;
  };
  preferences: {
    desiredSalary?: string;
    salaryRange?: { min: number; max: number };
    availableStartDate?: string;
    noticePeriod?: string;
    willingToRelocate?: boolean;
    preferredLocations?: string[];
  };
  veteranStatus?: string;
  disabilityStatus?: string;
  ethnicity?: string;
}

export interface ResumeData {
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications?: string[];
  languages?: string[];
  summary?: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements?: string[];
  location?: string;
}

export interface Education {
  institution: string;
  degree: string;
  major: string;
  minor?: string;
  gpa?: string;
  graduationDate: string;
  honors?: string[];
}

export interface FieldMatch {
  field: DetectedField;
  matchedValue: string;
  source: 'profile' | 'resume' | 'saved_answer' | 'ai_generated';
  confidence: number;
  alternativeValues?: string[];
  requiresReview: boolean;
}

@Injectable()
export class SemanticMatchingEngine {
  private readonly logger = new Logger(SemanticMatchingEngine.name);

  // Semantic mappings for common field variations
  private readonly semanticMappings: Map<string, string[]> = new Map([
    ['firstName', ['first name', 'given name', 'forename', 'fname']],
    ['lastName', ['last name', 'surname', 'family name', 'lname']],
    ['email', ['email address', 'e-mail', 'electronic mail', 'email id']],
    ['phone', ['phone number', 'telephone', 'mobile', 'cell', 'contact number', 'phone no']],
    ['address', ['street address', 'mailing address', 'home address', 'address line']],
    ['city', ['city', 'town', 'municipality']],
    ['state', ['state', 'province', 'region']],
    ['zipCode', ['zip code', 'postal code', 'zip', 'postcode', 'pin code']],
    ['country', ['country', 'nation']],
    ['linkedin', ['linkedin', 'linkedin profile', 'linkedin url']],
    ['salary', ['salary expectation', 'expected salary', 'desired compensation', 'pay expectation']],
    ['startDate', ['start date', 'available to start', 'when can you start', 'availability date']],
    ['workAuthorized', ['work authorization', 'legally authorized', 'authorized to work', 'work permit']],
    ['sponsorship', ['require sponsorship', 'visa sponsorship', 'need sponsorship', 'sponsorship required']],
  ]);

  /**
   * Match detected fields with user data
   */
  async matchFields(
    fields: DetectedField[],
    profile: UserProfile,
    resume: ResumeData,
    savedAnswers: Map<string, string> = new Map(),
  ): Promise<FieldMatch[]> {
    this.logger.log(`Matching ${fields.length} fields with user data`);

    const matches: FieldMatch[] = [];

    for (const field of fields) {
      const match = await this.matchSingleField(field, profile, resume, savedAnswers);
      matches.push(match);
    }

    return matches;
  }

  /**
   * Match a single field
   */
  private async matchSingleField(
    field: DetectedField,
    profile: UserProfile,
    resume: ResumeData,
    savedAnswers: Map<string, string>,
  ): Promise<FieldMatch> {
    // Try category-based matching first
    let value = this.matchByCategory(field, profile, resume);
    let source: FieldMatch['source'] = value ? 'profile' : 'saved_answer';
    let confidence = 0;

    // If no match by category, try semantic matching
    if (!value) {
      value = this.matchBySemantic(field.label, profile);
      if (value) {
        source = 'profile';
      }
    }

    // Check saved answers
    if (!value) {
      const savedAnswer = this.findSavedAnswer(field.label, savedAnswers);
      if (savedAnswer) {
        value = savedAnswer;
        source = 'saved_answer';
      }
    }

    // Calculate confidence
    confidence = this.calculateMatchConfidence(field, value, source);

    // Determine if review is needed
    const requiresReview = confidence < 70 || field.fieldCategory === 'custom_question';

    return {
      field,
      matchedValue: value || '',
      source: value ? source : 'ai_generated',
      confidence,
      requiresReview,
    };
  }

  /**
   * Match field by its detected category
   */
  private matchByCategory(
    field: DetectedField,
    profile: UserProfile,
    resume: ResumeData,
  ): string | null {
    const label = field.label.toLowerCase();

    switch (field.fieldCategory) {
      case 'personal_info':
        return this.matchPersonalInfo(label, profile);

      case 'contact':
        return this.matchContactInfo(label, profile);

      case 'employment':
        return this.matchEmploymentInfo(label, resume);

      case 'education':
        return this.matchEducationInfo(label, resume);

      case 'skills':
        return this.matchSkillsInfo(label, resume);

      case 'experience':
        return this.matchExperienceInfo(label, resume);

      case 'salary':
        return this.matchSalaryInfo(label, profile);

      case 'availability':
        return this.matchAvailabilityInfo(label, profile);

      case 'authorization':
        return this.matchAuthorizationInfo(label, profile);

      default:
        return null;
    }
  }

  private matchPersonalInfo(label: string, profile: UserProfile): string | null {
    if (/first[\s_-]?name/i.test(label)) return profile.personalInfo.firstName;
    if (/last[\s_-]?name/i.test(label)) return profile.personalInfo.lastName;
    if (/middle[\s_-]?name/i.test(label)) return profile.personalInfo.middleName || '';
    if (/full[\s_-]?name/i.test(label)) {
      return `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`;
    }
    if (/preferred[\s_-]?name/i.test(label)) {
      return profile.personalInfo.preferredName || profile.personalInfo.firstName;
    }
    if (/date[\s_-]?of[\s_-]?birth|dob/i.test(label)) {
      return profile.personalInfo.dateOfBirth || '';
    }
    if (/gender/i.test(label)) return profile.personalInfo.gender || '';
    if (/veteran/i.test(label)) return profile.veteranStatus || '';
    if (/disability/i.test(label)) return profile.disabilityStatus || '';
    if (/ethnicity|race/i.test(label)) return profile.ethnicity || '';

    return null;
  }

  private matchContactInfo(label: string, profile: UserProfile): string | null {
    if (/email/i.test(label)) return profile.personalInfo.email;
    if (/phone|mobile|cell|telephone/i.test(label)) return profile.personalInfo.phone;
    if (/street|address[\s_-]?line/i.test(label)) return profile.address.street;
    if (/city/i.test(label)) return profile.address.city;
    if (/state|province/i.test(label)) return profile.address.state;
    if (/zip|postal/i.test(label)) return profile.address.zipCode;
    if (/country/i.test(label)) return profile.address.country;
    if (/linkedin/i.test(label)) return profile.links.linkedin || '';
    if (/github/i.test(label)) return profile.links.github || '';
    if (/portfolio|website/i.test(label)) return profile.links.portfolio || profile.links.website || '';

    return null;
  }

  private matchEmploymentInfo(label: string, resume: ResumeData): string | null {
    if (resume.experience.length === 0) return null;

    const mostRecent = resume.experience[0];

    if (/company[\s_-]?name|employer/i.test(label)) return mostRecent.company;
    if (/job[\s_-]?title|position/i.test(label)) return mostRecent.title;
    if (/start[\s_-]?date/i.test(label)) return mostRecent.startDate;
    if (/end[\s_-]?date/i.test(label)) return mostRecent.current ? 'Present' : mostRecent.endDate || '';
    if (/responsibilities|duties|description/i.test(label)) return mostRecent.description;

    return null;
  }

  private matchEducationInfo(label: string, resume: ResumeData): string | null {
    if (resume.education.length === 0) return null;

    const mostRecent = resume.education[0];

    if (/school[\s_-]?name|university|college|institution/i.test(label)) return mostRecent.institution;
    if (/degree/i.test(label)) return mostRecent.degree;
    if (/major|field[\s_-]?of[\s_-]?study/i.test(label)) return mostRecent.major;
    if (/minor/i.test(label)) return mostRecent.minor || '';
    if (/gpa/i.test(label)) return mostRecent.gpa || '';
    if (/graduation/i.test(label)) return mostRecent.graduationDate;

    return null;
  }

  private matchSkillsInfo(label: string, resume: ResumeData): string | null {
    if (/skills|competencies|proficiencies/i.test(label)) {
      return resume.skills.slice(0, 10).join(', ');
    }
    if (/certifications|licenses/i.test(label)) {
      return resume.certifications?.join(', ') || '';
    }
    if (/languages/i.test(label)) {
      return resume.languages?.join(', ') || '';
    }

    return null;
  }

  private matchExperienceInfo(label: string, resume: ResumeData): string | null {
    if (/years[\s_-]?of[\s_-]?experience|total[\s_-]?experience/i.test(label)) {
      // Calculate total years of experience
      const totalMonths = resume.experience.reduce((total, exp) => {
        const start = new Date(exp.startDate);
        const end = exp.current ? new Date() : new Date(exp.endDate || new Date());
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return total + months;
      }, 0);

      const years = Math.round(totalMonths / 12);
      return years.toString();
    }

    return null;
  }

  private matchSalaryInfo(label: string, profile: UserProfile): string | null {
    if (/salary|compensation|pay/i.test(label)) {
      if (profile.preferences.desiredSalary) {
        return profile.preferences.desiredSalary;
      }
      if (profile.preferences.salaryRange) {
        return `$${profile.preferences.salaryRange.min.toLocaleString()} - $${profile.preferences.salaryRange.max.toLocaleString()}`;
      }
    }

    return null;
  }

  private matchAvailabilityInfo(label: string, profile: UserProfile): string | null {
    if (/start[\s_-]?date|available[\s_-]?to[\s_-]?start|when[\s_-]?can[\s_-]?you[\s_-]?start/i.test(label)) {
      return profile.preferences.availableStartDate || 'Immediately';
    }
    if (/notice[\s_-]?period/i.test(label)) {
      return profile.preferences.noticePeriod || '2 weeks';
    }

    return null;
  }

  private matchAuthorizationInfo(label: string, profile: UserProfile): string | null {
    if (/work[\s_-]?authorization|legally[\s_-]?authorized|authorized[\s_-]?to[\s_-]?work|eligible[\s_-]?to[\s_-]?work/i.test(label)) {
      return profile.authorization.workAuthorized ? 'Yes' : 'No';
    }
    if (/sponsorship|require[\s_-]?sponsorship/i.test(label)) {
      return profile.authorization.requiresSponsorship ? 'Yes' : 'No';
    }
    if (/citizen/i.test(label)) {
      return profile.authorization.citizenshipStatus || '';
    }
    if (/visa/i.test(label)) {
      return profile.authorization.visaStatus || '';
    }

    return null;
  }

  /**
   * Match by semantic similarity
   */
  private matchBySemantic(label: string, profile: UserProfile): string | null {
    const normalizedLabel = label.toLowerCase().trim();

    for (const [key, variations] of this.semanticMappings) {
      for (const variation of variations) {
        if (normalizedLabel.includes(variation) || variation.includes(normalizedLabel)) {
          return this.getValueByKey(key, profile);
        }
      }
    }

    return null;
  }

  /**
   * Get value from profile by key
   */
  private getValueByKey(key: string, profile: UserProfile): string | null {
    const keyMap: Record<string, string | null> = {
      firstName: profile.personalInfo.firstName,
      lastName: profile.personalInfo.lastName,
      email: profile.personalInfo.email,
      phone: profile.personalInfo.phone,
      address: profile.address.street,
      city: profile.address.city,
      state: profile.address.state,
      zipCode: profile.address.zipCode,
      country: profile.address.country,
      linkedin: profile.links.linkedin || null,
      salary: profile.preferences.desiredSalary || null,
      startDate: profile.preferences.availableStartDate || null,
      workAuthorized: profile.authorization.workAuthorized ? 'Yes' : 'No',
      sponsorship: profile.authorization.requiresSponsorship ? 'Yes' : 'No',
    };

    return keyMap[key] ?? null;
  }

  /**
   * Find matching saved answer
   */
  private findSavedAnswer(label: string, savedAnswers: Map<string, string>): string | null {
    const normalizedLabel = label.toLowerCase().trim();

    for (const [question, answer] of savedAnswers) {
      if (this.calculateSimilarity(normalizedLabel, question.toLowerCase()) > 0.6) {
        return answer;
      }
    }

    return null;
  }

  /**
   * Calculate match confidence
   */
  private calculateMatchConfidence(
    field: DetectedField,
    value: string | null,
    source: FieldMatch['source'],
  ): number {
    if (!value) return 0;

    let confidence = 50; // Base confidence

    // Boost for recognized category
    if (field.fieldCategory !== 'unknown') confidence += 20;

    // Boost for profile data (most reliable)
    if (source === 'profile') confidence += 15;

    // Boost for clear field detection
    confidence += Math.min(15, field.confidence / 10);

    // Reduce confidence for very long or very short values
    if (value.length < 2) confidence -= 20;
    if (value.length > 1000) confidence -= 10;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Calculate string similarity (simple Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }
}

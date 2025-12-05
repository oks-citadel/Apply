/**
 * Semantic field matcher - AI-powered field matching
 * Maps form fields to resume data using pattern matching and confidence scoring
 */

import { FormField, ResumeData, FieldMapping, SemanticMatchResult, FieldPattern } from './types';

export class SemanticMatcher {
  private fieldPatterns: FieldPattern[] = [
    // Personal Information
    {
      keywords: ['first name', 'firstname', 'given name'],
      patterns: [/first\s*name/i, /given\s*name/i, /fname/i],
      dataPath: 'personalInfo.firstName',
      priority: 10,
    },
    {
      keywords: ['last name', 'lastname', 'surname', 'family name'],
      patterns: [/last\s*name/i, /surname/i, /family\s*name/i, /lname/i],
      dataPath: 'personalInfo.lastName',
      priority: 10,
    },
    {
      keywords: ['full name', 'name', 'your name'],
      patterns: [/^name$/i, /full\s*name/i, /your\s*name/i, /legal\s*name/i],
      dataPath: 'personalInfo.fullName',
      priority: 9,
    },
    {
      keywords: ['email', 'e-mail', 'email address'],
      patterns: [/e?-?mail/i, /email\s*address/i],
      dataPath: 'personalInfo.email',
      priority: 10,
    },
    {
      keywords: ['phone', 'mobile', 'telephone', 'cell'],
      patterns: [/phone/i, /mobile/i, /telephone/i, /cell/i, /contact\s*number/i],
      dataPath: 'personalInfo.phone',
      priority: 10,
    },
    {
      keywords: ['address', 'street', 'address line'],
      patterns: [/street/i, /address\s*line/i, /address\s*1/i],
      dataPath: 'personalInfo.address.street',
      priority: 8,
    },
    {
      keywords: ['city', 'town'],
      patterns: [/city/i, /town/i],
      dataPath: 'personalInfo.address.city',
      priority: 8,
    },
    {
      keywords: ['state', 'province', 'region'],
      patterns: [/state/i, /province/i, /region/i],
      dataPath: 'personalInfo.address.state',
      priority: 8,
    },
    {
      keywords: ['zip', 'postal', 'postcode'],
      patterns: [/zip/i, /postal/i, /post\s*code/i],
      dataPath: 'personalInfo.address.zipCode',
      priority: 8,
    },
    {
      keywords: ['country'],
      patterns: [/country/i],
      dataPath: 'personalInfo.address.country',
      priority: 8,
    },
    {
      keywords: ['linkedin', 'linkedin profile', 'linkedin url'],
      patterns: [/linkedin/i, /linked\s*in/i],
      dataPath: 'personalInfo.linkedin',
      priority: 7,
    },
    {
      keywords: ['github', 'github profile'],
      patterns: [/github/i, /git\s*hub/i],
      dataPath: 'personalInfo.github',
      priority: 7,
    },
    {
      keywords: ['portfolio', 'website', 'personal website'],
      patterns: [/portfolio/i, /website/i, /personal\s*site/i],
      dataPath: 'personalInfo.website',
      priority: 7,
    },

    // Professional Information
    {
      keywords: ['summary', 'objective', 'about', 'professional summary'],
      patterns: [/summary/i, /objective/i, /about\s*(you|me)/i, /cover\s*letter/i],
      dataPath: 'summary',
      priority: 6,
    },
    {
      keywords: ['current company', 'employer', 'current employer'],
      patterns: [/current\s*(company|employer)/i, /present\s*company/i],
      dataPath: 'experience.0.company',
      priority: 7,
    },
    {
      keywords: ['current position', 'current title', 'job title'],
      patterns: [/current\s*(position|title|role)/i, /job\s*title/i],
      dataPath: 'experience.0.position',
      priority: 7,
    },
    {
      keywords: ['years of experience', 'experience', 'work experience'],
      patterns: [/years\s*of\s*experience/i, /total\s*experience/i],
      dataPath: 'experience.yearsTotal',
      priority: 6,
    },

    // Education
    {
      keywords: ['university', 'college', 'school', 'institution'],
      patterns: [/university/i, /college/i, /school/i, /institution/i],
      dataPath: 'education.0.institution',
      priority: 7,
    },
    {
      keywords: ['degree', 'education level'],
      patterns: [/degree/i, /education\s*level/i, /qualification/i],
      dataPath: 'education.0.degree',
      priority: 7,
    },
    {
      keywords: ['major', 'field of study', 'field', 'discipline'],
      patterns: [/major/i, /field\s*of\s*study/i, /discipline/i, /specialization/i],
      dataPath: 'education.0.field',
      priority: 7,
    },
    {
      keywords: ['gpa', 'grade', 'grade point average'],
      patterns: [/gpa/i, /grade\s*point/i, /cumulative\s*gpa/i],
      dataPath: 'education.0.gpa',
      priority: 6,
    },
    {
      keywords: ['graduation date', 'graduation year'],
      patterns: [/graduation\s*(date|year)/i, /graduated/i],
      dataPath: 'education.0.endDate',
      priority: 7,
    },

    // Skills
    {
      keywords: ['skills', 'technical skills', 'competencies'],
      patterns: [/skills/i, /competencies/i, /proficiencies/i],
      dataPath: 'skills',
      priority: 6,
    },
  ];

  /**
   * Match a form field to resume data
   */
  public matchFieldToData(
    field: FormField,
    resumeData: ResumeData,
    customMappings: FieldMapping[] = []
  ): { value: string; confidence: number; dataPath: string } | null {
    // Try custom mappings first
    for (const mapping of customMappings) {
      for (const selector of mapping.selectors) {
        if (this.elementMatchesSelector(field.element, selector)) {
          const value = mapping.getValue(resumeData);
          if (value) {
            return { value, confidence: 1.0, dataPath: mapping.fieldType };
          }
        }
      }
    }

    // Try semantic matching
    const match = this.findBestMatch(field, resumeData);
    return match;
  }

  /**
   * Find best matching data for a field
   */
  private findBestMatch(
    field: FormField,
    resumeData: ResumeData
  ): { value: string; confidence: number; dataPath: string } | null {
    const fieldContext = this.getFieldContext(field).toLowerCase();
    let bestMatch: { value: string; confidence: number; dataPath: string } | null = null;
    let highestScore = 0;

    for (const pattern of this.fieldPatterns) {
      const score = this.calculateMatchScore(fieldContext, pattern);

      if (score > highestScore && score > 0.5) {
        const value = this.getValueFromPath(resumeData, pattern.dataPath);

        if (value) {
          highestScore = score;
          bestMatch = {
            value: this.formatValue(value, field.type),
            confidence: score,
            dataPath: pattern.dataPath,
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match score between field context and pattern
   */
  private calculateMatchScore(fieldContext: string, pattern: FieldPattern): number {
    let score = 0;

    // Check regex patterns
    for (const regex of pattern.patterns) {
      if (regex.test(fieldContext)) {
        score += 0.8;
        break;
      }
    }

    // Check keywords
    for (const keyword of pattern.keywords) {
      if (fieldContext.includes(keyword.toLowerCase())) {
        score += 0.3;
      }
    }

    // Apply priority weight
    score *= pattern.priority / 10;

    return Math.min(score, 1.0);
  }

  /**
   * Get field context for matching
   */
  private getFieldContext(field: FormField): string {
    return [
      field.label,
      field.name,
      field.id,
      field.placeholder || '',
      field.element.getAttribute('data-automation-id') || '',
      field.element.className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  /**
   * Get value from nested object path
   */
  private getValueFromPath(obj: any, path: string): string | undefined {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }

      // Handle array access (e.g., experience.0.company)
      if (/^\d+$/.test(part)) {
        const index = parseInt(part, 10);
        if (Array.isArray(current) && current[index]) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        current = current[part];
      }
    }

    return this.stringifyValue(current);
  }

  /**
   * Convert value to string
   */
  private stringifyValue(value: any): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object' && value.full) {
      return value.full;
    }

    return undefined;
  }

  /**
   * Format value based on field type
   */
  private formatValue(value: string, fieldType: string): string {
    switch (fieldType) {
      case 'phone':
        return this.formatPhone(value);
      case 'date':
        return this.formatDate(value);
      case 'email':
        return value.toLowerCase().trim();
      case 'url':
        return this.formatUrl(value);
      default:
        return value;
    }
  }

  /**
   * Format phone number
   */
  private formatPhone(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return phone;
  }

  /**
   * Format date
   */
  private formatDate(date: string): string {
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {
      // Return original if parsing fails
    }
    return date;
  }

  /**
   * Format URL
   */
  private formatUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  /**
   * Check if element matches selector
   */
  private elementMatchesSelector(element: HTMLElement, selector: string): boolean {
    try {
      return element.matches(selector);
    } catch (e) {
      return false;
    }
  }

  /**
   * Calculate overall confidence for a set of matches
   */
  public calculateOverallConfidence(matches: SemanticMatchResult[]): number {
    if (matches.length === 0) {
      return 0;
    }

    const totalConfidence = matches.reduce((sum, match) => sum + match.confidence, 0);
    return totalConfidence / matches.length;
  }

  /**
   * Find similar fields (for duplicate detection)
   */
  public findSimilarFields(field: FormField, allFields: FormField[]): FormField[] {
    const context = this.getFieldContext(field).toLowerCase();
    const similar: FormField[] = [];

    for (const otherField of allFields) {
      if (otherField === field) continue;

      const otherContext = this.getFieldContext(otherField).toLowerCase();
      const similarity = this.calculateSimilarity(context, otherContext);

      if (similarity > 0.7) {
        similar.push(otherField);
      }
    }

    return similar;
  }

  /**
   * Calculate string similarity (Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}

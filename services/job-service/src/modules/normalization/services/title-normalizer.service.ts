import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';


import { JobTitleMapping } from '../entities/job-taxonomy.entity';
import { SeniorityLevel, FunctionCategory } from '../entities/normalized-job.entity';

import type { Repository } from 'typeorm';

interface TitleNormalizationResult {
  standardized_title: string;
  seniority_level?: SeniorityLevel;
  function_category: FunctionCategory;
  confidence_score: number;
  role_family?: string;
}

@Injectable()
export class TitleNormalizerService {
  private readonly logger = new Logger(TitleNormalizerService.name);

  // Common title patterns
  private readonly seniorityKeywords = {
    [SeniorityLevel.INTERN]: ['intern', 'internship', 'student', 'trainee'],
    [SeniorityLevel.ENTRY]: ['entry', 'entry-level', 'graduate', 'junior i', 'associate'],
    [SeniorityLevel.JUNIOR]: ['junior', 'jr', 'jr.', 'early career'],
    [SeniorityLevel.MID]: ['mid', 'mid-level', 'intermediate', 'ii', '2'],
    [SeniorityLevel.SENIOR]: ['senior', 'sr', 'sr.', 'iii', '3'],
    [SeniorityLevel.LEAD]: ['lead', 'team lead', 'tech lead', 'staff', 'principal i'],
    [SeniorityLevel.PRINCIPAL]: ['principal', 'architect', 'distinguished'],
    [SeniorityLevel.STAFF]: ['staff engineer', 'staff designer', 'staff'],
    [SeniorityLevel.DIRECTOR]: ['director', 'head of', 'manager'],
    [SeniorityLevel.VP]: ['vp', 'vice president', 'v.p.'],
    [SeniorityLevel.C_LEVEL]: ['cto', 'ceo', 'cfo', 'coo', 'chief', 'c-level'],
  };

  private readonly functionKeywords = {
    [FunctionCategory.ENGINEERING]: [
      'engineer', 'developer', 'programmer', 'software', 'backend', 'frontend',
      'full stack', 'fullstack', 'devops', 'sre', 'qa', 'quality assurance',
      'mobile', 'ios', 'android', 'web developer', 'architect',
    ],
    [FunctionCategory.PRODUCT]: [
      'product manager', 'product owner', 'pm', 'product lead', 'product',
      'technical product', 'group product manager',
    ],
    [FunctionCategory.DESIGN]: [
      'designer', 'ux', 'ui', 'user experience', 'user interface',
      'product designer', 'visual designer', 'interaction designer',
      'design lead', 'creative',
    ],
    [FunctionCategory.DATA]: [
      'data scientist', 'data analyst', 'data engineer', 'machine learning',
      'ml engineer', 'ai', 'artificial intelligence', 'analytics',
      'business intelligence', 'bi', 'statistician',
    ],
    [FunctionCategory.MARKETING]: [
      'marketing', 'growth', 'content', 'social media', 'seo', 'sem',
      'demand generation', 'brand', 'communications', 'pr',
    ],
    [FunctionCategory.SALES]: [
      'sales', 'account executive', 'ae', 'business development', 'bd',
      'account manager', 'sales development', 'sdr', 'bdr',
    ],
    [FunctionCategory.CUSTOMER_SUCCESS]: [
      'customer success', 'customer support', 'support', 'success manager',
      'customer experience', 'account support', 'technical support',
    ],
    [FunctionCategory.OPERATIONS]: [
      'operations', 'ops', 'program manager', 'project manager',
      'business operations', 'it operations',
    ],
    [FunctionCategory.FINANCE]: [
      'finance', 'accounting', 'accountant', 'financial', 'controller',
      'treasury', 'fp&a', 'financial planning',
    ],
    [FunctionCategory.LEGAL]: [
      'legal', 'lawyer', 'attorney', 'counsel', 'compliance',
      'regulatory', 'paralegal',
    ],
    [FunctionCategory.HR]: [
      'hr', 'human resources', 'recruiter', 'recruiting', 'talent',
      'people operations', 'people partner', 'compensation',
    ],
    [FunctionCategory.EXECUTIVE]: [
      'ceo', 'cto', 'cfo', 'coo', 'cmo', 'chief', 'president',
      'vice president', 'vp', 'executive director',
    ],
  };

  // Common title transformations
  private readonly titleReplacements = {
    'sw engineer': 'software engineer',
    'fe developer': 'frontend developer',
    'be developer': 'backend developer',
    'fs developer': 'full stack developer',
    'ml engineer': 'machine learning engineer',
    'sre': 'site reliability engineer',
    'devops': 'devops engineer',
    'qa': 'qa engineer',
    'pm': 'product manager',
    'ux/ui': 'ux ui designer',
    'hr': 'human resources',
    'jr': 'junior',
    'sr': 'senior',
  };

  constructor(
    @InjectRepository(JobTitleMapping)
    private readonly titleMappingRepository: Repository<JobTitleMapping>,
  ) {}

  /**
   * Normalize a job title
   */
  async normalizeTitle(rawTitle: string): Promise<TitleNormalizationResult> {
    try {
      // Check cache first
      const cachedMapping = await this.findCachedMapping(rawTitle);
      if (cachedMapping) {
        return this.buildResultFromMapping(cachedMapping);
      }

      // Perform normalization
      const normalized = await this.performNormalization(rawTitle);

      // Save mapping for future use
      await this.saveTitleMapping(rawTitle, normalized);

      return normalized;
    } catch (error) {
      this.logger.error(`Error normalizing title "${rawTitle}": ${error.message}`);
      throw error;
    }
  }

  /**
   * Normalize multiple titles in batch
   */
  async normalizeTitles(rawTitles: string[]): Promise<Map<string, TitleNormalizationResult>> {
    const results = new Map<string, TitleNormalizationResult>();

    for (const title of rawTitles) {
      try {
        const normalized = await this.normalizeTitle(title);
        results.set(title, normalized);
      } catch (error) {
        this.logger.error(`Error normalizing title "${title}": ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Check if a cached mapping exists
   */
  private async findCachedMapping(rawTitle: string): Promise<JobTitleMapping | null> {
    return this.titleMappingRepository.findOne({
      where: { raw_title: rawTitle.toLowerCase().trim() },
    });
  }

  /**
   * Perform the actual normalization
   */
  private async performNormalization(rawTitle: string): Promise<TitleNormalizationResult> {
    const cleanTitle = this.cleanTitle(rawTitle);
    const lowerTitle = cleanTitle.toLowerCase();

    // Extract seniority level
    const seniority = this.extractSeniority(lowerTitle);

    // Extract function category
    const functionCategory = this.extractFunction(lowerTitle);

    // Build standardized title
    const roleFamily = this.extractRoleFamily(lowerTitle, functionCategory);
    const standardizedTitle = this.buildStandardizedTitle(seniority, roleFamily);

    // Calculate confidence score
    const confidence = this.calculateConfidence(rawTitle, {
      standardizedTitle,
      seniority,
      functionCategory,
      roleFamily,
    });

    return {
      standardized_title: standardizedTitle,
      seniority_level: seniority,
      function_category: functionCategory,
      confidence_score: confidence,
      role_family: roleFamily,
    };
  }

  /**
   * Clean and normalize the title string
   */
  private cleanTitle(title: string): string {
    let cleaned = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, ' ') // Remove special chars except hyphen
      .replace(/\s+/g, ' '); // Normalize whitespace

    // Apply common replacements
    for (const [key, value] of Object.entries(this.titleReplacements)) {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      cleaned = cleaned.replace(regex, value);
    }

    return cleaned;
  }

  /**
   * Extract seniority level from title
   */
  private extractSeniority(title: string): SeniorityLevel | undefined {
    for (const [level, keywords] of Object.entries(this.seniorityKeywords)) {
      for (const keyword of keywords) {
        if (title.includes(keyword)) {
          return level as SeniorityLevel;
        }
      }
    }

    // Default heuristics
    if (title.match(/\b(i|1)\b/)) {return SeniorityLevel.JUNIOR;}
    if (title.match(/\b(ii|2)\b/)) {return SeniorityLevel.MID;}
    if (title.match(/\b(iii|3)\b/)) {return SeniorityLevel.SENIOR;}
    if (title.match(/\b(iv|4)\b/)) {return SeniorityLevel.LEAD;}

    return undefined; // Let ML model decide
  }

  /**
   * Extract function category from title
   */
  private extractFunction(title: string): FunctionCategory {
    for (const [category, keywords] of Object.entries(this.functionKeywords)) {
      for (const keyword of keywords) {
        if (title.includes(keyword)) {
          return category as FunctionCategory;
        }
      }
    }

    return FunctionCategory.OTHER;
  }

  /**
   * Extract core role family (without seniority)
   */
  private extractRoleFamily(title: string, category: FunctionCategory): string {
    // Remove seniority keywords
    let roleFamily = title;
    for (const keywords of Object.values(this.seniorityKeywords)) {
      for (const keyword of keywords) {
        roleFamily = roleFamily.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '');
      }
    }

    roleFamily = roleFamily.trim().replace(/\s+/g, ' ');

    // Standardize based on category
    const standardFamilies: Record<string, string> = {
      [FunctionCategory.ENGINEERING]: 'Software Engineer',
      [FunctionCategory.PRODUCT]: 'Product Manager',
      [FunctionCategory.DESIGN]: 'Product Designer',
      [FunctionCategory.DATA]: 'Data Scientist',
      [FunctionCategory.MARKETING]: 'Marketing Manager',
      [FunctionCategory.SALES]: 'Account Executive',
      [FunctionCategory.CUSTOMER_SUCCESS]: 'Customer Success Manager',
      [FunctionCategory.OPERATIONS]: 'Operations Manager',
      [FunctionCategory.FINANCE]: 'Finance Manager',
      [FunctionCategory.LEGAL]: 'Legal Counsel',
      [FunctionCategory.HR]: 'HR Manager',
      [FunctionCategory.EXECUTIVE]: 'Executive',
    };

    return standardFamilies[category] || this.capitalizeTitle(roleFamily);
  }

  /**
   * Build standardized title with seniority
   */
  private buildStandardizedTitle(seniority: SeniorityLevel | undefined, roleFamily: string): string {
    if (!seniority) {
      return roleFamily;
    }

    const seniorityLabels: Record<SeniorityLevel, string> = {
      [SeniorityLevel.INTERN]: 'Intern',
      [SeniorityLevel.ENTRY]: 'Entry-Level',
      [SeniorityLevel.JUNIOR]: 'Junior',
      [SeniorityLevel.MID]: 'Mid-Level',
      [SeniorityLevel.SENIOR]: 'Senior',
      [SeniorityLevel.LEAD]: 'Lead',
      [SeniorityLevel.PRINCIPAL]: 'Principal',
      [SeniorityLevel.STAFF]: 'Staff',
      [SeniorityLevel.DIRECTOR]: 'Director of',
      [SeniorityLevel.VP]: 'VP of',
      [SeniorityLevel.C_LEVEL]: 'Chief',
    };

    const label = seniorityLabels[seniority];

    if (seniority === SeniorityLevel.DIRECTOR || seniority === SeniorityLevel.VP) {
      return `${label} ${roleFamily}`;
    }

    if (seniority === SeniorityLevel.C_LEVEL) {
      // Special handling for C-level
      return roleFamily; // Usually already contains "Chief"
    }

    return `${label} ${roleFamily}`;
  }

  /**
   * Calculate confidence score for the normalization
   */
  private calculateConfidence(
    rawTitle: string,
    result: { standardizedTitle: string; seniority?: SeniorityLevel; functionCategory: FunctionCategory; roleFamily: string },
  ): number {
    let confidence = 50; // Base confidence

    // Increase if seniority was detected
    if (result.seniority) {confidence += 15;}

    // Increase if function category is specific (not OTHER)
    if (result.functionCategory !== FunctionCategory.OTHER) {confidence += 20;}

    // Increase if title is common/standard
    const isStandardTitle = this.isStandardTitle(rawTitle);
    if (isStandardTitle) {confidence += 15;}

    // Decrease if title is very short or very long
    const titleLength = rawTitle.split(' ').length;
    if (titleLength < 2) {confidence -= 10;}
    if (titleLength > 8) {confidence -= 10;}

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Check if title is a standard/common one
   */
  private isStandardTitle(title: string): boolean {
    const standardTitles = [
      'software engineer',
      'product manager',
      'product designer',
      'data scientist',
      'data analyst',
      'marketing manager',
      'account executive',
      'customer success manager',
    ];

    const lowerTitle = title.toLowerCase();
    return standardTitles.some((standard) => lowerTitle.includes(standard));
  }

  /**
   * Capitalize title words properly
   */
  private capitalizeTitle(title: string): string {
    const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];

    return title
      .split(' ')
      .map((word, index) => {
        if (index > 0 && smallWords.includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Save title mapping to database
   */
  private async saveTitleMapping(rawTitle: string, result: TitleNormalizationResult): Promise<void> {
    try {
      const existing = await this.titleMappingRepository.findOne({
        where: { raw_title: rawTitle.toLowerCase().trim() },
      });

      if (existing) {
        // Update occurrence count
        existing.occurrence_count += 1;
        existing.confidence_score = result.confidence_score;
        await this.titleMappingRepository.save(existing);
      } else {
        // Create new mapping
        const mapping = this.titleMappingRepository.create({
          raw_title: rawTitle.toLowerCase().trim(),
          standardized_title: result.standardized_title,
          seniority_level: result.seniority_level,
          function_category: result.function_category,
          confidence_score: result.confidence_score,
          occurrence_count: 1,
        });
        await this.titleMappingRepository.save(mapping);
      }
    } catch (error) {
      this.logger.error(`Error saving title mapping: ${error.message}`);
    }
  }

  /**
   * Build result from cached mapping
   */
  private buildResultFromMapping(mapping: JobTitleMapping): TitleNormalizationResult {
    return {
      standardized_title: mapping.standardized_title,
      seniority_level: mapping.seniority_level as SeniorityLevel,
      function_category: mapping.function_category as FunctionCategory,
      confidence_score: Number(mapping.confidence_score),
    };
  }
}

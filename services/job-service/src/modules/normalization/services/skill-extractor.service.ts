import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { SkillMapping, SkillCategory } from '../entities/job-taxonomy.entity';

import { Repository } from 'typeorm';


interface SkillExtractionResult {
  categorized_skills: {
    technical: string[];
    soft: string[];
    domain: string[];
    certifications: string[];
  };
  required_skills: string[];
  preferred_skills: string[];
  confidence_score: number;
}

@Injectable()
export class SkillExtractorService {
  private readonly logger = new Logger(SkillExtractorService.name);

  // Comprehensive skill dictionary
  private readonly technicalSkills = {
    // Programming Languages
    languages: [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust',
      'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html',
      'css', 'sass', 'less', 'dart', 'objective-c', 'perl', 'shell', 'bash',
    ],
    // Frameworks & Libraries
    frameworks: [
      'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'gatsby',
      'node.js', 'express', 'nestjs', 'fastify', 'django', 'flask', 'fastapi',
      'spring', 'spring boot', 'rails', 'laravel', 'symfony', '.net', 'asp.net',
      'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
    ],
    // Databases
    databases: [
      'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
      'cassandra', 'oracle', 'sql server', 'sqlite', 'neo4j', 'couchdb',
      'firebase', 'supabase', 'prisma', 'typeorm', 'sequelize',
    ],
    // Cloud & Infrastructure
    cloud: [
      'aws', 'azure', 'gcp', 'google cloud', 'amazon web services', 'heroku',
      'digitalocean', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible',
      'jenkins', 'circleci', 'github actions', 'gitlab ci', 'cloudformation',
    ],
    // Tools & Platforms
    tools: [
      'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack',
      'figma', 'sketch', 'adobe xd', 'invision', 'postman', 'swagger',
      'datadog', 'new relic', 'grafana', 'prometheus', 'sentry',
    ],
  };

  private readonly softSkills = [
    'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
    'collaboration', 'adaptability', 'time management', 'creativity', 'attention to detail',
    'analytical thinking', 'decision making', 'conflict resolution', 'emotional intelligence',
    'mentoring', 'coaching', 'presentation', 'negotiation', 'strategic thinking',
    'project management', 'stakeholder management', 'cross-functional collaboration',
  ];

  private readonly certifications = [
    'aws certified', 'azure certified', 'gcp certified', 'pmp', 'scrum master',
    'csm', 'cissp', 'ceh', 'comptia', 'cfa', 'cpa', 'cism', 'togaf',
    'itil', 'six sigma', 'lean', 'prince2',
  ];

  private readonly requirementKeywords = [
    'required', 'must have', 'mandatory', 'essential', 'necessary',
    'minimum', 'requires', 'need', 'should have',
  ];

  private readonly preferredKeywords = [
    'preferred', 'nice to have', 'bonus', 'plus', 'desirable',
    'advantage', 'beneficial', 'ideal', 'would be great',
  ];

  constructor(
    @InjectRepository(SkillMapping)
    private readonly skillMappingRepository: Repository<SkillMapping>,
  ) {}

  /**
   * Extract skills from job description and requirements
   */
  async extractSkills(
    description: string,
    requirements: string[],
    benefits?: string[],
  ): Promise<SkillExtractionResult> {
    try {
      const allText = [description, ...requirements, ...(benefits || [])].join(' ');

      // Extract different types of skills
      const technical = await this.extractTechnicalSkills(allText);
      const soft = this.extractSoftSkills(allText);
      const domain = this.extractDomainSkills(allText);
      const certifications = this.extractCertifications(allText);

      // Categorize as required vs preferred
      const { required, preferred } = this.categorizeByImportance(
        [...technical, ...soft, ...domain, ...certifications],
        requirements,
      );

      // Calculate confidence
      const confidence = this.calculateExtractionConfidence({
        technical,
        soft,
        domain,
        certifications,
      });

      return {
        categorized_skills: {
          technical,
          soft,
          domain,
          certifications,
        },
        required_skills: required,
        preferred_skills: preferred,
        confidence_score: confidence,
      };
    } catch (error) {
      this.logger.error(`Error extracting skills: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract technical skills (languages, frameworks, tools)
   */
  private async extractTechnicalSkills(text: string): Promise<string[]> {
    const lowerText = text.toLowerCase();
    const foundSkills = new Set<string>();

    // Check all technical skill categories
    for (const skillList of Object.values(this.technicalSkills)) {
      for (const skill of skillList) {
        // Use word boundary regex for more accurate matching
        const regex = new RegExp(`\\b${this.escapeRegex(skill)}\\b`, 'gi');
        if (regex.test(lowerText)) {
          // Normalize the skill name
          const normalized = await this.normalizeSkill(skill);
          foundSkills.add(normalized);
        }
      }
    }

    // Check database for additional known skills
    const additionalSkills = await this.findSkillsInDatabase(lowerText, SkillCategory.TECHNICAL);
    additionalSkills.forEach((skill) => foundSkills.add(skill));

    return Array.from(foundSkills);
  }

  /**
   * Extract soft skills
   */
  private extractSoftSkills(text: string): string[] {
    const lowerText = text.toLowerCase();
    const foundSkills = new Set<string>();

    for (const skill of this.softSkills) {
      const regex = new RegExp(`\\b${this.escapeRegex(skill)}\\b`, 'gi');
      if (regex.test(lowerText)) {
        foundSkills.add(this.capitalizeSkill(skill));
      }
    }

    return Array.from(foundSkills);
  }

  /**
   * Extract domain-specific skills
   */
  private extractDomainSkills(text: string): string[] {
    const lowerText = text.toLowerCase();
    const domainSkills = new Set<string>();

    // Domain-specific patterns
    const domainPatterns = {
      'Machine Learning': /\b(machine learning|ml|deep learning|neural networks|nlp|computer vision)\b/gi,
      'DevOps': /\b(devops|ci\/cd|continuous integration|continuous deployment)\b/gi,
      'Agile': /\b(agile|scrum|kanban|sprint|user stories)\b/gi,
      'Security': /\b(security|cybersecurity|penetration testing|vulnerability|encryption)\b/gi,
      'Data Analysis': /\b(data analysis|analytics|business intelligence|data visualization)\b/gi,
      'API Design': /\b(api design|rest api|graphql|microservices|api development)\b/gi,
      'Mobile Development': /\b(mobile development|ios development|android development|mobile apps)\b/gi,
      'E-commerce': /\b(e-commerce|ecommerce|online retail|payment processing)\b/gi,
      'Healthcare': /\b(healthcare|hipaa|ehr|medical|clinical)\b/gi,
      'Financial Services': /\b(fintech|banking|trading|payments|financial services)\b/gi,
    };

    for (const [domain, pattern] of Object.entries(domainPatterns)) {
      if (pattern.test(lowerText)) {
        domainSkills.add(domain);
      }
    }

    return Array.from(domainSkills);
  }

  /**
   * Extract required certifications
   */
  private extractCertifications(text: string): string[] {
    const lowerText = text.toLowerCase();
    const foundCerts = new Set<string>();

    for (const cert of this.certifications) {
      const regex = new RegExp(`\\b${this.escapeRegex(cert)}\\b`, 'gi');
      if (regex.test(lowerText)) {
        foundCerts.add(this.capitalizeSkill(cert));
      }
    }

    return Array.from(foundCerts);
  }

  /**
   * Categorize skills as required vs preferred
   */
  private categorizeByImportance(
    skills: string[],
    requirements: string[],
  ): { required: string[]; preferred: string[] } {
    const required = new Set<string>();
    const preferred = new Set<string>();
    const requirementsText = requirements.join(' ').toLowerCase();

    for (const skill of skills) {
      const skillLower = skill.toLowerCase();

      // Check if skill appears in a "required" context
      let isRequired = false;
      let isPreferred = false;

      // Look for requirement keywords near the skill
      for (const keyword of this.requirementKeywords) {
        const pattern = new RegExp(`${keyword}[^.]{0,100}${this.escapeRegex(skillLower)}`, 'i');
        if (pattern.test(requirementsText)) {
          isRequired = true;
          break;
        }
      }

      // Look for preferred keywords near the skill
      for (const keyword of this.preferredKeywords) {
        const pattern = new RegExp(`${keyword}[^.]{0,100}${this.escapeRegex(skillLower)}`, 'i');
        if (pattern.test(requirementsText)) {
          isPreferred = true;
          break;
        }
      }

      if (isRequired) {
        required.add(skill);
      } else if (isPreferred) {
        preferred.add(skill);
      } else {
        // Default: if it appears in requirements, consider it required
        if (requirementsText.includes(skillLower)) {
          required.add(skill);
        }
      }
    }

    return {
      required: Array.from(required),
      preferred: Array.from(preferred),
    };
  }

  /**
   * Find additional skills from database mappings
   */
  private async findSkillsInDatabase(text: string, category: SkillCategory): Promise<string[]> {
    try {
      // This would query the database for skills found in the text
      // For now, return empty array (can be enhanced with actual DB lookup)
      return [];
    } catch (error) {
      this.logger.error(`Error finding skills in database: ${error.message}`);
      return [];
    }
  }

  /**
   * Normalize skill name using database mappings
   */
  private async normalizeSkill(skill: string): Promise<string> {
    try {
      const mapping = await this.skillMappingRepository.findOne({
        where: { raw_skill: skill.toLowerCase() },
      });

      if (mapping) {
        return mapping.standardized_skill;
      }

      // Default: capitalize properly
      return this.capitalizeSkill(skill);
    } catch (error) {
      return this.capitalizeSkill(skill);
    }
  }

  /**
   * Calculate confidence score for skill extraction
   */
  private calculateExtractionConfidence(skills: {
    technical: string[];
    soft: string[];
    domain: string[];
    certifications: string[];
  }): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on number of skills found
    const totalSkills =
      skills.technical.length +
      skills.soft.length +
      skills.domain.length +
      skills.certifications.length;

    if (totalSkills > 5) {confidence += 20;}
    else if (totalSkills > 3) {confidence += 10;}
    else if (totalSkills === 0) {confidence -= 30;}

    // Increase if we found technical skills (most important)
    if (skills.technical.length > 0) {confidence += 15;}

    // Increase if we found domain skills
    if (skills.domain.length > 0) {confidence += 10;}

    // Increase if balanced across categories
    const categories = [
      skills.technical.length > 0,
      skills.soft.length > 0,
      skills.domain.length > 0,
    ].filter(Boolean).length;

    if (categories >= 2) {confidence += 5;}

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Capitalize skill name properly
   */
  private capitalizeSkill(skill: string): string {
    // Handle special cases
    const specialCases: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'nodejs': 'Node.js',
      'nextjs': 'Next.js',
      'postgresql': 'PostgreSQL',
      'mongodb': 'MongoDB',
      'graphql': 'GraphQL',
      'aws': 'AWS',
      'gcp': 'GCP',
      'api': 'API',
      'rest': 'REST',
      'sql': 'SQL',
      'html': 'HTML',
      'css': 'CSS',
      'ui': 'UI',
      'ux': 'UX',
      'ml': 'ML',
      'ai': 'AI',
      'ci/cd': 'CI/CD',
    };

    const lower = skill.toLowerCase();
    if (specialCases[lower]) {
      return specialCases[lower];
    }

    // Default capitalization
    return skill
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

import { Injectable, Logger } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { ResumeContent } from '../resumes/entities/resume.entity';

// Local type definitions for parser
interface PersonalInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  github?: string;
}

interface Experience {
  id?: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
  achievements?: string[];
  highlights?: string[];
}

interface Education {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  achievements?: string[];
}

interface Skill {
  id?: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'tool' | 'other';
  level?: string;
}

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  /**
   * Parse PDF file and extract resume data
   */
  async parsePdf(buffer: Buffer): Promise<ResumeContent> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text;
      return this.parseText(text);
    } catch (error) {
      this.logger.error(`Failed to parse PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse DOCX file and extract resume data
   */
  async parseDocx(buffer: Buffer): Promise<ResumeContent> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;
      return this.parseText(text);
    } catch (error) {
      this.logger.error(`Failed to parse DOCX: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse plain text and extract resume data
   * This is a basic implementation that uses pattern matching
   * In production, this would integrate with an AI service for better accuracy
   */
  private parseText(text: string): ResumeContent {
    const content: ResumeContent = {
      personalInfo: this.extractPersonalInfo(text),
      summary: this.extractSummary(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text),
      skills: this.extractSkills(text),
      certifications: this.extractCertifications(text),
      projects: this.extractProjects(text),
      languages: this.extractLanguages(text),
    };

    return content;
  }

  /**
   * Extract personal information from text
   */
  private extractPersonalInfo(text: string): PersonalInfo | undefined {
    const lines = text.split('\n');
    const personalInfo: Partial<PersonalInfo> = {};

    // Extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      personalInfo.email = emailMatch[0];
    }

    // Extract phone
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      personalInfo.phone = phoneMatch[0];
    }

    // Extract name (usually first non-empty line)
    const nameMatch = lines.find(line => line.trim().length > 0 && line.length < 50);
    if (nameMatch) {
      personalInfo.fullName = nameMatch.trim();
    }

    // Extract LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/([\w-]+)/i);
    if (linkedinMatch) {
      personalInfo.linkedin = linkedinMatch[0];
    }

    // Extract GitHub
    const githubMatch = text.match(/github\.com\/([\w-]+)/i);
    if (githubMatch) {
      personalInfo.github = githubMatch[0];
    }

    // Extract location (look for city, state patterns)
    const locationMatch = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/);
    if (locationMatch) {
      personalInfo.location = locationMatch[0];
    }

    if (!personalInfo.email || !personalInfo.phone || !personalInfo.fullName) {
      return undefined;
    }

    return personalInfo as PersonalInfo;
  }

  /**
   * Extract professional summary
   */
  private extractSummary(text: string): string | undefined {
    const summaryPatterns = [
      /(?:professional\s+)?summary[:\n]+([\s\S]{50,500}?)(?:\n\n|experience|education|skills)/i,
      /(?:objective|profile)[:\n]+([\s\S]{50,500}?)(?:\n\n|experience|education|skills)/i,
    ];

    for (const pattern of summaryPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract work experience
   */
  private extractExperience(text: string): Experience[] {
    const experiences: Experience[] = [];

    // Find experience section
    const experienceMatch = text.match(/(?:work\s+)?experience[:\n]+([\s\S]+?)(?:\n\n(?:education|skills|projects|certifications)|$)/i);
    if (!experienceMatch) {
      return experiences;
    }

    const experienceText = experienceMatch[1];

    // Split by likely job entries (date patterns)
    const entries = experienceText.split(/(?=\d{4}\s*[-–]\s*(?:\d{4}|present))/i);

    for (const entry of entries) {
      if (entry.trim().length < 20) continue;

      const experience: Partial<Experience> = {
        id: uuidv4(),
        highlights: [],
      };

      // Extract dates
      const dateMatch = entry.match(/(\d{4})\s*[-–]\s*((?:\d{4}|present))/i);
      if (dateMatch) {
        experience.startDate = `${dateMatch[1]}-01-01`;
        experience.endDate = dateMatch[2].toLowerCase() === 'present' ? undefined : `${dateMatch[2]}-12-31`;
        experience.current = dateMatch[2].toLowerCase() === 'present';
      } else {
        experience.current = false;
      }

      // Extract company and position
      const lines = entry.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length >= 2) {
        experience.position = lines[0];
        experience.company = lines[1];
        experience.description = lines.slice(2).join(' ');

        // Extract bullet points as highlights
        const bulletMatch = entry.match(/[•\-*]\s*(.+)/g);
        if (bulletMatch) {
          experience.highlights = bulletMatch.map(b => b.replace(/^[•\-*]\s*/, '').trim());
        }
      }

      if (experience.company && experience.position) {
        experiences.push(experience as Experience);
      }
    }

    return experiences;
  }

  /**
   * Extract education
   */
  private extractEducation(text: string): Education[] {
    const educationList: Education[] = [];

    const educationMatch = text.match(/education[:\n]+([\s\S]+?)(?:\n\n(?:experience|skills|projects|certifications)|$)/i);
    if (!educationMatch) {
      return educationList;
    }

    const educationText = educationMatch[1];
    const entries = educationText.split(/(?=\d{4})/);

    for (const entry of entries) {
      if (entry.trim().length < 20) continue;

      const education: Partial<Education> = {
        id: uuidv4(),
      };

      // Extract dates
      const dateMatch = entry.match(/(\d{4})\s*[-–]\s*(\d{4})/);
      if (dateMatch) {
        education.startDate = `${dateMatch[1]}-09-01`;
        education.endDate = `${dateMatch[2]}-05-31`;
      }

      // Extract degree and field
      const degreeMatch = entry.match(/(bachelor|master|phd|associate|b\.?s\.?|m\.?s\.?|ph\.?d\.?|b\.?a\.?|m\.?a\.?)[\s\w]+(in\s+)?(\w[\w\s]+)/i);
      if (degreeMatch) {
        education.degree = degreeMatch[0].split('in')[0].trim();
        education.field = degreeMatch[0].split('in')[1]?.trim() || '';
      }

      // Extract institution
      const lines = entry.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length > 0) {
        education.institution = lines[0];
      }

      // Extract GPA
      const gpaMatch = entry.match(/gpa[:\s]+(\d\.\d+)/i);
      if (gpaMatch) {
        education.gpa = gpaMatch[1];
      }

      if (education.institution && education.degree) {
        educationList.push(education as Education);
      }
    }

    return educationList;
  }

  /**
   * Extract skills
   */
  private extractSkills(text: string): { technical?: string[]; soft?: string[]; languages?: string[]; tools?: string[] } | undefined {
    const skillsMatch = text.match(/skills[:\n]+([\s\S]+?)(?:\n\n(?:experience|education|projects|certifications)|$)/i);
    if (!skillsMatch) {
      return undefined;
    }

    const skillsText = skillsMatch[1];

    // Split by commas, bullets, or newlines
    const skillItems = skillsText
      .split(/[,•\n-]/)
      .map(s => s.trim())
      .filter(s => s && s.length < 50);

    const result: { technical?: string[]; soft?: string[]; languages?: string[]; tools?: string[] } = {};
    const technical: string[] = [];
    const soft: string[] = [];
    const tools: string[] = [];

    for (const skillName of skillItems) {
      const category = this.categorizeSkill(skillName);
      if (category === 'technical' || category === 'language') {
        technical.push(skillName);
      } else if (category === 'soft') {
        soft.push(skillName);
      } else if (category === 'tool') {
        tools.push(skillName);
      } else {
        technical.push(skillName); // Default to technical
      }
    }

    if (technical.length > 0) result.technical = technical;
    if (soft.length > 0) result.soft = soft;
    if (tools.length > 0) result.tools = tools;

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Categorize skill based on name
   */
  private categorizeSkill(skillName: string): 'technical' | 'soft' | 'language' | 'tool' | 'other' {
    const technical = ['javascript', 'python', 'java', 'c++', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes'];
    const soft = ['communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking'];
    const tools = ['git', 'jira', 'figma', 'photoshop', 'excel'];

    const lowerSkill = skillName.toLowerCase();

    if (technical.some(t => lowerSkill.includes(t))) return 'technical';
    if (soft.some(s => lowerSkill.includes(s))) return 'soft';
    if (tools.some(t => lowerSkill.includes(t))) return 'tool';

    return 'other';
  }

  /**
   * Extract certifications
   */
  private extractCertifications(text: string): any[] {
    const certifications: any[] = [];

    const certsMatch = text.match(/certifications?[:\n]+([\s\S]+?)(?:\n\n(?:experience|education|skills|projects)|$)/i);
    if (!certsMatch) {
      return certifications;
    }

    const certsText = certsMatch[1];
    const lines = certsText.split('\n').map(l => l.trim()).filter(l => l);

    for (const line of lines) {
      if (line.length < 5) continue;

      const certification: any = {
        id: uuidv4(),
        name: line,
        issuer: 'Unknown',
        date: new Date().toISOString().split('T')[0],
      };

      // Try to extract issuer
      const issuerMatch = line.match(/(.+?)\s*[-–]\s*(.+)/);
      if (issuerMatch) {
        certification.name = issuerMatch[1].trim();
        certification.issuer = issuerMatch[2].trim();
      }

      certifications.push(certification);
    }

    return certifications;
  }

  /**
   * Extract projects
   */
  private extractProjects(text: string): any[] {
    const projects: any[] = [];

    const projectsMatch = text.match(/projects[:\n]+([\s\S]+?)(?:\n\n(?:experience|education|skills|certifications)|$)/i);
    if (!projectsMatch) {
      return projects;
    }

    const projectsText = projectsMatch[1];
    const entries = projectsText.split(/\n(?=[A-Z])/);

    for (const entry of entries) {
      if (entry.trim().length < 20) continue;

      const lines = entry.split('\n').map(l => l.trim()).filter(l => l);

      const project: any = {
        id: uuidv4(),
        name: lines[0] || 'Unnamed Project',
        description: lines.slice(1).join(' ') || '',
        technologies: [],
        highlights: [],
        startDate: new Date().toISOString().split('T')[0],
      };

      // Extract technologies
      const techMatch = entry.match(/(?:technologies|tech stack)[:\s]+(.+)/i);
      if (techMatch) {
        project.technologies = techMatch[1].split(/[,;]/).map(t => t.trim());
      }

      projects.push(project);
    }

    return projects;
  }

  /**
   * Extract languages
   */
  private extractLanguages(text: string): Array<{ language: string; proficiency: string }> {
    const languages: Array<{ language: string; proficiency: string }> = [];

    const langMatch = text.match(/languages[:\n]+([\s\S]+?)(?:\n\n(?:experience|education|skills|projects|certifications)|$)/i);
    if (!langMatch) {
      return languages;
    }

    const langText = langMatch[1];
    const items = langText.split(/[,\n]/).map(l => l.trim()).filter(l => l);

    for (const item of items) {
      let proficiency = 'professional';

      // Check for proficiency level
      if (/native|fluent/i.test(item)) {
        proficiency = 'native';
      } else if (/basic|beginner/i.test(item)) {
        proficiency = 'basic';
      } else if (/conversational/i.test(item)) {
        proficiency = 'conversational';
      }

      // Extract just the language name
      const languageName = item.replace(/\s*(native|fluent|basic|beginner|conversational|professional).*/i, '').trim();

      if (languageName) {
        languages.push({
          language: languageName,
          proficiency,
        });
      }
    }

    return languages;
  }
}

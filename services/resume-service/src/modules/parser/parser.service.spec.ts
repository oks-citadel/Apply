import { Test, TestingModule } from '@nestjs/testing';
import { ParserService } from './parser.service';
import { BadRequestException } from '@nestjs/common';

describe('ParserService', () => {
  let service: ParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParserService],
    }).compile();

    service = module.get<ParserService>(ParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parsePDF', () => {
    it('should parse PDF and extract text', async () => {
      const mockBuffer = Buffer.from('Mock PDF content');

      const result = await service.parsePDF(mockBuffer);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('metadata');
    });

    it('should throw BadRequestException for invalid PDF', async () => {
      const invalidBuffer = Buffer.from('Not a PDF');

      await expect(service.parsePDF(invalidBuffer)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should extract structured data from PDF', async () => {
      const mockBuffer = Buffer.from('Name: John Doe\nEmail: john@example.com');

      const result = await service.parsePDF(mockBuffer);

      expect(result).toHaveProperty('personalInfo');
      expect(result.personalInfo).toHaveProperty('name');
      expect(result.personalInfo).toHaveProperty('email');
    });
  });

  describe('parseDOCX', () => {
    it('should parse DOCX and extract text', async () => {
      const mockBuffer = Buffer.from('Mock DOCX content');

      const result = await service.parseDOCX(mockBuffer);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('sections');
    });

    it('should throw BadRequestException for invalid DOCX', async () => {
      const invalidBuffer = Buffer.from('Not a DOCX');

      await expect(service.parseDOCX(invalidBuffer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('extractPersonalInfo', () => {
    it('should extract name from text', () => {
      const text = 'John Doe\njohn.doe@example.com\n+1234567890';

      const result = service.extractPersonalInfo(text);

      expect(result).toHaveProperty('name');
      expect(result.name).toBeTruthy();
    });

    it('should extract email from text', () => {
      const text = 'Contact: john.doe@example.com';

      const result = service.extractPersonalInfo(text);

      expect(result).toHaveProperty('email');
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should extract phone number from text', () => {
      const text = 'Phone: +1 (555) 123-4567';

      const result = service.extractPersonalInfo(text);

      expect(result).toHaveProperty('phone');
      expect(result.phone).toBeTruthy();
    });

    it('should extract LinkedIn URL', () => {
      const text = 'LinkedIn: https://linkedin.com/in/johndoe';

      const result = service.extractPersonalInfo(text);

      expect(result).toHaveProperty('linkedin');
      expect(result.linkedin).toContain('linkedin.com');
    });
  });

  describe('extractExperience', () => {
    it('should extract work experience', () => {
      const text = `
        Software Engineer at Tech Company
        January 2020 - Present
        - Developed web applications
        - Led team of 5 developers
      `;

      const result = service.extractExperience(text);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('position');
      expect(result[0]).toHaveProperty('company');
    });

    it('should parse dates correctly', () => {
      const text = `
        Senior Developer
        Tech Corp
        June 2018 - December 2020
      `;

      const result = service.extractExperience(text);

      expect(result[0]).toHaveProperty('startDate');
      expect(result[0]).toHaveProperty('endDate');
    });

    it('should handle current positions', () => {
      const text = `
        Lead Engineer
        Current Company
        January 2021 - Present
      `;

      const result = service.extractExperience(text);

      expect(result[0].endDate).toBeNull();
      expect(result[0].isCurrent).toBe(true);
    });
  });

  describe('extractEducation', () => {
    it('should extract education information', () => {
      const text = `
        Bachelor of Science in Computer Science
        University of Technology
        2015 - 2019
        GPA: 3.8
      `;

      const result = service.extractEducation(text);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('degree');
      expect(result[0]).toHaveProperty('institution');
      expect(result[0]).toHaveProperty('graduationYear');
    });

    it('should extract GPA if present', () => {
      const text = 'Bachelor of Arts, State University, GPA: 3.9/4.0';

      const result = service.extractEducation(text);

      expect(result[0]).toHaveProperty('gpa');
      expect(result[0].gpa).toBe('3.9');
    });
  });

  describe('extractSkills', () => {
    it('should extract technical skills', () => {
      const text = `
        Skills: JavaScript, Python, React, Node.js, Docker, AWS
      `;

      const result = service.extractSkills(text);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('JavaScript');
      expect(result).toContain('Python');
      expect(result).toContain('React');
    });

    it('should handle skills in sections', () => {
      const text = `
        SKILLS
        Programming Languages: JavaScript, Python, Java
        Frameworks: React, Angular, Vue.js
        Tools: Git, Docker, Kubernetes
      `;

      const result = service.extractSkills(text);

      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('JavaScript');
      expect(result).toContain('React');
      expect(result).toContain('Docker');
    });

    it('should remove duplicates', () => {
      const text = 'Skills: JavaScript, React, JavaScript, React';

      const result = service.extractSkills(text);

      const uniqueSkills = [...new Set(result)];
      expect(result.length).toBe(uniqueSkills.length);
    });
  });

  describe('parseResume', () => {
    it('should parse complete resume from buffer', async () => {
      const mockBuffer = Buffer.from(`
        John Doe
        john@example.com
        +1234567890

        EXPERIENCE
        Software Engineer at Tech Co
        2020 - Present

        EDUCATION
        BS Computer Science
        University of Tech, 2019

        SKILLS
        JavaScript, React, Node.js
      `);

      const result = await service.parseResume(mockBuffer, 'resume.pdf');

      expect(result).toHaveProperty('personalInfo');
      expect(result).toHaveProperty('experience');
      expect(result).toHaveProperty('education');
      expect(result).toHaveProperty('skills');
      expect(result.personalInfo.email).toBe('john@example.com');
      expect(result.skills).toContain('JavaScript');
    });

    it('should detect file type from filename', async () => {
      const mockBuffer = Buffer.from('Mock content');

      await service.parseResume(mockBuffer, 'resume.pdf');
      expect(service.parsePDF).toHaveBeenCalled();

      await service.parseResume(mockBuffer, 'resume.docx');
      expect(service.parseDOCX).toHaveBeenCalled();
    });

    it('should throw error for unsupported file type', async () => {
      const mockBuffer = Buffer.from('Mock content');

      await expect(
        service.parseResume(mockBuffer, 'resume.txt'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

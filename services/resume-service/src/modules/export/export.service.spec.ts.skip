import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { BadRequestException } from '@nestjs/common';

describe('ExportService', () => {
  let service: ExportService;

  const mockResume = {
    id: '1',
    userId: 'user-1',
    title: 'Software Engineer Resume',
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/johndoe',
    },
    summary: 'Experienced software engineer with 5+ years',
    experience: [
      {
        position: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        startDate: '2020-01',
        endDate: null,
        isCurrent: true,
        description: 'Led team of 5 developers',
        achievements: ['Increased performance by 50%', 'Reduced bugs by 30%'],
      },
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'University of Technology',
        graduationYear: '2018',
        gpa: '3.8',
      },
    ],
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
    certifications: [
      {
        name: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        date: '2022-06',
      },
    ],
    languages: [
      { name: 'English', proficiency: 'Native' },
      { name: 'Spanish', proficiency: 'Intermediate' },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportToPDF', () => {
    it('should export resume to PDF buffer', async () => {
      const result = await service.exportToPDF(mockResume as any);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include all resume sections', async () => {
      const result = await service.exportToPDF(mockResume as any);
      const pdfText = result.toString();

      expect(pdfText).toContain('John Doe');
      expect(pdfText).toContain('Software Engineer');
    });

    it('should apply custom template', async () => {
      const options = { template: 'modern' };

      const result = await service.exportToPDF(mockResume as any, options);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle missing optional fields', async () => {
      const minimalResume = {
        ...mockResume,
        certifications: [],
        languages: [],
      };

      const result = await service.exportToPDF(minimalResume as any);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportToDOCX', () => {
    it('should export resume to DOCX buffer', async () => {
      const result = await service.exportToDOCX(mockResume as any);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format sections properly', async () => {
      const result = await service.exportToDOCX(mockResume as any);

      expect(result).toBeDefined();
    });
  });

  describe('exportToJSON', () => {
    it('should export resume to JSON string', () => {
      const result = service.exportToJSON(mockResume as any);

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed.personalInfo.firstName).toBe('John');
    });

    it('should include all fields', () => {
      const result = service.exportToJSON(mockResume as any);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('personalInfo');
      expect(parsed).toHaveProperty('experience');
      expect(parsed).toHaveProperty('education');
      expect(parsed).toHaveProperty('skills');
    });
  });

  describe('exportToHTML', () => {
    it('should export resume to HTML string', async () => {
      const result = await service.exportToHTML(mockResume as any);

      expect(typeof result).toBe('string');
      expect(result).toContain('<html');
      expect(result).toContain('John Doe');
    });

    it('should apply CSS styling', async () => {
      const result = await service.exportToHTML(mockResume as any);

      expect(result).toContain('<style');
      expect(result).toContain('</style>');
    });

    it('should format lists properly', async () => {
      const result = await service.exportToHTML(mockResume as any);

      expect(result).toContain('<ul');
      expect(result).toContain('<li');
    });
  });

  describe('exportToMarkdown', () => {
    it('should export resume to Markdown string', () => {
      const result = service.exportToMarkdown(mockResume as any);

      expect(typeof result).toBe('string');
      expect(result).toContain('# John Doe');
      expect(result).toContain('## Experience');
    });

    it('should format sections with proper headers', () => {
      const result = service.exportToMarkdown(mockResume as any);

      expect(result).toContain('## Experience');
      expect(result).toContain('## Education');
      expect(result).toContain('## Skills');
    });

    it('should format lists as bullet points', () => {
      const result = service.exportToMarkdown(mockResume as any);

      expect(result).toContain('- JavaScript');
      expect(result).toContain('- TypeScript');
    });
  });

  describe('export', () => {
    it('should export to PDF format', async () => {
      const result = await service.export(mockResume as any, 'pdf');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should export to DOCX format', async () => {
      const result = await service.export(mockResume as any, 'docx');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should export to HTML format', async () => {
      const result = await service.export(mockResume as any, 'html');

      expect(typeof result).toBe('string');
      expect(result).toContain('<html');
    });

    it('should export to JSON format', async () => {
      const result = await service.export(mockResume as any, 'json');

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result as string);
      expect(parsed).toHaveProperty('personalInfo');
    });

    it('should export to Markdown format', async () => {
      const result = await service.export(mockResume as any, 'markdown');

      expect(typeof result).toBe('string');
      expect(result).toContain('# John Doe');
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        service.export(mockResume as any, 'unsupported' as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getContentType', () => {
    it('should return correct content type for PDF', () => {
      const result = service.getContentType('pdf');

      expect(result).toBe('application/pdf');
    });

    it('should return correct content type for DOCX', () => {
      const result = service.getContentType('docx');

      expect(result).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    });

    it('should return correct content type for HTML', () => {
      const result = service.getContentType('html');

      expect(result).toBe('text/html');
    });
  });
});

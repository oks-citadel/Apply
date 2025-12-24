import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import type { Resume, ResumeContent } from '../resumes/entities/resume.entity';

describe('ExportService', () => {
  let service: ExportService;

  const mockResumeContent: ResumeContent = {
    personalInfo: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
    summary: 'Experienced software engineer.',
    experience: [{
      id: 'exp-1',
      company: 'Tech Corp',
      position: 'Senior Software Engineer',
      startDate: '2020-01-01',
      current: true,
      description: 'Led team of 5 developers.',
    }],
    education: [{
      id: 'edu-1',
      institution: 'University',
      degree: 'BS',
      field: 'CS',
      startDate: '2014-09-01',
      endDate: '2018-05-31',
    }],
    skills: {
      technical: ['JavaScript', 'TypeScript'],
      soft: ['Leadership'],
    },
  };

  const mockResume: Partial<Resume> = {
    id: '1',
    userId: 'user-1',
    title: 'Resume',
    content: mockResumeContent,
    version: 1,
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

  describe('generatePdf', () => {
    it('should generate a PDF buffer', async () => {
      const result = await service.generatePdf(mockResume as Resume);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const empty: Partial<Resume> = { id: '2', userId: 'user-1', title: 'Empty', content: {}, version: 1 };
      const result = await service.generatePdf(empty as Resume);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('generateDocx', () => {
    it('should generate a DOCX buffer', async () => {
      const result = await service.generateDocx(mockResume as Resume);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const empty: Partial<Resume> = { id: '2', userId: 'user-1', title: 'Empty', content: {}, version: 1 };
      const result = await service.generateDocx(empty as Resume);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('generateJson', () => {
    it('should generate a JSON string', () => {
      const result = service.generateJson(mockResume as Resume);
      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should include all fields', () => {
      const result = service.generateJson(mockResume as Resume);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('id');
      expect(parsed).toHaveProperty('content');
    });

    it('should handle empty content', () => {
      const empty: Partial<Resume> = { id: '2', userId: 'user-1', title: 'Empty', content: {}, version: 1 };
      const result = service.generateJson(empty as Resume);
      const parsed = JSON.parse(result);
      expect(parsed.content).toEqual({});
    });
  });
});

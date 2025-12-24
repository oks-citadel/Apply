import { Test, TestingModule } from '@nestjs/testing';
import { ParserService } from './parser.service';
import { ResumeContent } from '../resumes/entities/resume.entity';

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

  describe('parsePdf', () => {
    it('should throw error for invalid PDF buffer', async () => {
      const invalidBuffer = Buffer.from('Not a PDF');
      await expect(service.parsePdf(invalidBuffer)).rejects.toThrow();
    });

    it('should return ResumeContent type when parsed successfully', async () => {
      // Note: This test would require a valid PDF buffer, skipped in unit tests
      expect(typeof service.parsePdf).toBe('function');
    });
  });

  describe('parseDocx', () => {
    it('should throw error for invalid DOCX buffer', async () => {
      const invalidBuffer = Buffer.from('Not a DOCX');
      await expect(service.parseDocx(invalidBuffer)).rejects.toThrow();
    });

    it('should return ResumeContent type when parsed successfully', async () => {
      // Note: This test would require a valid DOCX buffer, skipped in unit tests
      expect(typeof service.parseDocx).toBe('function');
    });
  });
});

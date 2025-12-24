import { Test, TestingModule } from '@nestjs/testing';
import { ResumesService } from './resumes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Resume } from './entities/resume.entity';
import { ResumeVersion } from './entities/resume-version.entity';
import { ParserService } from '../parser/parser.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

describe('ResumesService', () => {
  let service: ResumesService;
  let resumeRepository: any;

  const mockResume = { id: '1', userId: 'user-1', title: 'Resume', content: { personalInfo: { fullName: 'John' } }, isPrimary: false, version: 1, deletedAt: null };

  const mockResumeRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), findAndCount: jest.fn(), update: jest.fn() };
  const mockVersionRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumesService,
        { provide: getRepositoryToken(Resume), useValue: mockResumeRepo },
        { provide: getRepositoryToken(ResumeVersion), useValue: mockVersionRepo },
        { provide: ParserService, useValue: { parsePdf: jest.fn(), parseDocx: jest.fn() } },
        { provide: HttpService, useValue: { post: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('http://localhost') } },
      ],
    }).compile();
    service = module.get<ResumesService>(ResumesService);
    resumeRepository = module.get(getRepositoryToken(Resume));
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('create', () => {
    it('should create a new resume', async () => {
      mockResumeRepo.create.mockReturnValue(mockResume);
      mockResumeRepo.save.mockResolvedValue(mockResume);
      mockVersionRepo.create.mockReturnValue({});
      mockVersionRepo.save.mockResolvedValue({});
      const result = await service.create('user-1', { title: 'New' });
      expect(result).toEqual(mockResume);
    });
  });

  describe('findAll', () => {
    it('should return paginated resumes', async () => {
      mockResumeRepo.findAndCount.mockResolvedValue([[mockResume], 1]);
      const result = await service.findAll('user-1', 1, 10);
      expect(result.resumes).toEqual([mockResume]);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a resume', async () => {
      mockResumeRepo.findOne.mockResolvedValue(mockResume);
      const result = await service.findOne('1', 'user-1');
      expect(result).toEqual(mockResume);
    });
    it('should throw NotFoundException', async () => {
      mockResumeRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('999', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a resume', async () => {
      mockResumeRepo.findOne.mockResolvedValue(mockResume);
      mockResumeRepo.save.mockResolvedValue({ ...mockResume, title: 'Updated' });
      const result = await service.update('1', 'user-1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should soft delete a resume', async () => {
      mockResumeRepo.findOne.mockResolvedValue(mockResume);
      mockResumeRepo.save.mockResolvedValue({ ...mockResume, deletedAt: new Date() });
      await service.remove('1', 'user-1');
      expect(mockResumeRepo.save).toHaveBeenCalled();
    });
  });

  describe('setPrimary', () => {
    it('should set a resume as primary', async () => {
      mockResumeRepo.findOne.mockResolvedValue(mockResume);
      mockResumeRepo.update.mockResolvedValue({ affected: 1 });
      mockResumeRepo.save.mockResolvedValue({ ...mockResume, isPrimary: true });
      const result = await service.setPrimary('1', 'user-1');
      expect(result.isPrimary).toBe(true);
    });
  });

  describe('duplicate', () => {
    it('should duplicate a resume', async () => {
      const dup = { ...mockResume, id: '2', title: 'Resume (Copy)' };
      mockResumeRepo.findOne.mockResolvedValue(mockResume);
      mockResumeRepo.create.mockReturnValue(dup);
      mockResumeRepo.save.mockResolvedValue(dup);
      mockVersionRepo.create.mockReturnValue({});
      mockVersionRepo.save.mockResolvedValue({});
      const result = await service.duplicate('1', 'user-1');
      expect(result.title).toContain('(Copy)');
    });
  });

  describe('getVersions', () => {
    it('should return versions', async () => {
      mockResumeRepo.findOne.mockResolvedValue(mockResume);
      mockVersionRepo.find.mockResolvedValue([{ id: 'v1', version: 1 }]);
      const result = await service.getVersions('1', 'user-1');
      expect(result.length).toBe(1);
    });
  });

  describe('calculateAtsScore', () => {
    it('should calculate ATS,score', async () => {
      mockResumeRepo.findOne.mockResolvedValue(mockResume);
      mockResumeRepo.save.mockResolvedValue({ ...mockResume, atsScore: 50 });
      const result = await service.calculateAtsScore('1', 'user-1');
      expect(typeof result).toBe('number');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ResumesService } from './resumes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from './entities/resume.entity';
import { NotFoundException } from '@nestjs/common';

describe('ResumesService', () => {
  let service: ResumesService;
  let repository: jest.Mocked<Repository<Resume>>;

  const mockResume = {
    id: '1',
    userId: 'user-1',
    title: 'Software Engineer Resume',
    templateId: 'template-1',
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
    summary: 'Experienced software engineer',
    experience: [],
    education: [],
    skills: ['JavaScript', 'TypeScript', 'Node.js'],
    certifications: [],
    languages: [],
    projects: [],
    isPublic: false,
    isPrimary: false,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getManyAndCount: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumesService,
        {
          provide: getRepositoryToken(Resume),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ResumesService>(ResumesService);
    repository = module.get(getRepositoryToken(Resume));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new resume', async () => {
      const createDto = {
        userId: 'user-1',
        title: 'New Resume',
        templateId: 'template-1',
        personalInfo: mockResume.personalInfo,
      };

      repository.create.mockReturnValue(mockResume as any);
      repository.save.mockResolvedValue(mockResume as any);

      const result = await service.create(createDto);

      expect(result).toEqual(mockResume);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all resumes for a user', async () => {
      const userId = 'user-1';
      const mockResumes = [mockResume, { ...mockResume, id: '2' }];

      repository.find.mockResolvedValue(mockResumes as any);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockResumes);
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { updatedAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a resume by id', async () => {
      const id = '1';
      const userId = 'user-1';

      repository.findOne.mockResolvedValue(mockResume as any);

      const result = await service.findOne(id, userId);

      expect(result).toEqual(mockResume);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id, userId },
      });
    });

    it('should throw NotFoundException if resume not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a resume', async () => {
      const id = '1';
      const userId = 'user-1';
      const updateDto = { title: 'Updated Resume' };
      const updatedResume = { ...mockResume, ...updateDto };

      repository.findOne.mockResolvedValue(mockResume as any);
      repository.save.mockResolvedValue(updatedResume as any);

      const result = await service.update(id, userId, updateDto);

      expect(result).toEqual(updatedResume);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if resume not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('999', 'user-1', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a resume', async () => {
      const id = '1';
      const userId = 'user-1';

      repository.findOne.mockResolvedValue(mockResume as any);
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.delete(id, userId);

      expect(repository.delete).toHaveBeenCalledWith({ id, userId });
    });

    it('should throw NotFoundException if resume not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete('999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setPrimary', () => {
    it('should set a resume as primary', async () => {
      const id = '1';
      const userId = 'user-1';

      repository.findOne.mockResolvedValue(mockResume as any);
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.save.mockResolvedValue({ ...mockResume, isPrimary: true } as any);

      const result = await service.setPrimary(id, userId);

      expect(result.isPrimary).toBe(true);
      // Should unset other primary resumes first
      expect(repository.update).toHaveBeenCalledWith(
        { userId, isPrimary: true },
        { isPrimary: false },
      );
    });
  });

  describe('duplicate', () => {
    it('should duplicate a resume', async () => {
      const id = '1';
      const userId = 'user-1';
      const duplicatedResume = {
        ...mockResume,
        id: '2',
        title: 'Software Engineer Resume (Copy)',
      };

      repository.findOne.mockResolvedValue(mockResume as any);
      repository.create.mockReturnValue(duplicatedResume as any);
      repository.save.mockResolvedValue(duplicatedResume as any);

      const result = await service.duplicate(id, userId);

      expect(result.title).toContain('(Copy)');
      expect(result.id).not.toBe(mockResume.id);
    });
  });

  describe('count', () => {
    it('should return resume count for user', async () => {
      const userId = 'user-1';

      repository.count.mockResolvedValue(5);

      const result = await service.count(userId);

      expect(result).toBe(5);
      expect(repository.count).toHaveBeenCalledWith({ where: { userId } });
    });
  });
});

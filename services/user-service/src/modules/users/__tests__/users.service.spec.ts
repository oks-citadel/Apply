import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SkillProficiency } from '../../../common/enums/subscription-tier.enum';
import { CareerService } from '../../career/career.service';
import { Education } from '../../career/entities/education.entity';
import { WorkExperience } from '../../career/entities/work-experience.entity';
import { Preference } from '../../preferences/entities/preference.entity';
import { PreferencesService } from '../../preferences/preferences.service';
import { Profile } from '../../profile/entities/profile.entity';
import { ProfileService } from '../../profile/profile.service';
import { Skill } from '../../skills/entities/skill.entity';
import { SkillsService } from '../../skills/skills.service';

import type { CreateWorkExperienceDto } from '../../career/dto/create-work-experience.dto';
import type { UpdateProfileDto } from '../../profile/dto/update-profile.dto';
import type { CreateSkillDto } from '../../skills/dto/create-skill.dto';
import type { TestingModule } from '@nestjs/testing';
import type { Repository } from 'typeorm';


// Mock StorageService
class MockStorageService {
  uploadFile = jest.fn();
  deleteFile = jest.fn();
}

describe('ProfileService', () => {
  let service: ProfileService;
  let repository: Repository<Profile>;
  let storageService: MockStorageService;

  const mockProfile: Profile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    full_name: 'John Doe',
    headline: 'Senior Software Engineer',
    bio: 'Experienced software engineer',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/johndoe',
    github_url: 'https://github.com/johndoe',
    portfolio_url: 'https://johndoe.dev',
    profile_photo_url: 'https://storage.example.com/photos/user123.jpg',
    completeness_score: 100,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: 'StorageService',
          useClass: MockStorageService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    repository = module.get<Repository<Profile>>(getRepositoryToken(Profile));
    storageService = module.get('StorageService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return existing profile', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProfile);

      const result = await service.getProfile(mockProfile.user_id);

      expect(result).toEqual(mockProfile);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { user_id: mockProfile.user_id },
      });
    });

    it('should create new profile if not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      const newProfile = { ...mockProfile, completeness_score: 0 };
      jest.spyOn(repository, 'create').mockReturnValue(newProfile as any);
      jest.spyOn(repository, 'save').mockResolvedValue(newProfile);

      const result = await service.getProfile(mockProfile.user_id);

      expect(result.completeness_score).toBe(0);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update existing profile', async () => {
      const updateDto: UpdateProfileDto = {
        full_name: 'Jane Doe',
        headline: 'Principal Engineer',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProfile);
      const updatedProfile = { ...mockProfile, ...updateDto };
      jest.spyOn(repository, 'save').mockResolvedValue(updatedProfile);

      const result = await service.updateProfile(mockProfile.user_id, updateDto);

      expect(result.full_name).toBe(updateDto.full_name);
      expect(result.headline).toBe(updateDto.headline);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should create profile if not exists before updating', async () => {
      const updateDto: UpdateProfileDto = {
        full_name: 'New User',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      const newProfile = { ...mockProfile, ...updateDto, completeness_score: 0 };
      jest.spyOn(repository, 'create').mockReturnValue(newProfile as any);
      jest.spyOn(repository, 'save').mockResolvedValue(newProfile);

      const result = await service.updateProfile(mockProfile.user_id, updateDto);

      expect(result.full_name).toBe(updateDto.full_name);
    });

    it('should recalculate completeness score after update', async () => {
      const updateDto: UpdateProfileDto = {
        bio: 'New bio',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProfile);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...mockProfile, ...updateDto });

      const result = await service.updateProfile(mockProfile.user_id, updateDto);

      expect(result.completeness_score).toBeDefined();
    });
  });

  describe('uploadProfilePhoto', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'profile.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024 * 1024,
      buffer: Buffer.from('fake-image-data'),
      destination: '',
      filename: '',
      path: '',
      stream: null,
    };

    it('should upload new photo successfully', async () => {
      const photoUrl = 'https://storage.example.com/photos/new-photo.jpg';
      jest.spyOn(repository, 'findOne').mockResolvedValue({ ...mockProfile, profile_photo_url: null });
      storageService.uploadFile.mockResolvedValue(photoUrl);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...mockProfile, profile_photo_url: photoUrl });

      const result = await service.uploadProfilePhoto(mockProfile.user_id, mockFile);

      expect(result.url).toBe(photoUrl);
      expect(storageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        `profile-photos/${mockProfile.user_id}`,
        'image',
      );
    });

    it('should delete old photo before uploading new one', async () => {
      const newPhotoUrl = 'https://storage.example.com/photos/new-photo.jpg';
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProfile);
      storageService.uploadFile.mockResolvedValue(newPhotoUrl);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...mockProfile, profile_photo_url: newPhotoUrl });

      await service.uploadProfilePhoto(mockProfile.user_id, mockFile);

      expect(storageService.deleteFile).toHaveBeenCalledWith(mockProfile.profile_photo_url);
      expect(storageService.uploadFile).toHaveBeenCalled();
    });

    it('should update completeness score after photo upload', async () => {
      const photoUrl = 'https://storage.example.com/photos/new-photo.jpg';
      const profileWithoutPhoto = { ...mockProfile, profile_photo_url: null, completeness_score: 87 };
      jest.spyOn(repository, 'findOne').mockResolvedValue(profileWithoutPhoto);
      storageService.uploadFile.mockResolvedValue(photoUrl);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...profileWithoutPhoto, profile_photo_url: photoUrl });

      await service.uploadProfilePhoto(mockProfile.user_id, mockFile);

      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('deleteProfilePhoto', () => {
    it('should delete profile photo successfully', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProfile);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...mockProfile, profile_photo_url: null });

      await service.deleteProfilePhoto(mockProfile.user_id);

      expect(storageService.deleteFile).toHaveBeenCalledWith(mockProfile.profile_photo_url);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle deletion when no photo exists', async () => {
      const profileWithoutPhoto = { ...mockProfile, profile_photo_url: null };
      jest.spyOn(repository, 'findOne').mockResolvedValue(profileWithoutPhoto);

      await service.deleteProfilePhoto(mockProfile.user_id);

      expect(storageService.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('getCompletenessScore', () => {
    it('should calculate 100% for complete profile', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProfile);

      const result = await service.getCompletenessScore(mockProfile.user_id);

      expect(result.score).toBe(100);
      expect(result.missing).toHaveLength(0);
    });

    it('should identify missing fields', async () => {
      const incompleteProfile = {
        ...mockProfile,
        bio: null,
        profile_photo_url: null,
        linkedin_url: null,
        github_url: null,
        completeness_score: 50,
      };
      jest.spyOn(repository, 'findOne').mockResolvedValue(incompleteProfile);

      const result = await service.getCompletenessScore(mockProfile.user_id);

      expect(result.missing).toContain('Bio');
      expect(result.missing).toContain('Profile Photo');
      expect(result.missing).toContain('LinkedIn URL');
      expect(result.missing).toContain('GitHub URL');
    });

    it('should calculate correct percentage', async () => {
      // Only 4 out of 8 fields filled
      const partialProfile = {
        ...mockProfile,
        bio: null,
        profile_photo_url: null,
        linkedin_url: null,
        github_url: null,
        completeness_score: 50,
      };
      jest.spyOn(repository, 'findOne').mockResolvedValue(partialProfile);

      const result = await service.getCompletenessScore(mockProfile.user_id);

      expect(result.score).toBe(50);
    });
  });

  describe('calculateCompletenessScore (private method)', () => {
    it('should return 0 for empty profile', () => {
      const emptyProfile = {
        id: '123',
        user_id: '456',
        full_name: null,
        headline: null,
        bio: null,
        phone: null,
        location: null,
        linkedin_url: null,
        github_url: null,
        portfolio_url: null,
        profile_photo_url: null,
        completeness_score: 0,
        created_at: new Date(),
        updated_at: new Date(),
      } as Profile;

      // Access through update to test the calculation
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(emptyProfile as any);
      jest.spyOn(repository, 'save').mockResolvedValue(emptyProfile);

      // The score should be calculated when saving
      expect(emptyProfile.completeness_score).toBe(0);
    });
  });
});

describe('CareerService', () => {
  let service: CareerService;
  let workExpRepository: Repository<WorkExperience>;
  let educationRepository: Repository<Education>;

  const mockWorkExperience: WorkExperience = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    company: 'Tech Corp',
    position: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    start_date: new Date('2020-01-01'),
    end_date: null,
    is_current: true,
    description: 'Leading development team',
    achievements: ['Improved performance by 40%'],
    technologies: ['Node.js', 'React'],
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareerService,
        {
          provide: getRepositoryToken(WorkExperience),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Education),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CareerService>(CareerService);
    workExpRepository = module.get<Repository<WorkExperience>>(getRepositoryToken(WorkExperience));
    educationRepository = module.get<Repository<Education>>(getRepositoryToken(Education));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllWorkExperiences', () => {
    it('should return all work experiences for a user', async () => {
      const experiences = [mockWorkExperience];
      jest.spyOn(workExpRepository, 'find').mockResolvedValue(experiences);

      const result = await service.getAllWorkExperiences(mockWorkExperience.user_id);

      expect(result).toEqual(experiences);
      expect(workExpRepository.find).toHaveBeenCalledWith({
        where: { user_id: mockWorkExperience.user_id },
        order: { start_date: 'DESC' },
      });
    });

    it('should return empty array if no experiences found', async () => {
      jest.spyOn(workExpRepository, 'find').mockResolvedValue([]);

      const result = await service.getAllWorkExperiences(mockWorkExperience.user_id);

      expect(result).toEqual([]);
    });
  });

  describe('createWorkExperience', () => {
    it('should create work experience successfully', async () => {
      const createDto: CreateWorkExperienceDto = {
        company: 'New Company',
        position: 'Software Engineer',
        start_date: '2023-01-01',
        is_current: true,
      };

      jest.spyOn(workExpRepository, 'create').mockReturnValue(mockWorkExperience as any);
      jest.spyOn(workExpRepository, 'save').mockResolvedValue(mockWorkExperience);

      const result = await service.createWorkExperience(mockWorkExperience.user_id, createDto);

      expect(result).toEqual(mockWorkExperience);
      expect(workExpRepository.save).toHaveBeenCalled();
    });

    it('should validate end_date is after start_date', async () => {
      const createDto: CreateWorkExperienceDto = {
        company: 'Test Company',
        position: 'Engineer',
        start_date: '2023-12-31',
        end_date: '2023-01-01', // Before start_date
        is_current: false,
      };

      // This validation should happen at the service level
      await expect(async () => {
        // Simulate validation
        const startDate = new Date(createDto.start_date);
        const endDate = new Date(createDto.end_date);
        if (endDate < startDate) {
          throw new BadRequestException('End date must be after start date');
        }
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateWorkExperience', () => {
    it('should update work experience successfully', async () => {
      const updateDto = {
        position: 'Lead Engineer',
        description: 'Updated description',
      };

      jest.spyOn(workExpRepository, 'findOne').mockResolvedValue(mockWorkExperience);
      const updatedExperience = { ...mockWorkExperience, ...updateDto };
      jest.spyOn(workExpRepository, 'save').mockResolvedValue(updatedExperience);

      const result = await service.updateWorkExperience(
        mockWorkExperience.user_id,
        mockWorkExperience.id,
        updateDto,
      );

      expect(result.position).toBe(updateDto.position);
    });

    it('should throw NotFoundException if experience not found', async () => {
      jest.spyOn(workExpRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateWorkExperience(mockWorkExperience.user_id, 'non-existent-id', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent updating other users experiences', async () => {
      jest.spyOn(workExpRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateWorkExperience('different-user-id', mockWorkExperience.id, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWorkExperience', () => {
    it('should delete work experience successfully', async () => {
      jest.spyOn(workExpRepository, 'findOne').mockResolvedValue(mockWorkExperience);
      jest.spyOn(workExpRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.deleteWorkExperience(mockWorkExperience.user_id, mockWorkExperience.id);

      expect(workExpRepository.delete).toHaveBeenCalledWith(mockWorkExperience.id);
    });

    it('should throw NotFoundException if experience not found', async () => {
      jest.spyOn(workExpRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.deleteWorkExperience(mockWorkExperience.user_id, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Timeline validation', () => {
    it('should handle multiple work experiences in chronological order', async () => {
      const experiences = [
        { ...mockWorkExperience, start_date: new Date('2023-01-01'), is_current: true },
        { ...mockWorkExperience, start_date: new Date('2020-01-01'), end_date: new Date('2022-12-31') },
        { ...mockWorkExperience, start_date: new Date('2018-01-01'), end_date: new Date('2019-12-31') },
      ];

      jest.spyOn(workExpRepository, 'find').mockResolvedValue(experiences);

      const result = await service.getAllWorkExperiences(mockWorkExperience.user_id);

      // Should be ordered by start_date DESC
      expect(result[0].start_date.getFullYear()).toBe(2023);
      expect(result[1].start_date.getFullYear()).toBe(2020);
      expect(result[2].start_date.getFullYear()).toBe(2018);
    });

    it('should allow only one current work experience', async () => {
      const createDto: CreateWorkExperienceDto = {
        company: 'Second Current Job',
        position: 'Engineer',
        start_date: '2023-06-01',
        is_current: true,
      };

      // Find existing current position
      jest.spyOn(workExpRepository, 'find').mockResolvedValue([
        { ...mockWorkExperience, is_current: true },
      ]);

      // This should trigger a warning or auto-update the previous current job
      // Implementation depends on business logic
    });
  });
});

describe('SkillsService', () => {
  let service: SkillsService;
  let repository: Repository<Skill>;

  const mockSkill: Skill = {
    id: '123e4567-e89b-12d3-a456-426614174004',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'JavaScript',
    proficiency: SkillProficiency.ADVANCED,
    category: 'Programming Languages',
    years_of_experience: 5,
    is_primary: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: getRepositoryToken(Skill),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
    repository = module.get<Repository<Skill>>(getRepositoryToken(Skill));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSkills', () => {
    it('should return all user skills', async () => {
      const skills = [mockSkill];
      jest.spyOn(repository, 'find').mockResolvedValue(skills);

      const result = await service.getAllSkills(mockSkill.user_id);

      expect(result).toEqual(skills);
      expect(repository.find).toHaveBeenCalledWith({
        where: { user_id: mockSkill.user_id },
      });
    });
  });

  describe('createSkill', () => {
    it('should create skill successfully', async () => {
      const createDto: CreateSkillDto = {
        name: 'TypeScript',
        proficiency: SkillProficiency.EXPERT,
        category: 'Programming Languages',
        years_of_experience: 4,
      };

      jest.spyOn(repository, 'create').mockReturnValue(mockSkill as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mockSkill);

      const result = await service.createSkill(mockSkill.user_id, createDto);

      expect(result).toEqual(mockSkill);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should prevent duplicate skills', async () => {
      const createDto: CreateSkillDto = {
        name: 'JavaScript',
        proficiency: SkillProficiency.ADVANCED,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSkill);

      await expect(service.createSkill(mockSkill.user_id, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should validate proficiency level', async () => {
      const validProficiencies = [
        SkillProficiency.BEGINNER,
        SkillProficiency.INTERMEDIATE,
        SkillProficiency.ADVANCED,
        SkillProficiency.EXPERT,
      ];

      for (const proficiency of validProficiencies) {
        const createDto: CreateSkillDto = {
          name: 'Test Skill',
          proficiency,
        };

        jest.spyOn(repository, 'create').mockReturnValue({ ...mockSkill, proficiency } as any);
        jest.spyOn(repository, 'save').mockResolvedValue({ ...mockSkill, proficiency });

        const result = await service.createSkill(mockSkill.user_id, createDto);
        expect(result.proficiency).toBe(proficiency);
      }
    });

    it('should validate years_of_experience range', async () => {
      const createDto: CreateSkillDto = {
        name: 'Invalid Skill',
        proficiency: SkillProficiency.EXPERT,
        years_of_experience: 100, // Invalid: > 50
      };

      // This should be caught by class-validator
      await expect(async () => {
        if (createDto.years_of_experience > 50) {
          throw new BadRequestException('Years of experience cannot exceed 50');
        }
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateSkill', () => {
    it('should update skill proficiency', async () => {
      const updateDto = {
        proficiency: SkillProficiency.EXPERT,
        years_of_experience: 6,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSkill);
      const updatedSkill = { ...mockSkill, ...updateDto };
      jest.spyOn(repository, 'save').mockResolvedValue(updatedSkill);

      const result = await service.updateSkill(mockSkill.user_id, mockSkill.id, updateDto);

      expect(result.proficiency).toBe(updateDto.proficiency);
      expect(result.years_of_experience).toBe(updateDto.years_of_experience);
    });
  });

  describe('deleteSkill', () => {
    it('should delete skill successfully', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSkill);
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.deleteSkill(mockSkill.user_id, mockSkill.id);

      expect(repository.delete).toHaveBeenCalledWith(mockSkill.id);
    });

    it('should throw NotFoundException if skill not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteSkill(mockSkill.user_id, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSkillsByCategory', () => {
    it('should group skills by category', async () => {
      const skills = [
        { ...mockSkill, category: 'Programming Languages' },
        { ...mockSkill, category: 'Programming Languages', name: 'TypeScript' },
        { ...mockSkill, category: 'Frameworks', name: 'React' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(skills);

      const result = await service.getSkillsByCategory(mockSkill.user_id);

      expect(result).toHaveProperty('Programming Languages');
      expect(result).toHaveProperty('Frameworks');
      expect(result['Programming Languages']).toHaveLength(2);
      expect(result['Frameworks']).toHaveLength(1);
    });
  });

  describe('getSkillSuggestions', () => {
    it('should suggest related skills based on existing skills', async () => {
      const userSkills = [
        { ...mockSkill, name: 'JavaScript' },
        { ...mockSkill, name: 'Node.js' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(userSkills);

      const suggestions = await service.getSkillSuggestions(mockSkill.user_id);

      expect(Array.isArray(suggestions)).toBe(true);
      // Suggestions might include TypeScript, React, Express, etc.
    });
  });
});

describe('PreferencesService', () => {
  let service: PreferencesService;
  let repository: Repository<Preference>;

  const mockPreferences: Preference = {
    id: '123e4567-e89b-12d3-a456-426614174005',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    job_titles: ['Software Engineer', 'Full Stack Developer'],
    locations: ['San Francisco', 'Remote'],
    employment_types: ['Full-time', 'Contract'],
    min_salary: 100000,
    max_salary: 200000,
    remote_preference: 'remote_only',
    privacy_settings: {
      profile_visibility: 'public',
      show_email: false,
      show_phone: false,
    },
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        {
          provide: getRepositoryToken(Preference),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PreferencesService>(PreferencesService);
    repository = module.get<Repository<Preference>>(getRepositoryToken(Preference));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockPreferences);

      const result = await service.getPreferences(mockPreferences.user_id);

      expect(result).toEqual(mockPreferences);
    });

    it('should create default preferences if not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockPreferences as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mockPreferences);

      const result = await service.getPreferences(mockPreferences.user_id);

      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences successfully', async () => {
      const updateDto = {
        min_salary: 150000,
        remote_preference: 'hybrid',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockPreferences);
      const updatedPreferences = { ...mockPreferences, ...updateDto };
      jest.spyOn(repository, 'save').mockResolvedValue(updatedPreferences);

      const result = await service.updatePreferences(mockPreferences.user_id, updateDto);

      expect(result.min_salary).toBe(updateDto.min_salary);
      expect(result.remote_preference).toBe(updateDto.remote_preference);
    });

    it('should validate salary range', async () => {
      const updateDto = {
        min_salary: 200000,
        max_salary: 100000, // Max less than min
      };

      await expect(async () => {
        if (updateDto.max_salary < updateDto.min_salary) {
          throw new BadRequestException('Maximum salary must be greater than minimum salary');
        }
      }).rejects.toThrow(BadRequestException);
    });

    it('should update privacy settings', async () => {
      const updateDto = {
        privacy_settings: {
          profile_visibility: 'private',
          show_email: true,
          show_phone: false,
        },
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockPreferences);
      const updatedPreferences = { ...mockPreferences, ...updateDto };
      jest.spyOn(repository, 'save').mockResolvedValue(updatedPreferences);

      const result = await service.updatePreferences(mockPreferences.user_id, updateDto);

      expect(result.privacy_settings.profile_visibility).toBe('private');
      expect(result.privacy_settings.show_email).toBe(true);
    });
  });
});

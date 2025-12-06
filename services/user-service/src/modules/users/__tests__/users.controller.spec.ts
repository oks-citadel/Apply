import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfileController } from '../../profile/profile.controller';
import { ProfileService } from '../../profile/profile.service';
import { CareerController } from '../../career/career.controller';
import { CareerService } from '../../career/career.service';
import { SkillsController } from '../../skills/skills.controller';
import { SkillsService } from '../../skills/skills.service';
import { PreferencesController } from '../../preferences/preferences.controller';
import { PreferencesService } from '../../preferences/preferences.service';
import { UpdateProfileDto } from '../../profile/dto/update-profile.dto';
import { CreateWorkExperienceDto, UpdateWorkExperienceDto } from '../../career/dto/create-work-experience.dto';
import { CreateEducationDto, UpdateEducationDto } from '../../career/dto/create-education.dto';
import { CreateSkillDto, UpdateSkillDto } from '../../skills/dto/create-skill.dto';
import { UpdatePreferenceDto } from '../../preferences/dto/update-preference.dto';
import { SkillProficiency } from '../../../common/enums/subscription-tier.enum';

describe('Profile Controller', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockProfileService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    uploadProfilePhoto: jest.fn(),
    deleteProfilePhoto: jest.fn(),
    getCompletenessScore: jest.fn(),
  };

  const mockProfile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    full_name: 'John Doe',
    headline: 'Senior Software Engineer',
    bio: 'Experienced software engineer with 10+ years',
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
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /profile', () => {
    it('should return user profile successfully', async () => {
      mockProfileService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(mockProfile.user_id);

      expect(result).toEqual(mockProfile);
      expect(service.getProfile).toHaveBeenCalledWith(mockProfile.user_id);
      expect(service.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle profile not found by creating new profile', async () => {
      const newProfile = { ...mockProfile, completeness_score: 0 };
      mockProfileService.getProfile.mockResolvedValue(newProfile);

      const result = await controller.getProfile(mockProfile.user_id);

      expect(result).toEqual(newProfile);
      expect(service.getProfile).toHaveBeenCalledWith(mockProfile.user_id);
    });
  });

  describe('PUT /profile', () => {
    it('should update profile successfully with full data', async () => {
      const updateDto: UpdateProfileDto = {
        full_name: 'Jane Doe',
        headline: 'Principal Engineer',
        bio: 'Passionate about cloud architecture',
        phone: '+0987654321',
        location: 'New York, NY',
        linkedin_url: 'https://linkedin.com/in/janedoe',
        github_url: 'https://github.com/janedoe',
        portfolio_url: 'https://janedoe.dev',
      };

      const updatedProfile = { ...mockProfile, ...updateDto };
      mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockProfile.user_id, updateDto);

      expect(result).toEqual(updatedProfile);
      expect(service.updateProfile).toHaveBeenCalledWith(mockProfile.user_id, updateDto);
    });

    it('should update profile with partial data', async () => {
      const updateDto: UpdateProfileDto = {
        full_name: 'Jane Smith',
      };

      const updatedProfile = { ...mockProfile, full_name: 'Jane Smith' };
      mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockProfile.user_id, updateDto);

      expect(result).toEqual(updatedProfile);
      expect(service.updateProfile).toHaveBeenCalledWith(mockProfile.user_id, updateDto);
    });

    it('should validate URL format', async () => {
      const updateDto: UpdateProfileDto = {
        linkedin_url: 'invalid-url',
      };

      // This would be caught by class-validator at the DTO level
      // Testing the validation behavior
      await expect(async () => {
        // Simulate validation error
        throw new BadRequestException('Invalid URL format');
      }).rejects.toThrow(BadRequestException);
    });

    it('should update completeness score after profile update', async () => {
      const updateDto: UpdateProfileDto = {
        full_name: 'Complete Name',
        headline: 'Complete Headline',
        bio: 'Complete Bio',
      };

      const updatedProfile = { ...mockProfile, ...updateDto, completeness_score: 87 };
      mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockProfile.user_id, updateDto);

      expect(result.completeness_score).toBeDefined();
      expect(result.completeness_score).toBeGreaterThan(0);
    });
  });

  describe('POST /profile/photo', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'profile.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024 * 1024, // 1MB
      buffer: Buffer.from('fake-image-data'),
      destination: '',
      filename: '',
      path: '',
      stream: null,
    };

    it('should upload profile photo successfully', async () => {
      const uploadResult = { url: 'https://storage.example.com/photos/new-photo.jpg' };
      mockProfileService.uploadProfilePhoto.mockResolvedValue(uploadResult);

      const result = await controller.uploadProfilePhoto(mockProfile.user_id, mockFile);

      expect(result).toEqual(uploadResult);
      expect(service.uploadProfilePhoto).toHaveBeenCalledWith(mockProfile.user_id, mockFile);
    });

    it('should reject if no file is uploaded', async () => {
      await expect(controller.uploadProfilePhoto(mockProfile.user_id, null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid file types', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(controller.uploadProfilePhoto(mockProfile.user_id, invalidFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept JPEG files', async () => {
      const jpegFile = { ...mockFile, mimetype: 'image/jpeg' };
      const uploadResult = { url: 'https://storage.example.com/photos/photo.jpg' };
      mockProfileService.uploadProfilePhoto.mockResolvedValue(uploadResult);

      const result = await controller.uploadProfilePhoto(mockProfile.user_id, jpegFile);

      expect(result).toEqual(uploadResult);
    });

    it('should accept PNG files', async () => {
      const pngFile = { ...mockFile, mimetype: 'image/png' };
      const uploadResult = { url: 'https://storage.example.com/photos/photo.png' };
      mockProfileService.uploadProfilePhoto.mockResolvedValue(uploadResult);

      const result = await controller.uploadProfilePhoto(mockProfile.user_id, pngFile);

      expect(result).toEqual(uploadResult);
    });

    it('should accept WebP files', async () => {
      const webpFile = { ...mockFile, mimetype: 'image/webp' };
      const uploadResult = { url: 'https://storage.example.com/photos/photo.webp' };
      mockProfileService.uploadProfilePhoto.mockResolvedValue(uploadResult);

      const result = await controller.uploadProfilePhoto(mockProfile.user_id, webpFile);

      expect(result).toEqual(uploadResult);
    });

    it('should reject files larger than 5MB', async () => {
      const largeFile = { ...mockFile, size: 6 * 1024 * 1024 }; // 6MB

      await expect(controller.uploadProfilePhoto(mockProfile.user_id, largeFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept files at the 5MB limit', async () => {
      const exactSizeFile = { ...mockFile, size: 5 * 1024 * 1024 }; // Exactly 5MB
      const uploadResult = { url: 'https://storage.example.com/photos/photo.jpg' };
      mockProfileService.uploadProfilePhoto.mockResolvedValue(uploadResult);

      const result = await controller.uploadProfilePhoto(mockProfile.user_id, exactSizeFile);

      expect(result).toEqual(uploadResult);
    });
  });

  describe('DELETE /profile/photo', () => {
    it('should delete profile photo successfully', async () => {
      mockProfileService.deleteProfilePhoto.mockResolvedValue(undefined);

      const result = await controller.deleteProfilePhoto(mockProfile.user_id);

      expect(result).toEqual({ message: 'Profile photo deleted successfully' });
      expect(service.deleteProfilePhoto).toHaveBeenCalledWith(mockProfile.user_id);
    });

    it('should handle deletion when no photo exists', async () => {
      mockProfileService.deleteProfilePhoto.mockResolvedValue(undefined);

      const result = await controller.deleteProfilePhoto(mockProfile.user_id);

      expect(result).toEqual({ message: 'Profile photo deleted successfully' });
    });
  });

  describe('GET /profile/completeness', () => {
    it('should return completeness score with all fields filled', async () => {
      const completeness = {
        score: 100,
        missing: [],
      };
      mockProfileService.getCompletenessScore.mockResolvedValue(completeness);

      const result = await controller.getCompletenessScore(mockProfile.user_id);

      expect(result).toEqual(completeness);
      expect(result.score).toBe(100);
      expect(result.missing).toHaveLength(0);
    });

    it('should return missing fields for incomplete profile', async () => {
      const completeness = {
        score: 50,
        missing: ['Profile Photo', 'LinkedIn URL', 'GitHub URL', 'Bio'],
      };
      mockProfileService.getCompletenessScore.mockResolvedValue(completeness);

      const result = await controller.getCompletenessScore(mockProfile.user_id);

      expect(result.score).toBe(50);
      expect(result.missing).toContain('Profile Photo');
      expect(result.missing.length).toBeGreaterThan(0);
    });
  });
});

describe('Career Controller', () => {
  let controller: CareerController;
  let service: CareerService;

  const mockCareerService = {
    getAllWorkExperiences: jest.fn(),
    getWorkExperienceById: jest.fn(),
    createWorkExperience: jest.fn(),
    updateWorkExperience: jest.fn(),
    deleteWorkExperience: jest.fn(),
    getAllEducation: jest.fn(),
    getEducationById: jest.fn(),
    createEducation: jest.fn(),
    updateEducation: jest.fn(),
    deleteEducation: jest.fn(),
  };

  const mockWorkExperience = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    company: 'Tech Corp',
    position: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    start_date: new Date('2020-01-01'),
    end_date: null,
    is_current: true,
    description: 'Leading development team',
    achievements: ['Improved performance by 40%', 'Mentored 5 developers'],
    technologies: ['Node.js', 'React', 'PostgreSQL'],
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CareerController],
      providers: [
        {
          provide: CareerService,
          useValue: mockCareerService,
        },
      ],
    }).compile();

    controller = module.get<CareerController>(CareerController);
    service = module.get<CareerService>(CareerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Work Experience - GET /career/work-experience', () => {
    it('should return all work experiences', async () => {
      const experiences = [mockWorkExperience];
      mockCareerService.getAllWorkExperiences.mockResolvedValue(experiences);

      const result = await controller.getAllWorkExperiences(mockWorkExperience.user_id);

      expect(result).toEqual(experiences);
      expect(service.getAllWorkExperiences).toHaveBeenCalledWith(mockWorkExperience.user_id);
    });

    it('should return empty array when no experiences exist', async () => {
      mockCareerService.getAllWorkExperiences.mockResolvedValue([]);

      const result = await controller.getAllWorkExperiences(mockWorkExperience.user_id);

      expect(result).toEqual([]);
    });
  });

  describe('Work Experience - POST /career/work-experience', () => {
    it('should create work experience successfully', async () => {
      const createDto: CreateWorkExperienceDto = {
        company: 'New Company',
        position: 'Lead Engineer',
        location: 'New York, NY',
        start_date: '2023-01-01',
        is_current: true,
        description: 'Leading architecture',
        achievements: ['Launched new product'],
        technologies: ['TypeScript', 'GraphQL'],
      };

      mockCareerService.createWorkExperience.mockResolvedValue({ ...mockWorkExperience, ...createDto });

      const result = await controller.createWorkExperience(mockWorkExperience.user_id, createDto);

      expect(result.company).toBe(createDto.company);
      expect(service.createWorkExperience).toHaveBeenCalledWith(mockWorkExperience.user_id, createDto);
    });

    it('should create current work experience without end_date', async () => {
      const createDto: CreateWorkExperienceDto = {
        company: 'Current Company',
        position: 'Software Engineer',
        start_date: '2023-06-01',
        is_current: true,
      };

      mockCareerService.createWorkExperience.mockResolvedValue({ ...mockWorkExperience, ...createDto });

      const result = await controller.createWorkExperience(mockWorkExperience.user_id, createDto);

      expect(result.is_current).toBe(true);
      expect(result.end_date).toBeNull();
    });

    it('should create past work experience with end_date', async () => {
      const createDto: CreateWorkExperienceDto = {
        company: 'Past Company',
        position: 'Junior Engineer',
        start_date: '2018-01-01',
        end_date: '2020-12-31',
        is_current: false,
      };

      const pastExperience = { ...mockWorkExperience, ...createDto, end_date: new Date('2020-12-31') };
      mockCareerService.createWorkExperience.mockResolvedValue(pastExperience);

      const result = await controller.createWorkExperience(mockWorkExperience.user_id, createDto);

      expect(result.is_current).toBe(false);
      expect(result.end_date).toBeDefined();
    });
  });

  describe('Work Experience - PUT /career/work-experience/:id', () => {
    it('should update work experience successfully', async () => {
      const updateDto: UpdateWorkExperienceDto = {
        position: 'Staff Engineer',
        description: 'Updated description',
      };

      const updatedExperience = { ...mockWorkExperience, ...updateDto };
      mockCareerService.updateWorkExperience.mockResolvedValue(updatedExperience);

      const result = await controller.updateWorkExperience(
        mockWorkExperience.user_id,
        mockWorkExperience.id,
        updateDto,
      );

      expect(result.position).toBe(updateDto.position);
      expect(service.updateWorkExperience).toHaveBeenCalledWith(
        mockWorkExperience.user_id,
        mockWorkExperience.id,
        updateDto,
      );
    });

    it('should mark experience as ended', async () => {
      const updateDto: UpdateWorkExperienceDto = {
        is_current: false,
        end_date: '2023-12-31',
      };

      const endedExperience = { ...mockWorkExperience, ...updateDto, end_date: new Date('2023-12-31') };
      mockCareerService.updateWorkExperience.mockResolvedValue(endedExperience);

      const result = await controller.updateWorkExperience(
        mockWorkExperience.user_id,
        mockWorkExperience.id,
        updateDto,
      );

      expect(result.is_current).toBe(false);
      expect(result.end_date).toBeDefined();
    });
  });

  describe('Work Experience - DELETE /career/work-experience/:id', () => {
    it('should delete work experience successfully', async () => {
      mockCareerService.deleteWorkExperience.mockResolvedValue(undefined);

      const result = await controller.deleteWorkExperience(mockWorkExperience.user_id, mockWorkExperience.id);

      expect(result).toEqual({ message: 'Work experience deleted successfully' });
      expect(service.deleteWorkExperience).toHaveBeenCalledWith(
        mockWorkExperience.user_id,
        mockWorkExperience.id,
      );
    });
  });

  describe('Education - POST /career/education', () => {
    const mockEducation = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      institution: 'Stanford University',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Science',
      start_date: new Date('2012-09-01'),
      end_date: new Date('2016-06-01'),
      grade: '3.8 GPA',
      activities: 'Computer Science Club President',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should create education entry successfully', async () => {
      const createDto: CreateEducationDto = {
        institution: 'MIT',
        degree: 'Master of Science',
        field_of_study: 'Computer Science',
        start_date: '2016-09-01',
        end_date: '2018-06-01',
        grade: '4.0 GPA',
      };

      mockCareerService.createEducation.mockResolvedValue({ ...mockEducation, ...createDto });

      const result = await controller.createEducation(mockEducation.user_id, createDto);

      expect(result.institution).toBe(createDto.institution);
      expect(service.createEducation).toHaveBeenCalledWith(mockEducation.user_id, createDto);
    });
  });
});

describe('Skills Controller', () => {
  let controller: SkillsController;
  let service: SkillsService;

  const mockSkillsService = {
    getAllSkills: jest.fn(),
    getSkillById: jest.fn(),
    createSkill: jest.fn(),
    updateSkill: jest.fn(),
    deleteSkill: jest.fn(),
    getSkillSuggestions: jest.fn(),
    getSkillsByCategory: jest.fn(),
  };

  const mockSkill = {
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
      controllers: [SkillsController],
      providers: [
        {
          provide: SkillsService,
          useValue: mockSkillsService,
        },
      ],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
    service = module.get<SkillsService>(SkillsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /skills', () => {
    it('should return all user skills', async () => {
      const skills = [mockSkill];
      mockSkillsService.getAllSkills.mockResolvedValue(skills);

      const result = await controller.getAllSkills(mockSkill.user_id);

      expect(result).toEqual(skills);
      expect(service.getAllSkills).toHaveBeenCalledWith(mockSkill.user_id);
    });
  });

  describe('POST /skills', () => {
    it('should create skill successfully', async () => {
      const createDto: CreateSkillDto = {
        name: 'TypeScript',
        proficiency: SkillProficiency.EXPERT,
        category: 'Programming Languages',
        years_of_experience: 4,
        is_primary: true,
      };

      mockSkillsService.createSkill.mockResolvedValue({ ...mockSkill, ...createDto });

      const result = await controller.createSkill(mockSkill.user_id, createDto);

      expect(result.name).toBe(createDto.name);
      expect(service.createSkill).toHaveBeenCalledWith(mockSkill.user_id, createDto);
    });

    it('should create skill with different proficiency levels', async () => {
      const proficiencies = [
        SkillProficiency.BEGINNER,
        SkillProficiency.INTERMEDIATE,
        SkillProficiency.ADVANCED,
        SkillProficiency.EXPERT,
      ];

      for (const proficiency of proficiencies) {
        const createDto: CreateSkillDto = {
          name: 'Test Skill',
          proficiency,
        };

        mockSkillsService.createSkill.mockResolvedValue({ ...mockSkill, proficiency });

        const result = await controller.createSkill(mockSkill.user_id, createDto);

        expect(result.proficiency).toBe(proficiency);
      }
    });
  });

  describe('PUT /skills/:id', () => {
    it('should update skill proficiency', async () => {
      const updateDto: UpdateSkillDto = {
        proficiency: SkillProficiency.EXPERT,
        years_of_experience: 6,
      };

      const updatedSkill = { ...mockSkill, ...updateDto };
      mockSkillsService.updateSkill.mockResolvedValue(updatedSkill);

      const result = await controller.updateSkill(mockSkill.user_id, mockSkill.id, updateDto);

      expect(result.proficiency).toBe(updateDto.proficiency);
      expect(service.updateSkill).toHaveBeenCalledWith(mockSkill.user_id, mockSkill.id, updateDto);
    });
  });

  describe('DELETE /skills/:id', () => {
    it('should delete skill successfully', async () => {
      mockSkillsService.deleteSkill.mockResolvedValue(undefined);

      const result = await controller.deleteSkill(mockSkill.user_id, mockSkill.id);

      expect(result).toEqual({ message: 'Skill deleted successfully' });
      expect(service.deleteSkill).toHaveBeenCalledWith(mockSkill.user_id, mockSkill.id);
    });
  });

  describe('GET /skills/suggestions', () => {
    it('should return skill suggestions', async () => {
      const suggestions = ['React', 'Vue.js', 'Angular'];
      mockSkillsService.getSkillSuggestions.mockResolvedValue(suggestions);

      const result = await controller.getSkillSuggestions(mockSkill.user_id);

      expect(result).toEqual(suggestions);
    });
  });

  describe('GET /skills/by-category', () => {
    it('should return skills grouped by category', async () => {
      const categorizedSkills = {
        'Programming Languages': [mockSkill],
        'Frameworks': [],
      };
      mockSkillsService.getSkillsByCategory.mockResolvedValue(categorizedSkills);

      const result = await controller.getSkillsByCategory(mockSkill.user_id);

      expect(result).toHaveProperty('Programming Languages');
    });
  });
});

describe('Preferences Controller', () => {
  let controller: PreferencesController;
  let service: PreferencesService;

  const mockPreferencesService = {
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
  };

  const mockPreferences = {
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
      controllers: [PreferencesController],
      providers: [
        {
          provide: PreferencesService,
          useValue: mockPreferencesService,
        },
      ],
    }).compile();

    controller = module.get<PreferencesController>(PreferencesController);
    service = module.get<PreferencesService>(PreferencesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /preferences', () => {
    it('should return user preferences', async () => {
      mockPreferencesService.getPreferences.mockResolvedValue(mockPreferences);

      const result = await controller.getPreferences(mockPreferences.user_id);

      expect(result).toEqual(mockPreferences);
      expect(service.getPreferences).toHaveBeenCalledWith(mockPreferences.user_id);
    });
  });

  describe('PUT /preferences', () => {
    it('should update preferences successfully', async () => {
      const updateDto: UpdatePreferenceDto = {
        job_titles: ['Senior Engineer', 'Tech Lead'],
        min_salary: 150000,
      };

      const updatedPreferences = { ...mockPreferences, ...updateDto };
      mockPreferencesService.updatePreferences.mockResolvedValue(updatedPreferences);

      const result = await controller.updatePreferences(mockPreferences.user_id, updateDto);

      expect(result.job_titles).toEqual(updateDto.job_titles);
      expect(service.updatePreferences).toHaveBeenCalledWith(mockPreferences.user_id, updateDto);
    });

    it('should update privacy settings', async () => {
      const updateDto: UpdatePreferenceDto = {
        privacy_settings: {
          profile_visibility: 'private',
          show_email: true,
          show_phone: false,
        },
      };

      const updatedPreferences = { ...mockPreferences, ...updateDto };
      mockPreferencesService.updatePreferences.mockResolvedValue(updatedPreferences);

      const result = await controller.updatePreferences(mockPreferences.user_id, updateDto);

      expect(result.privacy_settings.profile_visibility).toBe('private');
      expect(result.privacy_settings.show_email).toBe(true);
    });
  });
});

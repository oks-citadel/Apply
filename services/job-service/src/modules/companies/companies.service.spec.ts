import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { Company } from './entities/company.entity';
import { CompanyReview } from './entities/company-review.entity';
import { Job, EmploymentType } from '../jobs/entities/job.entity';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let companyRepository: jest.Mocked<Repository<Company>>;
  let reviewRepository: jest.Mocked<Repository<CompanyReview>>;
  let jobRepository: jest.Mocked<Repository<Job>>;

  const mockCompany: Partial<Company> = {
    id: 'company-1',
    name: 'Tech Corp',
    slug: 'tech-corp',
    website: 'https://techcorp.com',
    logo_url: 'https://techcorp.com/logo.png',
    description: 'A leading tech company',
    industry: 'Technology',
    size: '1000-5000',
    headquarters: 'San Francisco, CA',
    founded_year: 2010,
    rating: 4.5,
    is_verified: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockReview: Partial<CompanyReview> = {
    id: 'review-1',
    company_id: 'company-1',
    user_id: 'user-1',
    overall_rating: 4.5,
    work_life_balance: 4.0,
    compensation: 5.0,
    culture: 4.5,
    management: 4.0,
    career_growth: 4.0,
    title: 'Great place to work',
    pros: 'Excellent benefits and culture',
    cons: 'Can be demanding at times',
    recommend_to_friend: true,
    employment_status: 'current',
    job_title: 'Software Engineer',
    years_at_company: 2,
    is_verified: true,
    helpful_count: 10,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockJob: Partial<Job> = {
    id: 'job-1',
    company_id: 'company-1',
    title: 'Software Engineer',
    is_active: true,
    employment_type: EmploymentType.FULL_TIME,
    posted_at: new Date('2024-01-01'),
  };

  const mockCompanyRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockReviewRepository = {
    findAndCount: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockJobRepository = {
    findAndCount: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository,
        },
        {
          provide: getRepositoryToken(CompanyReview),
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    companyRepository = module.get(getRepositoryToken(Company));
    reviewRepository = module.get(getRepositoryToken(CompanyReview));
    jobRepository = module.get(getRepositoryToken(Job));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCompanyById', () => {
    it('should return company with active jobs count', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockJobRepository.count.mockResolvedValue(15);

      const result = await service.getCompanyById('company-1');

      expect(result).toEqual({
        ...mockCompany,
        active_jobs_count: 15,
      });
      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'company-1' },
      });
      expect(mockJobRepository.count).toHaveBeenCalledWith({
        where: { company_id: 'company-1', is_active: true },
      });
    });

    it('should throw NotFoundException when company not found', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      await expect(service.getCompanyById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return 0 active jobs count if no jobs', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockJobRepository.count.mockResolvedValue(0);

      const result = await service.getCompanyById('company-1');

      expect(result.active_jobs_count).toBe(0);
    });
  });

  describe('getCompanyJobs', () => {
    it('should return paginated company jobs', async () => {
      const mockJobs = [mockJob, { ...mockJob, id: 'job-2' }];

      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockJobRepository.findAndCount.mockResolvedValue([mockJobs as Job[], 2]);

      const result = await service.getCompanyJobs('company-1', 1, 20);

      expect(result).toEqual({
        data: mockJobs,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      });
      expect(mockJobRepository.findAndCount).toHaveBeenCalledWith({
        where: { company_id: 'company-1', is_active: true },
        order: { posted_at: 'DESC' },
        take: 20,
        skip: 0,
      });
    });

    it('should throw NotFoundException when company not found', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      await expect(service.getCompanyJobs('nonexistent-id', 1, 20)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle pagination correctly', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockJobRepository.findAndCount.mockResolvedValue([[], 50]);

      const result = await service.getCompanyJobs('company-1', 2, 20);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        total_pages: 3,
        has_next: true,
        has_prev: true,
      });
      expect(mockJobRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
        }),
      );
    });

    it('should only return active jobs', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockJobRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getCompanyJobs('company-1', 1, 20);

      expect(mockJobRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_active: true }),
        }),
      );
    });
  });

  describe('getCompanyReviews', () => {
    it('should return paginated reviews with summary', async () => {
      const mockReviews = [mockReview, { ...mockReview, id: 'review-2', overall_rating: 5.0 }];
      const allReviews = [
        { overall_rating: 4.5, recommend_to_friend: true },
        { overall_rating: 5.0, recommend_to_friend: true },
        { overall_rating: 4.0, recommend_to_friend: false },
        { overall_rating: 3.5, recommend_to_friend: true },
        { overall_rating: 5.0, recommend_to_friend: true },
      ];

      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockReviewRepository.findAndCount.mockResolvedValue([mockReviews as CompanyReview[], 2]);
      mockReviewRepository.find.mockResolvedValue(allReviews as CompanyReview[]);

      const result = await service.getCompanyReviews('company-1', 1, 20, 'recent');

      expect(result).toBeDefined();
      expect(result.data).toEqual(mockReviews);
      expect(result.pagination).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.total_reviews).toBe(5);
      expect(result.summary.average_rating).toBeGreaterThan(0);
      expect(result.summary.rating_distribution).toHaveLength(5);
      expect(result.summary.recommend_percentage).toBeGreaterThanOrEqual(0);
    });

    it('should throw NotFoundException when company not found', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCompanyReviews('nonexistent-id', 1, 20, 'recent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should sort by recent by default', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockReviewRepository.findAndCount.mockResolvedValue([[], 0]);
      mockReviewRepository.find.mockResolvedValue([]);

      await service.getCompanyReviews('company-1', 1, 20, 'recent');

      expect(mockReviewRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { created_at: 'DESC' },
        }),
      );
    });

    it('should sort by helpful when specified', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockReviewRepository.findAndCount.mockResolvedValue([[], 0]);
      mockReviewRepository.find.mockResolvedValue([]);

      await service.getCompanyReviews('company-1', 1, 20, 'helpful');

      expect(mockReviewRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { helpful_count: 'DESC', created_at: 'DESC' },
        }),
      );
    });

    it('should sort by rating when specified', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockReviewRepository.findAndCount.mockResolvedValue([[], 0]);
      mockReviewRepository.find.mockResolvedValue([]);

      await service.getCompanyReviews('company-1', 1, 20, 'rating');

      expect(mockReviewRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { overall_rating: 'DESC', created_at: 'DESC' },
        }),
      );
    });

    it('should only return verified reviews', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockReviewRepository.findAndCount.mockResolvedValue([[], 0]);
      mockReviewRepository.find.mockResolvedValue([]);

      await service.getCompanyReviews('company-1', 1, 20, 'recent');

      expect(mockReviewRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_verified: true }),
        }),
      );
      expect(mockReviewRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_verified: true }),
        }),
      );
    });

    it('should calculate average rating correctly', async () => {
      const allReviews = [
        { overall_rating: 5.0, recommend_to_friend: true },
        { overall_rating: 4.0, recommend_to_friend: true },
        { overall_rating: 3.0, recommend_to_friend: false },
      ];

      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockReviewRepository.findAndCount.mockResolvedValue([[], 0]);
      mockReviewRepository.find.mockResolvedValue(allReviews as CompanyReview[]);

      const result = await service.getCompanyReviews('company-1', 1, 20, 'recent');

      expect(result.summary.average_rating).toBe(4.0); // (5+4+3)/3 = 4.0
    });

    it('should calculate rating distribution correctly', async () => {
      const allReviews = [
        { overall_rating: 5.0, recommend_to_friend: true },
        { overall_rating: 5.0, recommend_to_friend: true },
        { overall_rating: 4.2, recommend_to_friend: true }, // Rounds to 4
        { overall_rating: 3.8, recommend_to_friend: false }, // Rounds to 4
        { overall_rating: 2.5, recommend_to_friend: false }, // Rounds to 3
      ];

      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockReviewRepository.findAndCount.mockResolvedValue([[], 0]);
      mockReviewRepository.find.mockResolvedValue(allReviews as CompanyReview[]);

      const result = await service.getCompanyReviews('company-1', 1, 20, 'recent');

      const dist = result.summary.rating_distribution;
      expect(dist.find(d => d.rating === 5).count).toBe(2);
      expect(dist.find(d => d.rating === 4).count).toBe(2);
      expect(dist.find(d => d.rating === 3).count).toBe(1);
      expect(dist.find(d => d.rating === 2).count).toBe(0);
      expect(dist.find(d => d.rating === 1).count).toBe(0);
    });

    it('should calculate recommend percentage correctly', async () => {
      const allReviews = [
        { overall_rating: 5.0, recommend_to_friend: true },
        { overall_rating: 4.0, recommend_to_friend: true },
        { overall_rating: 3.0, recommend_to_friend: false },
        { overall_rating: 4.0, recommend_to_friend: true },
      ];

      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockReviewRepository.findAndCount.mockResolvedValue([[], 0]);
      mockReviewRepository.find.mockResolvedValue(allReviews as CompanyReview[]);

      const result = await service.getCompanyReviews('company-1', 1, 20, 'recent');

      expect(result.summary.recommend_percentage).toBe(75); // 3 out of 4 = 75%
    });

    it('should handle empty reviews gracefully', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany as Company);
      mockReviewRepository.findAndCount.mockResolvedValue([[], 0]);
      mockReviewRepository.find.mockResolvedValue([]);

      const result = await service.getCompanyReviews('company-1', 1, 20, 'recent');

      expect(result.summary.average_rating).toBe(0);
      expect(result.summary.total_reviews).toBe(0);
      expect(result.summary.recommend_percentage).toBe(0);
    });
  });

  describe('searchCompanies', () => {
    it('should search companies by name', async () => {
      const mockCompanies = [mockCompany, { ...mockCompany, id: 'company-2', name: 'Tech Solutions' }];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCompanies, 2]),
      };

      mockCompanyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockJobRepository.count.mockResolvedValue(10);

      const result = await service.searchCompanies('Tech', 1, 20);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'company.name ILIKE :query',
        { query: '%Tech%' },
      );
    });

    it('should search companies by industry', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockCompanyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.searchCompanies('Technology', 1, 20);

      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith(
        'company.industry ILIKE :query',
        { query: '%Technology%' },
      );
    });

    it('should only return verified companies', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockCompanyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.searchCompanies('Tech', 1, 20);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'company.is_verified = :verified',
        { verified: true },
      );
    });

    it('should include active jobs count for each company', async () => {
      const mockCompanies = [
        { ...mockCompany, id: 'company-1' },
        { ...mockCompany, id: 'company-2' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCompanies, 2]),
      };

      mockCompanyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockJobRepository.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(10);

      const result = await service.searchCompanies('Tech', 1, 20);

      expect(result.data[0].active_jobs_count).toBe(5);
      expect(result.data[1].active_jobs_count).toBe(10);
    });

    it('should handle pagination correctly', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 50]),
      };

      mockCompanyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.searchCompanies('Tech', 2, 20);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        total_pages: 3,
        has_next: true,
        has_prev: true,
      });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
    });

    it('should order by rating and name', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockCompanyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.searchCompanies('Tech', 1, 20);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'company.rating',
        'DESC',
        'NULLS LAST',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'company.name',
        'ASC',
      );
    });

    it('should return empty result for no matches', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockCompanyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.searchCompanies('NonExistent', 1, 20);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });
});

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';


import { CompanyReview } from './entities/company-review.entity';
import { Company } from './entities/company.entity';
import { Job } from '../jobs/entities/job.entity';

import type { Repository } from 'typeorm';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyReview)
    private readonly reviewRepository: Repository<CompanyReview>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  /**
   * Get company by ID
   */
  async getCompanyById(companyId: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Get active jobs count
    const activeJobsCount = await this.jobRepository.count({
      where: { company_id: companyId, is_active: true },
    });

    return {
      ...company,
      active_jobs_count: activeJobsCount,
    };
  }

  /**
   * Get jobs by company
   */
  async getCompanyJobs(
    companyId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Job[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const [jobs, total] = await this.jobRepository.findAndCount({
      where: { company_id: companyId, is_active: true },
      order: { posted_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Get company reviews
   */
  async getCompanyReviews(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    sort: 'recent' | 'helpful' | 'rating' = 'recent',
  ): Promise<{
    data: CompanyReview[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
    summary: {
      average_rating: number;
      total_reviews: number;
      rating_distribution: { rating: number; count: number }[];
      recommend_percentage: number;
    };
  }> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Determine sort order
    let orderBy: any = { created_at: 'DESC' };
    if (sort === 'helpful') {
      orderBy = { helpful_count: 'DESC', created_at: 'DESC' };
    } else if (sort === 'rating') {
      orderBy = { overall_rating: 'DESC', created_at: 'DESC' };
    }

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { company_id: companyId, is_verified: true },
      order: orderBy,
      take: limit,
      skip: (page - 1) * limit,
    });

    // Calculate summary statistics
    const allReviews = await this.reviewRepository.find({
      where: { company_id: companyId, is_verified: true },
      select: ['overall_rating', 'recommend_to_friend'],
    });

    const averageRating =
      allReviews.reduce((sum, r) => sum + Number(r.overall_rating), 0) / allReviews.length || 0;

    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: allReviews.filter((r) => Math.round(Number(r.overall_rating)) === rating).length,
    }));

    const recommendCount = allReviews.filter((r) => r.recommend_to_friend).length;
    const recommendPercentage = (recommendCount / allReviews.length) * 100 || 0;

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
      summary: {
        average_rating: Math.round(averageRating * 10) / 10,
        total_reviews: allReviews.length,
        rating_distribution: ratingDistribution,
        recommend_percentage: Math.round(recommendPercentage),
      },
    };
  }

  /**
   * Search companies
   */
  async searchCompanies(
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Company[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }> {
    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .where('company.name ILIKE :query', { query: `%${query}%` })
      .orWhere('company.industry ILIKE :query', { query: `%${query}%` })
      .andWhere('company.is_verified = :verified', { verified: true })
      .orderBy('company.rating', 'DESC', 'NULLS LAST')
      .addOrderBy('company.name', 'ASC');

    const [companies, total] = await queryBuilder
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();

    // Get active jobs count for each company
    const companiesWithJobs = await Promise.all(
      companies.map(async (company) => {
        const activeJobsCount = await this.jobRepository.count({
          where: { company_id: company.id, is_active: true },
        });
        return {
          ...company,
          active_jobs_count: activeJobsCount,
        };
      }),
    );

    return {
      data: companiesWithJobs,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    };
  }
}

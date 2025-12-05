import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CompanyReview } from './entities/company-review.entity';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search companies by name or industry' })
  @ApiQuery({ name: 'query', required: true, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns matching companies' })
  async searchCompanies(
    @Query('query') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.companiesService.searchCompanies(query, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company details by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Returns company details', type: Company })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getCompanyById(@Param('id') id: string): Promise<Company> {
    return this.companiesService.getCompanyById(id);
  }

  @Get(':id/jobs')
  @ApiOperation({ summary: 'Get all jobs from a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns company jobs' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getCompanyJobs(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.companiesService.getCompanyJobs(id, page, limit);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get company reviews' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['recent', 'helpful', 'rating'],
    description: 'Sort order',
  })
  @ApiResponse({ status: 200, description: 'Returns company reviews with summary' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getCompanyReviews(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('sort') sort: 'recent' | 'helpful' | 'rating' = 'recent',
  ) {
    return this.companiesService.getCompanyReviews(id, page, limit, sort);
  }
}

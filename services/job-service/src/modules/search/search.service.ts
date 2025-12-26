import { Client } from '@elastic/elasticsearch';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, MoreThan } from 'typeorm';

import { SearchHistory } from './entities/search-history.entity';

import type { SearchJobsDto } from '../jobs/dto/search-jobs.dto';
import type { Job } from '../jobs/entities/job.entity';
import type { OnModuleInit } from '@nestjs/common';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private elasticsearchClient: Client | null = null;
  private readonly indexName = 'jobs';
  private elasticsearchEnabled = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SearchHistory)
    private readonly searchHistoryRepository: Repository<SearchHistory>,
  ) {
    // Elasticsearch is optional - only initialize if explicitly configured
    const node = this.configService.get('elasticsearch.node');
    const esEnabled = this.configService.get('ELASTICSEARCH_ENABLED', 'false');

    // Only enable if ELASTICSEARCH_ENABLED=true AND a valid node is configured
    if (esEnabled === 'true' && node && !node.includes('localhost')) {
      const auth = this.configService.get('elasticsearch.auth');
      this.elasticsearchClient = new Client({
        node,
        auth: auth?.password ? auth : undefined,
        maxRetries: 3,
        requestTimeout: 30000,
      });
      this.elasticsearchEnabled = true;
    } else {
      this.logger.warn('Elasticsearch disabled - using database fallback for search');
    }
  }

  async onModuleInit() {
    if (!this.elasticsearchEnabled || !this.elasticsearchClient) {
      this.logger.log('Elasticsearch not configured, skipping index creation');
      return;
    }

    try {
      await this.createIndex();
      this.logger.log('Elasticsearch connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Elasticsearch, disabling ES features', error.stack);
      this.elasticsearchEnabled = false;
    }
  }

  /**
   * Create Elasticsearch index with mapping
   */
  async createIndex(): Promise<void> {
    if (!this.elasticsearchClient) return;

    try {
      const indexExists = await this.elasticsearchClient.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        await this.elasticsearchClient.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 2,
              number_of_replicas: 1,
              analysis: {
                analyzer: {
                  job_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'snowball'],
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                external_id: { type: 'keyword' },
                source: { type: 'keyword' },
                title: {
                  type: 'text',
                  analyzer: 'job_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                company_name: {
                  type: 'text',
                  analyzer: 'job_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                location: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                city: { type: 'keyword' },
                state: { type: 'keyword' },
                country: { type: 'keyword' },
                remote_type: { type: 'keyword' },
                salary_min: { type: 'float' },
                salary_max: { type: 'float' },
                description: { type: 'text', analyzer: 'job_analyzer' },
                requirements: { type: 'text', analyzer: 'job_analyzer' },
                benefits: { type: 'text' },
                skills: { type: 'keyword' },
                experience_level: { type: 'keyword' },
                experience_years_min: { type: 'integer' },
                experience_years_max: { type: 'integer' },
                employment_type: { type: 'keyword' },
                posted_at: { type: 'date' },
                expires_at: { type: 'date' },
                is_active: { type: 'boolean' },
                is_featured: { type: 'boolean' },
                is_verified: { type: 'boolean' },
                view_count: { type: 'integer' },
                application_count: { type: 'integer' },
                save_count: { type: 'integer' },
                embedding: { type: 'dense_vector', dims: 384 },
                created_at: { type: 'date' },
                updated_at: { type: 'date' },
              },
            },
          },
        });
        this.logger.log(`Created Elasticsearch index: ${this.indexName}`);
      }
    } catch (error) {
      this.logger.error(`Error creating index: ${error.message}`, error.stack);
    }
  }

  /**
   * Index a job document
   */
  async indexJob(job: Job): Promise<void> {
    if (!this.elasticsearchEnabled || !this.elasticsearchClient) return;

    try {
      await this.elasticsearchClient.index({
        index: this.indexName,
        id: job.id,
        document: {
          id: job.id,
          external_id: job.external_id,
          source: job.source,
          title: job.title,
          company_name: job.company_name,
          location: job.location,
          city: job.city,
          state: job.state,
          country: job.country,
          remote_type: job.remote_type,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          skills: job.skills,
          experience_level: job.experience_level,
          experience_years_min: job.experience_years_min,
          experience_years_max: job.experience_years_max,
          employment_type: job.employment_type,
          posted_at: job.posted_at,
          expires_at: job.expires_at,
          is_active: job.is_active,
          is_featured: job.is_featured,
          is_verified: job.is_verified,
          view_count: job.view_count,
          application_count: job.application_count,
          save_count: job.save_count,
          created_at: job.created_at,
          updated_at: job.updated_at,
        },
      });
    } catch (error) {
      this.logger.error(`Error indexing job ${job.id}: ${error.message}`, error.stack);
    }
  }

  /**
   * Bulk index jobs
   */
  async bulkIndexJobs(jobs: Job[]): Promise<void> {
    if (!this.elasticsearchEnabled || !this.elasticsearchClient) return;

    try {
      const body = jobs.flatMap((job) => [
        { index: { _index: this.indexName, _id: job.id } },
        {
          id: job.id,
          external_id: job.external_id,
          source: job.source,
          title: job.title,
          company_name: job.company_name,
          location: job.location,
          city: job.city,
          state: job.state,
          country: job.country,
          remote_type: job.remote_type,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          skills: job.skills,
          experience_level: job.experience_level,
          employment_type: job.employment_type,
          posted_at: job.posted_at,
          is_active: job.is_active,
          is_featured: job.is_featured,
          is_verified: job.is_verified,
        },
      ]);

      const response = await this.elasticsearchClient.bulk({ body });

      if (response.errors) {
        this.logger.error('Bulk indexing had errors');
      } else {
        this.logger.log(`Successfully indexed ${jobs.length} jobs`);
      }
    } catch (error) {
      this.logger.error(`Error bulk indexing jobs: ${error.message}`, error.stack);
    }
  }

  /**
   * Search jobs with filters
   */
  async searchJobs(searchDto: SearchJobsDto): Promise<{
    hits: any[];
    total: number;
    facets?: any;
  }> {
    if (!this.elasticsearchEnabled || !this.elasticsearchClient) {
      // Fallback: return empty results when ES is not available
      this.logger.warn('Elasticsearch not available, returning empty search results');
      return { hits: [], total: 0 };
    }

    try {
      const must: any[] = [{ term: { is_active: true } }];
      const should: any[] = [];
      const filter: any[] = [];

      // Keyword search
      if (searchDto.keywords) {
        should.push(
          { match: { title: { query: searchDto.keywords, boost: 3 } } },
          { match: { company_name: { query: searchDto.keywords, boost: 2 } } },
          { match: { description: { query: searchDto.keywords, boost: 1 } } },
          { match: { skills: { query: searchDto.keywords, boost: 2.5 } } },
        );
      }

      // Location filter
      if (searchDto.location) {
        should.push(
          { match: { location: searchDto.location } },
          { match: { city: searchDto.location } },
          { match: { state: searchDto.location } },
        );
      }

      // Remote type filter
      if (searchDto.remote_type) {
        filter.push({ term: { remote_type: searchDto.remote_type } });
      }

      // Salary filter
      if (searchDto.salary_min || searchDto.salary_max) {
        const salaryFilter: any = { range: { salary_max: {} } };
        if (searchDto.salary_min) {
          salaryFilter.range.salary_max.gte = searchDto.salary_min;
        }
        if (searchDto.salary_max) {
          salaryFilter.range.salary_min = { lte: searchDto.salary_max };
        }
        filter.push(salaryFilter);
      }

      // Experience level filter
      if (searchDto.experience_level) {
        filter.push({ term: { experience_level: searchDto.experience_level } });
      }

      // Employment type filter
      if (searchDto.employment_type) {
        filter.push({ term: { employment_type: searchDto.employment_type } });
      }

      // Skills filter
      if (searchDto.skills && searchDto.skills.length > 0) {
        filter.push({ terms: { skills: searchDto.skills } });
      }

      // Company filter
      if (searchDto.company_id) {
        filter.push({ term: { company_id: searchDto.company_id } });
      }

      // Posted within days
      if (searchDto.posted_within_days) {
        const date = new Date();
        date.setDate(date.getDate() - searchDto.posted_within_days);
        filter.push({ range: { posted_at: { gte: date.toISOString() } } });
      }

      // Featured filter
      if (searchDto.is_featured) {
        filter.push({ term: { is_featured: true } });
      }

      // Verified filter
      if (searchDto.is_verified) {
        filter.push({ term: { is_verified: true } });
      }

      // Build query
      const query: any = {
        bool: {
          must,
          filter,
        },
      };

      if (should.length > 0) {
        query.bool.should = should;
        query.bool.minimum_should_match = 1;
      }

      // Sort
      const sort: any = {};
      if (searchDto.sort_by) {
        sort[searchDto.sort_by] = { order: searchDto.sort_order || 'desc' };
      } else {
        sort['posted_at'] = { order: 'desc' };
      }

      // Aggregations for facets
      const aggs = {
        remote_types: { terms: { field: 'remote_type', size: 10 } },
        experience_levels: { terms: { field: 'experience_level', size: 10 } },
        employment_types: { terms: { field: 'employment_type', size: 10 } },
        top_skills: { terms: { field: 'skills', size: 20 } },
        top_locations: { terms: { field: 'city', size: 20 } },
      };

      const from = (searchDto.page - 1) * searchDto.limit;

      const response = await this.elasticsearchClient.search({
        index: this.indexName,
        body: {
          query,
          sort: [sort],
          from,
          size: searchDto.limit,
          aggs,
        },
      });

      const hits = response.hits.hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
      }));

      const facets = {
        remote_types: (response.aggregations?.remote_types as any)?.buckets || [],
        experience_levels: (response.aggregations?.experience_levels as any)?.buckets || [],
        employment_types: (response.aggregations?.employment_types as any)?.buckets || [],
        top_skills: (response.aggregations?.top_skills as any)?.buckets || [],
        top_locations: (response.aggregations?.top_locations as any)?.buckets || [],
      };

      return {
        hits,
        total: (response.hits.total as any).value || 0,
        facets,
      };
    } catch (error) {
      this.logger.error(`Error searching jobs: ${error.message}`, error.stack);
      return { hits: [], total: 0 };
    }
  }

  /**
   * Find similar jobs based on a job
   */
  async findSimilarJobs(job: Job, limit: number = 10): Promise<any[]> {
    if (!this.elasticsearchEnabled || !this.elasticsearchClient) return [];

    try {
      const response = await this.elasticsearchClient.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [{ term: { is_active: true } }],
              should: [
                { match: { title: { query: job.title, boost: 2 } } },
                { terms: { skills: job.skills, boost: 3 } },
                { match: { description: job.description } },
                { term: { experience_level: { value: job.experience_level, boost: 1.5 } } },
              ],
              must_not: [{ term: { id: job.id } }],
              minimum_should_match: 1,
            },
          },
          size: limit,
        },
      });

      return response.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error(`Error finding similar jobs: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(field: string, query: string, limit: number = 10): Promise<string[]> {
    if (!this.elasticsearchEnabled || !this.elasticsearchClient) return [];

    try {
      const response = await this.elasticsearchClient.search({
        index: this.indexName,
        body: {
          suggest: {
            autocomplete: {
              prefix: query,
              completion: {
                field,
                size: limit,
                skip_duplicates: true,
              },
            },
          },
        },
      });

      return (response.suggest?.autocomplete[0]?.options as any[])?.map((opt: any) => opt.text) || [];
    } catch (error) {
      this.logger.error(`Error autocomplete: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Delete job from index
   */
  async deleteJob(jobId: string): Promise<void> {
    if (!this.elasticsearchEnabled || !this.elasticsearchClient) return;

    try {
      await this.elasticsearchClient.delete({
        index: this.indexName,
        id: jobId,
      });
    } catch (error) {
      this.logger.error(`Error deleting job ${jobId}: ${error.message}`, error.stack);
    }
  }

  /**
   * Get search suggestions across multiple fields
   */
  async getSuggestions(query: string): Promise<{
    titles: string[];
    companies: string[];
    skills: string[];
    locations: string[];
  }> {
    if (!this.elasticsearchEnabled || !this.elasticsearchClient) {
      return { titles: [], companies: [], skills: [], locations: [] };
    }

    try {
      const [titles, companies, skills, locations] = await Promise.all([
        this.autocomplete('title', query, 5),
        this.autocomplete('company_name', query, 5),
        this.autocomplete('skills', query, 5),
        this.autocomplete('city', query, 5),
      ]);

      return { titles, companies, skills, locations };
    } catch (error) {
      this.logger.error(`Error getting suggestions: ${error.message}`, error.stack);
      return { titles: [], companies: [], skills: [], locations: [] };
    }
  }

  /**
   * Search for locations
   */
  async locationSearch(query: string, limit: number = 10): Promise<Array<{
    city: string;
    state: string;
    country: string;
  }>> {
    if (!this.elasticsearchEnabled || !this.elasticsearchClient) return [];

    try {
      const response = await this.elasticsearchClient.search({
        index: this.indexName,
        body: {
          size: 0,
          query: {
            bool: {
              should: [
                { match: { city: { query, fuzziness: 'AUTO' } } },
                { match: { state: { query, fuzziness: 'AUTO' } } },
                { match: { country: { query, fuzziness: 'AUTO' } } },
              ],
              minimum_should_match: 1,
            },
          },
          aggs: {
            locations: {
              composite: {
                size: limit,
                sources: [
                  { city: { terms: { field: 'city' } } },
                  { state: { terms: { field: 'state' } } },
                  { country: { terms: { field: 'country' } } },
                ],
              },
            },
          },
        },
      });

      return (response.aggregations?.locations as any)?.buckets?.map((bucket: any) => ({
        city: bucket.key.city,
        state: bucket.key.state,
        country: bucket.key.country,
      })) || [];
    } catch (error) {
      this.logger.error(`Error searching locations: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get recent searches for a user
   */
  async getRecentSearches(userId: string, limit: number = 10): Promise<Array<{
    id: string;
    query: string;
    filters: any;
    resultsCount: number;
    timestamp: string;
  }>> {
    this.logger.log(`Getting recent searches for user ${userId}`);

    try {
      const searches = await this.searchHistoryRepository.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
        take: limit,
      });

      return searches.map((search) => ({
        id: search.id,
        query: search.query,
        filters: search.filters,
        resultsCount: search.results_count,
        timestamp: search.created_at.toISOString(),
      }));
    } catch (error) {
      this.logger.error(`Error getting recent searches for user ${userId}: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Save a search query
   */
  async saveSearch(
    userId: string,
    query: string,
    filters?: {
      location?: string;
      remote_type?: string;
      salary_min?: number;
      salary_max?: number;
      experience_level?: string;
      employment_type?: string;
      skills?: string[];
      company_id?: string;
      posted_within_days?: number;
    },
    resultsCount?: number,
  ): Promise<SearchHistory> {
    this.logger.log(`Saving search for user ${userId}: ${query}`);

    try {
      // Check for duplicate recent searches (within last hour with same query)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const existingSearch = await this.searchHistoryRepository.findOne({
        where: {
          user_id: userId,
          query,
          created_at: MoreThan(oneHourAgo),
        },
        order: { created_at: 'DESC' },
      });

      if (existingSearch) {
        // Update the existing search with new results count if provided
        if (resultsCount !== undefined) {
          existingSearch.results_count = resultsCount;
          return await this.searchHistoryRepository.save(existingSearch);
        }
        return existingSearch;
      }

      // Create new search history entry
      const searchHistory = this.searchHistoryRepository.create({
        user_id: userId,
        query,
        filters: filters || null,
        results_count: resultsCount || 0,
      });

      return await this.searchHistoryRepository.save(searchHistory);
    } catch (error) {
      this.logger.error(`Error saving search for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a recent search
   */
  async deleteRecentSearch(userId: string, searchId: string): Promise<void> {
    this.logger.log(`Deleting search ${searchId} for user ${userId}`);

    try {
      const result = await this.searchHistoryRepository.delete({
        id: searchId,
        user_id: userId,
      });

      if (result.affected === 0) {
        this.logger.warn(`Search ${searchId} not found for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting search ${searchId} for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clear all recent searches for a user
   */
  async clearRecentSearches(userId: string): Promise<void> {
    this.logger.log(`Clearing all recent searches for user ${userId}`);

    try {
      await this.searchHistoryRepository.delete({ user_id: userId });
    } catch (error) {
      this.logger.error(`Error clearing searches for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}

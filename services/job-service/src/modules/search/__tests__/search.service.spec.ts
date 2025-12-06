import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../search.service';
import { Client } from '@elastic/elasticsearch';
import { Job } from '../../jobs/entities/job.entity';

// Mock Elasticsearch client
jest.mock('@elastic/elasticsearch');

describe('SearchService', () => {
  let service: SearchService;
  let elasticsearchClient: jest.Mocked<Client>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'elasticsearch.node': 'http://localhost:9200',
        'elasticsearch.auth': { username: 'elastic', password: 'password' },
      };
      return config[key];
    }),
  };

  const mockElasticsearchClient = {
    indices: {
      exists: jest.fn(),
      create: jest.fn(),
    },
    index: jest.fn(),
    bulk: jest.fn(),
    search: jest.fn(),
    delete: jest.fn(),
    ping: jest.fn(),
  };

  beforeEach(async () => {
    (Client as jest.MockedClass<typeof Client>).mockImplementation(() => mockElasticsearchClient as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    elasticsearchClient = mockElasticsearchClient as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should create index if it does not exist', async () => {
      mockElasticsearchClient.indices.exists.mockResolvedValue(false);
      mockElasticsearchClient.indices.create.mockResolvedValue({} as any);

      await service.onModuleInit();

      expect(mockElasticsearchClient.indices.exists).toHaveBeenCalledWith({
        index: 'jobs',
      });
      expect(mockElasticsearchClient.indices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'jobs',
          body: expect.objectContaining({
            settings: expect.any(Object),
            mappings: expect.any(Object),
          }),
        }),
      );
    });

    it('should not create index if it already exists', async () => {
      mockElasticsearchClient.indices.exists.mockResolvedValue(true);

      await service.onModuleInit();

      expect(mockElasticsearchClient.indices.exists).toHaveBeenCalled();
      expect(mockElasticsearchClient.indices.create).not.toHaveBeenCalled();
    });

    it('should handle index creation errors gracefully', async () => {
      mockElasticsearchClient.indices.exists.mockRejectedValue(new Error('Connection failed'));

      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('searchJobs', () => {
    const mockSearchResponse = {
      hits: {
        total: { value: 2 },
        hits: [
          {
            _id: '1',
            _score: 1.5,
            _source: {
              id: '1',
              title: 'Software Engineer',
              company_name: 'Tech Corp',
              location: 'San Francisco, CA',
              salary_min: 100000,
              salary_max: 150000,
              is_active: true,
            },
          },
          {
            _id: '2',
            _score: 1.2,
            _source: {
              id: '2',
              title: 'Senior Software Engineer',
              company_name: 'Innovation Labs',
              location: 'New York, NY',
              salary_min: 130000,
              salary_max: 180000,
              is_active: true,
            },
          },
        ],
      },
      aggregations: {
        remote_types: { buckets: [{ key: 'remote', doc_count: 50 }] },
        experience_levels: { buckets: [{ key: 'senior', doc_count: 30 }] },
        employment_types: { buckets: [{ key: 'full-time', doc_count: 80 }] },
        top_skills: { buckets: [{ key: 'JavaScript', doc_count: 40 }] },
        top_locations: { buckets: [{ key: 'San Francisco', doc_count: 25 }] },
      },
    };

    it('should search jobs with keyword query', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'software engineer',
        page: 1,
        limit: 20,
      };

      const result = await service.searchJobs(searchDto);

      expect(result.hits).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.facets).toBeDefined();
      expect(mockElasticsearchClient.search).toHaveBeenCalled();
    });

    it('should apply location filter', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'developer',
        location: 'San Francisco',
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.query.bool.should).toContainEqual(
        expect.objectContaining({
          match: expect.objectContaining({ location: 'San Francisco' }),
        }),
      );
    });

    it('should apply salary range filter', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'engineer',
        salary_min: 100000,
        salary_max: 150000,
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.query.bool.filter).toContainEqual(
        expect.objectContaining({
          range: expect.any(Object),
        }),
      );
    });

    it('should apply remote type filter', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'developer',
        remote_type: 'remote',
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.query.bool.filter).toContainEqual({
        term: { remote_type: 'remote' },
      });
    });

    it('should apply experience level filter', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'engineer',
        experience_level: 'senior',
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.query.bool.filter).toContainEqual({
        term: { experience_level: 'senior' },
      });
    });

    it('should apply employment type filter', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'developer',
        employment_type: 'full-time',
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.query.bool.filter).toContainEqual({
        term: { employment_type: 'full-time' },
      });
    });

    it('should apply skills filter', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'developer',
        skills: ['JavaScript', 'React', 'Node.js'],
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.query.bool.filter).toContainEqual({
        terms: { skills: ['JavaScript', 'React', 'Node.js'] },
      });
    });

    it('should apply posted within days filter', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'engineer',
        posted_within_days: 7,
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.query.bool.filter).toContainEqual(
        expect.objectContaining({
          range: expect.objectContaining({
            posted_at: expect.objectContaining({ gte: expect.any(String) }),
          }),
        }),
      );
    });

    it('should apply featured jobs filter', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'developer',
        is_featured: true,
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.query.bool.filter).toContainEqual({
        term: { is_featured: true },
      });
    });

    it('should apply verified jobs filter', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'engineer',
        is_verified: true,
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.query.bool.filter).toContainEqual({
        term: { is_verified: true },
      });
    });

    it('should handle pagination correctly', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'developer',
        page: 3,
        limit: 10,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.from).toBe(20); // (page - 1) * limit = (3 - 1) * 10
      expect(searchCall.body.size).toBe(10);
    });

    it('should sort by specified field', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'engineer',
        sort_by: 'posted_at',
        sort_order: 'desc',
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.sort).toContainEqual({
        posted_at: { order: 'desc' },
      });
    });

    it('should return facets for filtering', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'developer',
        page: 1,
        limit: 20,
      };

      const result = await service.searchJobs(searchDto);

      expect(result.facets).toHaveProperty('remote_types');
      expect(result.facets).toHaveProperty('experience_levels');
      expect(result.facets).toHaveProperty('employment_types');
      expect(result.facets).toHaveProperty('top_skills');
      expect(result.facets).toHaveProperty('top_locations');
    });

    it('should handle search errors gracefully', async () => {
      mockElasticsearchClient.search.mockRejectedValue(new Error('Search failed'));

      const searchDto = {
        keywords: 'developer',
        page: 1,
        limit: 20,
      };

      const result = await service.searchJobs(searchDto);

      expect(result.hits).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle empty search results', async () => {
      mockElasticsearchClient.search.mockResolvedValue({
        hits: {
          total: { value: 0 },
          hits: [],
        },
        aggregations: {
          remote_types: { buckets: [] },
          experience_levels: { buckets: [] },
          employment_types: { buckets: [] },
          top_skills: { buckets: [] },
          top_locations: { buckets: [] },
        },
      } as any);

      const searchDto = {
        keywords: 'nonexistent job xyz',
        page: 1,
        limit: 20,
      };

      const result = await service.searchJobs(searchDto);

      expect(result.hits).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should boost title matches higher than description matches', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const searchDto = {
        keywords: 'software',
        page: 1,
        limit: 20,
      };

      await service.searchJobs(searchDto);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      const titleMatch = searchCall.body.query.bool.should.find(
        (clause: any) => clause.match?.title,
      );
      const descriptionMatch = searchCall.body.query.bool.should.find(
        (clause: any) => clause.match?.description,
      );

      expect(titleMatch.match.title.boost).toBeGreaterThan(descriptionMatch.match.description.boost);
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      mockElasticsearchClient.search.mockResolvedValue({
        suggest: {
          autocomplete: [
            {
              options: [
                { text: 'Software Engineer' },
                { text: 'Software Developer' },
                { text: 'Software Architect' },
              ],
            },
          ],
        },
      } as any);

      const result = await service.autocomplete('title', 'soft', 10);

      expect(result).toEqual(['Software Engineer', 'Software Developer', 'Software Architect']);
      expect(mockElasticsearchClient.search).toHaveBeenCalled();
    });

    it('should handle empty autocomplete results', async () => {
      mockElasticsearchClient.search.mockResolvedValue({
        suggest: {
          autocomplete: [{ options: [] }],
        },
      } as any);

      const result = await service.autocomplete('title', 'xyz', 10);

      expect(result).toEqual([]);
    });

    it('should handle autocomplete errors', async () => {
      mockElasticsearchClient.search.mockRejectedValue(new Error('Autocomplete failed'));

      const result = await service.autocomplete('title', 'dev', 10);

      expect(result).toEqual([]);
    });
  });

  describe('findSimilarJobs', () => {
    const mockJob: Partial<Job> = {
      id: '1',
      title: 'Software Engineer',
      description: 'Develop software applications',
      skills: ['JavaScript', 'React', 'Node.js'],
      experience_level: 'mid-level',
    };

    it('should find similar jobs based on title and skills', async () => {
      mockElasticsearchClient.search.mockResolvedValue({
        hits: {
          hits: [
            {
              _source: {
                id: '2',
                title: 'Software Developer',
                skills: ['JavaScript', 'React'],
              },
            },
            {
              _source: {
                id: '3',
                title: 'Full Stack Engineer',
                skills: ['JavaScript', 'Node.js'],
              },
            },
          ],
        },
      } as any);

      const result = await service.findSimilarJobs(mockJob as Job, 10);

      expect(result).toHaveLength(2);
      expect(mockElasticsearchClient.search).toHaveBeenCalled();
    });

    it('should exclude the original job from similar results', async () => {
      mockElasticsearchClient.search.mockResolvedValue({
        hits: {
          hits: [],
        },
      } as any);

      await service.findSimilarJobs(mockJob as Job, 10);

      const searchCall = mockElasticsearchClient.search.mock.calls[0][0];
      expect(searchCall.body.query.bool.must_not).toContainEqual({
        term: { id: '1' },
      });
    });

    it('should handle similar jobs errors', async () => {
      mockElasticsearchClient.search.mockRejectedValue(new Error('Similar jobs failed'));

      const result = await service.findSimilarJobs(mockJob as Job, 10);

      expect(result).toEqual([]);
    });
  });

  describe('indexJob', () => {
    it('should index a job document', async () => {
      const job: Partial<Job> = {
        id: '1',
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        location: 'San Francisco, CA',
        is_active: true,
      };

      mockElasticsearchClient.index.mockResolvedValue({} as any);

      await service.indexJob(job as Job);

      expect(mockElasticsearchClient.index).toHaveBeenCalledWith({
        index: 'jobs',
        id: '1',
        document: expect.objectContaining({
          id: '1',
          title: 'Software Engineer',
          company_name: 'Tech Corp',
        }),
      });
    });

    it('should handle indexing errors gracefully', async () => {
      const job: Partial<Job> = {
        id: '1',
        title: 'Software Engineer',
      };

      mockElasticsearchClient.index.mockRejectedValue(new Error('Indexing failed'));

      await expect(service.indexJob(job as Job)).resolves.not.toThrow();
    });
  });

  describe('bulkIndexJobs', () => {
    it('should bulk index multiple jobs', async () => {
      const jobs: Partial<Job>[] = [
        { id: '1', title: 'Software Engineer', is_active: true },
        { id: '2', title: 'Data Scientist', is_active: true },
      ];

      mockElasticsearchClient.bulk.mockResolvedValue({
        errors: false,
      } as any);

      await service.bulkIndexJobs(jobs as Job[]);

      expect(mockElasticsearchClient.bulk).toHaveBeenCalled();
      const bulkCall = mockElasticsearchClient.bulk.mock.calls[0][0];
      expect(bulkCall.body).toHaveLength(4); // 2 operations + 2 documents
    });

    it('should handle bulk indexing errors', async () => {
      const jobs: Partial<Job>[] = [{ id: '1', title: 'Software Engineer' }];

      mockElasticsearchClient.bulk.mockResolvedValue({
        errors: true,
      } as any);

      await expect(service.bulkIndexJobs(jobs as Job[])).resolves.not.toThrow();
    });
  });

  describe('deleteJob', () => {
    it('should delete a job from the index', async () => {
      mockElasticsearchClient.delete.mockResolvedValue({} as any);

      await service.deleteJob('1');

      expect(mockElasticsearchClient.delete).toHaveBeenCalledWith({
        index: 'jobs',
        id: '1',
      });
    });

    it('should handle deletion errors gracefully', async () => {
      mockElasticsearchClient.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(service.deleteJob('1')).resolves.not.toThrow();
    });
  });

  describe('performance tests', () => {
    it('should handle large batch indexing efficiently', async () => {
      const jobs = Array(1000).fill(null).map((_, i) => ({
        id: `job-${i}`,
        title: `Job ${i}`,
        is_active: true,
      }));

      mockElasticsearchClient.bulk.mockResolvedValue({
        errors: false,
      } as any);

      const startTime = Date.now();
      await service.bulkIndexJobs(jobs as Job[]);
      const endTime = Date.now();

      expect(mockElasticsearchClient.bulk).toHaveBeenCalled();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle complex queries efficiently', async () => {
      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse as any);

      const complexSearch = {
        keywords: 'senior software engineer',
        location: 'San Francisco',
        remote_type: 'hybrid',
        salary_min: 120000,
        salary_max: 200000,
        experience_level: 'senior',
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'],
        employment_type: 'full-time',
        posted_within_days: 30,
        is_featured: true,
        is_verified: true,
        page: 1,
        limit: 50,
      };

      const startTime = Date.now();
      await service.searchJobs(complexSearch);
      const endTime = Date.now();

      expect(mockElasticsearchClient.search).toHaveBeenCalled();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

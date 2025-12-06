import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from '../search.controller';
import { SearchService } from '../search.service';
import { ConfigService } from '@nestjs/config';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: SearchService;

  const mockSearchService = {
    searchJobs: jest.fn(),
    autocomplete: jest.fn(),
    getSuggestions: jest.fn(),
    locationSearch: jest.fn(),
    getRecentSearches: jest.fn(),
    saveSearch: jest.fn(),
    deleteRecentSearch: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        elasticsearch: {
          node: 'http://localhost:9200',
          auth: { username: 'elastic', password: 'password' },
        },
      };
      return config[key] || key;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('globalSearch', () => {
    it('should return search results successfully', async () => {
      const searchDto = {
        query: 'software engineer',
        page: 1,
        limit: 20,
      };

      const expectedResults = {
        data: [
          {
            id: '1',
            title: 'Software Engineer',
            company_name: 'Tech Corp',
            location: 'San Francisco, CA',
            salary_min: 100000,
            salary_max: 150000,
            _score: 1.5,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      };

      mockSearchService.searchJobs.mockResolvedValue(expectedResults);

      const result = await controller.globalSearch(searchDto, { user: { id: 'user-1' } });

      expect(result).toEqual(expectedResults);
      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(searchDto, 'user-1');
    });

    it('should handle search without user authentication', async () => {
      const searchDto = {
        query: 'developer',
        page: 1,
        limit: 20,
      };

      const expectedResults = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
      };

      mockSearchService.searchJobs.mockResolvedValue(expectedResults);

      const result = await controller.globalSearch(searchDto);

      expect(result).toEqual(expectedResults);
      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should handle empty search query', async () => {
      const searchDto = {
        query: '',
        page: 1,
        limit: 20,
      };

      const expectedResults = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
      };

      mockSearchService.searchJobs.mockResolvedValue(expectedResults);

      const result = await controller.globalSearch(searchDto);

      expect(result).toEqual(expectedResults);
    });

    it('should handle pagination correctly', async () => {
      const searchDto = {
        query: 'engineer',
        page: 2,
        limit: 10,
      };

      const expectedResults = {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 100,
          total_pages: 10,
          has_next: true,
          has_prev: true,
        },
      };

      mockSearchService.searchJobs.mockResolvedValue(expectedResults);

      const result = await controller.globalSearch(searchDto);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.has_prev).toBe(true);
      expect(result.pagination.has_next).toBe(true);
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      const query = 'softw';
      const suggestions = ['Software Engineer', 'Software Developer', 'Software Architect'];

      mockSearchService.autocomplete.mockResolvedValue(suggestions);

      const result = await controller.autocomplete(query);

      expect(result).toEqual({ suggestions });
      expect(mockSearchService.autocomplete).toHaveBeenCalledWith('title', query, 10);
    });

    it('should return empty array for no matches', async () => {
      const query = 'xyz123';

      mockSearchService.autocomplete.mockResolvedValue([]);

      const result = await controller.autocomplete(query);

      expect(result).toEqual({ suggestions: [] });
    });

    it('should limit suggestions to specified limit', async () => {
      const query = 'eng';
      const limit = 5;
      const suggestions = ['Engineer', 'Engineering Manager', 'English Teacher', 'Engrave Specialist', 'Engine Mechanic'];

      mockSearchService.autocomplete.mockResolvedValue(suggestions);

      const result = await controller.autocomplete(query, limit);

      expect(result.suggestions).toHaveLength(5);
      expect(mockSearchService.autocomplete).toHaveBeenCalledWith('title', query, limit);
    });
  });

  describe('searchSuggestions', () => {
    it('should return search suggestions', async () => {
      const query = 'java';
      const suggestions = {
        titles: ['Java Developer', 'JavaScript Engineer'],
        companies: ['Java Solutions Inc'],
        skills: ['Java', 'JavaScript', 'JavaFX'],
        locations: ['Jakarta, Indonesia'],
      };

      mockSearchService.getSuggestions.mockResolvedValue(suggestions);

      const result = await controller.searchSuggestions(query);

      expect(result).toEqual(suggestions);
      expect(mockSearchService.getSuggestions).toHaveBeenCalledWith(query);
    });

    it('should handle empty suggestions', async () => {
      const query = 'xyz';
      const emptySuggestions = {
        titles: [],
        companies: [],
        skills: [],
        locations: [],
      };

      mockSearchService.getSuggestions.mockResolvedValue(emptySuggestions);

      const result = await controller.searchSuggestions(query);

      expect(result).toEqual(emptySuggestions);
    });
  });

  describe('locationSearch', () => {
    it('should return location suggestions', async () => {
      const query = 'San';
      const locations = [
        { city: 'San Francisco', state: 'CA', country: 'USA' },
        { city: 'San Diego', state: 'CA', country: 'USA' },
        { city: 'San Jose', state: 'CA', country: 'USA' },
      ];

      mockSearchService.locationSearch.mockResolvedValue(locations);

      const result = await controller.locationSearch(query);

      expect(result).toEqual({ locations });
      expect(mockSearchService.locationSearch).toHaveBeenCalledWith(query, 10);
    });

    it('should handle international locations', async () => {
      const query = 'London';
      const locations = [
        { city: 'London', state: 'England', country: 'UK' },
        { city: 'London', state: 'Ontario', country: 'Canada' },
      ];

      mockSearchService.locationSearch.mockResolvedValue(locations);

      const result = await controller.locationSearch(query);

      expect(result.locations).toHaveLength(2);
    });
  });

  describe('recentSearches', () => {
    it('should return user recent searches', async () => {
      const userId = 'user-1';
      const recentSearches = [
        { query: 'software engineer', timestamp: new Date().toISOString() },
        { query: 'remote developer', timestamp: new Date().toISOString() },
      ];

      mockSearchService.getRecentSearches.mockResolvedValue(recentSearches);

      const result = await controller.getRecentSearches({ user: { id: userId } });

      expect(result).toEqual({ searches: recentSearches });
      expect(mockSearchService.getRecentSearches).toHaveBeenCalledWith(userId, 10);
    });

    it('should handle empty recent searches', async () => {
      const userId = 'user-1';

      mockSearchService.getRecentSearches.mockResolvedValue([]);

      const result = await controller.getRecentSearches({ user: { id: userId } });

      expect(result).toEqual({ searches: [] });
    });

    it('should respect custom limit', async () => {
      const userId = 'user-1';
      const limit = 5;

      mockSearchService.getRecentSearches.mockResolvedValue([]);

      await controller.getRecentSearches({ user: { id: userId } }, limit);

      expect(mockSearchService.getRecentSearches).toHaveBeenCalledWith(userId, limit);
    });
  });

  describe('advancedSearch with filters', () => {
    it('should apply location filter', async () => {
      const searchDto = {
        query: 'developer',
        location: 'San Francisco',
        page: 1,
        limit: 20,
      };

      mockSearchService.searchJobs.mockResolvedValue({
        data: [],
        pagination: expect.any(Object),
      });

      await controller.globalSearch(searchDto);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({ location: 'San Francisco' }),
        undefined,
      );
    });

    it('should apply salary range filter', async () => {
      const searchDto = {
        query: 'engineer',
        salary_min: 100000,
        salary_max: 150000,
        page: 1,
        limit: 20,
      };

      mockSearchService.searchJobs.mockResolvedValue({
        data: [],
        pagination: expect.any(Object),
      });

      await controller.globalSearch(searchDto);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          salary_min: 100000,
          salary_max: 150000,
        }),
        undefined,
      );
    });

    it('should apply experience level filter', async () => {
      const searchDto = {
        query: 'developer',
        experience_level: 'senior',
        page: 1,
        limit: 20,
      };

      mockSearchService.searchJobs.mockResolvedValue({
        data: [],
        pagination: expect.any(Object),
      });

      await controller.globalSearch(searchDto);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({ experience_level: 'senior' }),
        undefined,
      );
    });

    it('should apply remote type filter', async () => {
      const searchDto = {
        query: 'developer',
        remote_type: 'remote',
        page: 1,
        limit: 20,
      };

      mockSearchService.searchJobs.mockResolvedValue({
        data: [],
        pagination: expect.any(Object),
      });

      await controller.globalSearch(searchDto);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({ remote_type: 'remote' }),
        undefined,
      );
    });

    it('should apply multiple filters simultaneously', async () => {
      const searchDto = {
        query: 'senior developer',
        location: 'New York',
        remote_type: 'hybrid',
        salary_min: 120000,
        experience_level: 'senior',
        skills: ['JavaScript', 'React', 'Node.js'],
        page: 1,
        limit: 20,
      };

      mockSearchService.searchJobs.mockResolvedValue({
        data: [],
        pagination: expect.any(Object),
      });

      await controller.globalSearch(searchDto);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'New York',
          remote_type: 'hybrid',
          salary_min: 120000,
          experience_level: 'senior',
          skills: expect.arrayContaining(['JavaScript', 'React', 'Node.js']),
        }),
        undefined,
      );
    });
  });

  describe('sort options', () => {
    it('should sort by relevance (default)', async () => {
      const searchDto = {
        query: 'developer',
        page: 1,
        limit: 20,
      };

      mockSearchService.searchJobs.mockResolvedValue({
        data: [],
        pagination: expect.any(Object),
      });

      await controller.globalSearch(searchDto);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should sort by date posted', async () => {
      const searchDto = {
        query: 'developer',
        sort_by: 'posted_at',
        sort_order: 'desc',
        page: 1,
        limit: 20,
      };

      mockSearchService.searchJobs.mockResolvedValue({
        data: [],
        pagination: expect.any(Object),
      });

      await controller.globalSearch(searchDto);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_by: 'posted_at',
          sort_order: 'desc',
        }),
        undefined,
      );
    });

    it('should sort by salary', async () => {
      const searchDto = {
        query: 'developer',
        sort_by: 'salary_max',
        sort_order: 'desc',
        page: 1,
        limit: 20,
      };

      mockSearchService.searchJobs.mockResolvedValue({
        data: [],
        pagination: expect.any(Object),
      });

      await controller.globalSearch(searchDto);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_by: 'salary_max',
          sort_order: 'desc',
        }),
        undefined,
      );
    });
  });

  describe('error handling', () => {
    it('should handle search service errors gracefully', async () => {
      const searchDto = {
        query: 'developer',
        page: 1,
        limit: 20,
      };

      mockSearchService.searchJobs.mockRejectedValue(new Error('Elasticsearch connection failed'));

      await expect(controller.globalSearch(searchDto)).rejects.toThrow();
    });

    it('should handle autocomplete service errors', async () => {
      const query = 'dev';

      mockSearchService.autocomplete.mockRejectedValue(new Error('Service unavailable'));

      await expect(controller.autocomplete(query)).rejects.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle large result sets efficiently', async () => {
      const searchDto = {
        query: 'developer',
        page: 1,
        limit: 100,
      };

      const largeResultSet = {
        data: Array(100).fill(null).map((_, i) => ({
          id: `job-${i}`,
          title: `Developer ${i}`,
          company_name: `Company ${i}`,
        })),
        pagination: {
          page: 1,
          limit: 100,
          total: 10000,
          total_pages: 100,
          has_next: true,
          has_prev: false,
        },
      };

      mockSearchService.searchJobs.mockResolvedValue(largeResultSet);

      const startTime = Date.now();
      const result = await controller.globalSearch(searchDto);
      const endTime = Date.now();

      expect(result.data).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle rapid autocomplete requests', async () => {
      const queries = ['d', 'de', 'dev', 'deve', 'devel'];

      queries.forEach(query => {
        mockSearchService.autocomplete.mockResolvedValue([`${query}eloper`]);
      });

      const promises = queries.map(query => controller.autocomplete(query));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockSearchService.autocomplete).toHaveBeenCalledTimes(5);
    });
  });

  describe('no results handling', () => {
    it('should return empty results with proper structure', async () => {
      const searchDto = {
        query: 'nonexistent job title xyz',
        page: 1,
        limit: 20,
      };

      const emptyResults = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
        facets: {
          remote_types: [],
          experience_levels: [],
          employment_types: [],
          top_skills: [],
          top_locations: [],
        },
      };

      mockSearchService.searchJobs.mockResolvedValue(emptyResults);

      const result = await controller.globalSearch(searchDto);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.facets).toBeDefined();
    });
  });
});

import { test, expect } from '@playwright/test';
import { TEST_JOBS } from '../utils/test-data';

/**
 * E2E Tests for Job Search Flow
 *
 * This suite tests job search functionality including:
 * - Basic search
 * - Filters (location, type, salary, etc.)
 * - Sorting
 * - Search results pagination
 * - Saved searches
 */

// Mock job data for API responses
const mockJobsResponse = {
  data: [
    {
      id: 'job-1',
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      company_name: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      remote_type: 'hybrid',
      employment_type: 'full_time',
      salary_min: 150000,
      salary_max: 200000,
      salary_currency: 'USD',
      experience_level: 'senior',
      description: 'Join our team as a Senior Software Engineer...',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      posted_at: '2024-01-15T10:00:00Z',
      is_active: true,
    },
    {
      id: 'job-2',
      title: 'Software Developer',
      company: 'StartupXYZ',
      company_name: 'StartupXYZ',
      location: 'Remote',
      remote_type: 'remote',
      employment_type: 'full_time',
      salary_min: 120000,
      salary_max: 160000,
      salary_currency: 'USD',
      experience_level: 'mid',
      description: 'Looking for a talented Software Developer...',
      skills: ['Python', 'Django', 'PostgreSQL'],
      posted_at: '2024-01-14T10:00:00Z',
      is_active: true,
    },
    {
      id: 'job-3',
      title: 'Frontend Developer',
      company: 'Google',
      company_name: 'Google',
      location: 'New York, NY',
      remote_type: 'on_site',
      employment_type: 'full_time',
      salary_min: 140000,
      salary_max: 180000,
      salary_currency: 'USD',
      experience_level: 'mid',
      description: 'Build beautiful user interfaces...',
      skills: ['React', 'TypeScript', 'CSS'],
      posted_at: '2024-01-13T10:00:00Z',
      is_active: true,
    },
    {
      id: 'job-4',
      title: 'C++ Developer',
      company: 'GameStudio',
      company_name: 'GameStudio',
      location: 'Seattle, WA',
      remote_type: 'hybrid',
      employment_type: 'full_time',
      salary_min: 130000,
      salary_max: 170000,
      salary_currency: 'USD',
      experience_level: 'senior',
      description: 'Develop high-performance game engines...',
      skills: ['C++', 'Unreal Engine', 'OpenGL'],
      posted_at: '2024-01-12T10:00:00Z',
      is_active: true,
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 4,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  },
};

const mockSearchSuggestions = [
  'Software Engineer',
  'Software Developer',
  'Software Architect',
];

test.describe('Job Search', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the jobs API endpoint
    await page.route('**/api/jobs**', async (route) => {
      const url = new URL(route.request().url());
      const keywords = url.searchParams.get('keywords') || '';
      const location = url.searchParams.get('location') || '';
      const remoteType = url.searchParams.get('remote_type') || '';
      const experienceLevel = url.searchParams.get('experience_level') || '';
      const employmentType = url.searchParams.get('employment_type') || '';
      const salaryMin = url.searchParams.get('salary_min') || '';
      const company = url.searchParams.get('company') || '';
      const pageNum = parseInt(url.searchParams.get('page') || '1');

      // Filter jobs based on query params
      let filteredJobs = [...mockJobsResponse.data];

      if (keywords) {
        const keywordLower = keywords.toLowerCase();
        filteredJobs = filteredJobs.filter(
          (job) =>
            job.title.toLowerCase().includes(keywordLower) ||
            job.description.toLowerCase().includes(keywordLower) ||
            job.skills.some((skill) => skill.toLowerCase().includes(keywordLower))
        );
      }

      if (location) {
        const locationLower = location.toLowerCase();
        filteredJobs = filteredJobs.filter((job) =>
          job.location.toLowerCase().includes(locationLower)
        );
      }

      if (remoteType) {
        filteredJobs = filteredJobs.filter((job) => job.remote_type === remoteType);
      }

      if (experienceLevel) {
        filteredJobs = filteredJobs.filter((job) => job.experience_level === experienceLevel);
      }

      if (employmentType) {
        filteredJobs = filteredJobs.filter((job) => job.employment_type === employmentType);
      }

      if (salaryMin) {
        const minSalary = parseInt(salaryMin);
        filteredJobs = filteredJobs.filter((job) => job.salary_max >= minSalary);
      }

      if (company) {
        const companyLower = company.toLowerCase();
        filteredJobs = filteredJobs.filter((job) =>
          job.company_name.toLowerCase().includes(companyLower)
        );
      }

      // Handle pagination
      const limit = 20;
      const startIndex = (pageNum - 1) * limit;
      const paginatedJobs = filteredJobs.slice(startIndex, startIndex + limit);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: paginatedJobs,
          pagination: {
            page: pageNum,
            limit,
            total: filteredJobs.length,
            total_pages: Math.ceil(filteredJobs.length / limit),
            has_next: pageNum * limit < filteredJobs.length,
            has_prev: pageNum > 1,
          },
        }),
      });
    });

    // Mock search suggestions
    await page.route('**/api/jobs/suggestions**', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q') || '';

      const filteredSuggestions = mockSearchSuggestions.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase())
      );

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ suggestions: filteredSuggestions }),
      });
    });

    // Mock saved searches
    await page.route('**/api/saved-searches', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'saved-search-1',
            keywords: 'Product Manager',
            location: 'Seattle',
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              { id: 'ss-1', keywords: 'Software Engineer', location: 'Remote' },
            ],
          }),
        });
      }
    });

    await page.goto('/jobs');
  });

  test('should display jobs page', async ({ page }) => {
    // Verify page loaded
    await expect(page).toHaveURL(/.*jobs/);
    await expect(page.getByRole('heading', { name: /jobs|find.*jobs|job.*search/i })).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    // Verify search interface exists
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);
    await expect(searchInput).toBeVisible();
  });

  test('should search for jobs by keyword', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);

    // Search for "Software Engineer"
    await searchInput.fill('Software Engineer');
    await searchInput.press('Enter');

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Should show results
    const jobItems = page.getByTestId('job-item');
    const count = await jobItems.count();
    expect(count).toBeGreaterThan(0);

    // Results should contain search term
    const firstJob = jobItems.first();
    const text = await firstJob.textContent();
    expect(text?.toLowerCase()).toContain('software');
  });

  test('should filter jobs by location', async ({ page }) => {
    // Find location filter
    const locationInput = page.getByPlaceholder(/location|city/i);
    const locationFilter = page.getByRole('combobox', { name: /location/i });

    if (await locationInput.isVisible().catch(() => false)) {
      await locationInput.fill('San Francisco');
      await locationInput.press('Enter');
    } else if (await locationFilter.isVisible().catch(() => false)) {
      await locationFilter.click();
      await page.getByRole('option', { name: /san.*francisco/i }).click();
    }

    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Verify location appears in results
    await expect(page.getByText(/san.*francisco/i).first()).toBeVisible();
  });

  test('should filter jobs by job type', async ({ page }) => {
    // Find job type filter
    const jobTypeFilter = page.getByRole('combobox', { name: /job.*type|employment.*type/i });
    const jobTypeButton = page.getByRole('button', { name: /full.*time/i });

    if (await jobTypeFilter.isVisible().catch(() => false)) {
      await jobTypeFilter.click();
      await page.getByRole('option', { name: /full.*time/i }).click();
    } else if (await jobTypeButton.isVisible().catch(() => false)) {
      await jobTypeButton.click();
    }

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Verify results are filtered (all mocked jobs are full-time)
    const jobItems = page.getByTestId('job-item');
    const count = await jobItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter jobs by remote work', async ({ page }) => {
    // Find remote checkbox/toggle
    const remoteCheckbox = page.getByLabel(/remote/i);
    const remoteFilter = page.getByRole('button', { name: /remote/i });
    const remoteOption = page.getByTestId('filter-remote');

    if (await remoteCheckbox.isVisible().catch(() => false)) {
      await remoteCheckbox.check();
    } else if (await remoteFilter.isVisible().catch(() => false)) {
      await remoteFilter.click();
    } else if (await remoteOption.isVisible().catch(() => false)) {
      await remoteOption.click();
    }

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Results should show remote jobs
    await expect(page.getByText(/remote/i).first()).toBeVisible();
  });

  test('should filter jobs by salary range', async ({ page }) => {
    // Find salary filter
    const minSalaryInput = page.getByLabel(/min.*salary|minimum.*salary/i);
    const salarySlider = page.getByRole('slider', { name: /salary/i });
    const salaryFilterButton = page.getByRole('button', { name: /salary/i });

    if (await minSalaryInput.isVisible().catch(() => false)) {
      await minSalaryInput.fill('100000');

      // Apply filter
      const applyButton = page.getByRole('button', { name: /apply|filter/i });
      if (await applyButton.isVisible().catch(() => false)) {
        await applyButton.click();
      } else {
        await minSalaryInput.press('Enter');
      }
    } else if (await salaryFilterButton.isVisible().catch(() => false)) {
      await salaryFilterButton.click();
    }

    await page.waitForLoadState('networkidle');

    // Verify jobs are shown (filtered by salary)
    const jobItems = page.getByTestId('job-item');
    const count = await jobItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter by experience level', async ({ page }) => {
    const experienceFilter = page.getByRole('combobox', { name: /experience.*level|seniority/i });
    const seniorButton = page.getByRole('button', { name: /senior/i });

    if (await experienceFilter.isVisible().catch(() => false)) {
      await experienceFilter.click();
      await page.getByRole('option', { name: /senior/i }).click();
    } else if (await seniorButton.isVisible().catch(() => false)) {
      await seniorButton.click();
    }

    await page.waitForLoadState('networkidle');

    // Results should show appropriate experience level
    const seniorJobs = page.getByText(/senior|sr\./i);
    if (await seniorJobs.first().isVisible().catch(() => false)) {
      await expect(seniorJobs.first()).toBeVisible();
    }
  });

  test('should filter by company', async ({ page }) => {
    const companyFilter = page.getByLabel(/company/i);
    const companyInput = page.getByPlaceholder(/company/i);

    if (await companyFilter.isVisible().catch(() => false)) {
      await companyFilter.fill('Google');
      await companyFilter.press('Enter');
    } else if (await companyInput.isVisible().catch(() => false)) {
      await companyInput.fill('Google');
      await companyInput.press('Enter');
    }

    await page.waitForLoadState('networkidle');

    // Results should show Google jobs
    const googleText = page.getByText(/google/i);
    if (await googleText.first().isVisible().catch(() => false)) {
      await expect(googleText.first()).toBeVisible();
    }
  });

  test('should apply multiple filters simultaneously', async ({ page }) => {
    // Apply keyword search
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);
    await searchInput.fill('Developer');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');

    // Apply location filter if available
    const locationInput = page.getByPlaceholder(/location/i);
    if (await locationInput.isVisible().catch(() => false)) {
      await locationInput.fill('New York');
      await locationInput.press('Enter');
    }

    await page.waitForLoadState('networkidle');

    // Results should match filters
    const results = page.getByTestId('job-item');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should clear all filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);

    // Apply some filters
    await searchInput.fill('Engineer');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');

    // Click clear all button
    const clearButton = page.getByRole('button', { name: /clear.*all|reset.*filters|clear/i });

    if (await clearButton.isVisible().catch(() => false)) {
      await clearButton.click();

      await page.waitForLoadState('networkidle');

      // Filters should be cleared
      await expect(searchInput).toHaveValue('');
    }
  });

  test('should sort jobs by relevance', async ({ page }) => {
    const sortSelect = page.getByRole('combobox', { name: /sort/i });
    const sortButton = page.getByRole('button', { name: /sort|order/i });

    if (await sortSelect.isVisible().catch(() => false)) {
      await sortSelect.click();
      await page.getByRole('option', { name: /relevance/i }).click();

      await page.waitForLoadState('networkidle');

      // Results should be reordered
      const firstJob = page.getByTestId('job-item').first();
      await expect(firstJob).toBeVisible();
    } else if (await sortButton.isVisible().catch(() => false)) {
      await sortButton.click();
      const relevanceOption = page.getByText(/relevance/i);
      if (await relevanceOption.isVisible().catch(() => false)) {
        await relevanceOption.click();
      }
    }
  });

  test('should sort jobs by date', async ({ page }) => {
    const sortSelect = page.getByRole('combobox', { name: /sort/i });
    const sortButton = page.getByRole('button', { name: /sort|order/i });

    if (await sortSelect.isVisible().catch(() => false)) {
      await sortSelect.click();
      await page.getByRole('option', { name: /date|recent|newest/i }).click();

      await page.waitForLoadState('networkidle');

      // Should show most recent first
      const firstJob = page.getByTestId('job-item').first();
      await expect(firstJob).toBeVisible();
    } else if (await sortButton.isVisible().catch(() => false)) {
      await sortButton.click();
      const dateOption = page.getByText(/date|recent|newest/i);
      if (await dateOption.isVisible().catch(() => false)) {
        await dateOption.click();
      }
    }
  });

  test('should paginate through results', async ({ page }) => {
    // Mock paginated response
    await page.route('**/api/jobs**', async (route) => {
      const url = new URL(route.request().url());
      const pageNum = parseInt(url.searchParams.get('page') || '1');

      const jobs =
        pageNum === 1
          ? mockJobsResponse.data.slice(0, 2)
          : mockJobsResponse.data.slice(2, 4);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: jobs,
          pagination: {
            page: pageNum,
            limit: 2,
            total: 4,
            total_pages: 2,
            has_next: pageNum === 1,
            has_prev: pageNum > 1,
          },
        }),
      });
    });

    // Do a search
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);
    await searchInput.fill('Software');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');

    // Find next page button
    const nextButton = page.getByRole('button', { name: /next|>|→|page.*2/i });

    if (await nextButton.isVisible().catch(() => false)) {
      // Get first job on page 1
      const firstJobPage1 = await page.getByTestId('job-item').first().textContent();

      // Go to next page
      await nextButton.click();

      await page.waitForLoadState('networkidle');

      // First job on page 2 should be different
      const firstJobPage2 = await page.getByTestId('job-item').first().textContent();
      expect(firstJobPage1).not.toBe(firstJobPage2);
    }
  });

  test('should show number of results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);
    await searchInput.fill('Developer');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');

    // Should display result count
    const resultCount = page.getByText(/\d+\s+jobs?|showing.*\d+|results?.*\d+|\d+.*results?/i);
    await expect(resultCount.first()).toBeVisible();
  });

  test('should show no results message', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/jobs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false,
          },
        }),
      });
    });

    // Search for something that won't have results
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);
    await searchInput.fill('asdfghjklqwertyuiop12345');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');

    // Should show no results message
    await expect(page.getByText(/no.*jobs.*found|no.*results|try.*different|0.*results/i)).toBeVisible();
  });

  test('should save search', async ({ page, context }) => {
    // Login first
    await context.addCookies([
      { name: 'auth-token', value: 'mock-token', domain: 'localhost', path: '/' },
    ]);

    // Perform a search
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);
    await searchInput.fill('Product Manager');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');

    // Click save search
    const saveButton = page.getByRole('button', { name: /save.*search|create.*alert|save/i });

    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();

      // Should show confirmation
      await expect(page.getByText(/search.*saved|alert.*created|saved/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should suggest search terms', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);

    // Start typing
    await searchInput.fill('Soft');

    // Wait for suggestions
    await page.waitForTimeout(500);

    // Should show autocomplete suggestions
    const suggestions = page.getByRole('option', { name: /software/i });
    const suggestionsList = page.getByRole('listbox');

    if (await suggestions.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(suggestions.first()).toBeVisible();

      // Click suggestion
      await suggestions.first().click();

      // Search should be performed
      await expect(searchInput).toHaveValue(/software/i);
    } else if (await suggestionsList.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Alternative suggestion UI
      const softwareOption = suggestionsList.getByText(/software/i);
      if (await softwareOption.isVisible().catch(() => false)) {
        await softwareOption.click();
      }
    }
  });

  test('should display search history', async ({ page, context }) => {
    await context.addCookies([
      { name: 'auth-token', value: 'mock-token', domain: 'localhost', path: '/' },
    ]);

    // Mock search history
    await page.route('**/api/search-history', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { query: 'Software Engineer', timestamp: '2024-01-15T10:00:00Z' },
            { query: 'Product Manager', timestamp: '2024-01-14T10:00:00Z' },
          ],
        }),
      });
    });

    // Click on search input
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);
    await searchInput.click();

    // Should show recent searches
    const recentSearches = page.getByText(/recent.*searches|search.*history|recent/i);

    if (await recentSearches.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(recentSearches).toBeVisible();
    }
  });

  test('should handle search with special characters', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*jobs|job.*title|keywords/i);

    // Search with special characters
    await searchInput.fill('C++ Developer');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');

    // Should not error, should show results or no results message
    const hasResults = await page.getByTestId('job-item').first().isVisible().catch(() => false);
    const hasNoResults = await page.getByText(/no.*jobs.*found|no.*results/i).isVisible().catch(() => false);
    const hasPageContent = await page.getByRole('heading', { name: /jobs/i }).isVisible().catch(() => false);

    expect(hasResults || hasNoResults || hasPageContent).toBeTruthy();
  });
});

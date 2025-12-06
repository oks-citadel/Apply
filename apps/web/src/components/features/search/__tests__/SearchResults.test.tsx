import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SearchResults } from '../SearchResults';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SearchResults', () => {
  const mockJobs = [
    {
      id: '1',
      title: 'Software Engineer',
      company_name: 'Tech Corp',
      location: 'San Francisco, CA',
      salary_min: 100000,
      salary_max: 150000,
      posted_at: '2024-01-15T00:00:00Z',
      remote_type: 'hybrid',
      employment_type: 'full-time',
      experience_level: 'mid-level',
      skills: ['JavaScript', 'React', 'Node.js'],
      saved: false,
    },
    {
      id: '2',
      title: 'Senior Software Engineer',
      company_name: 'Innovation Labs',
      location: 'New York, NY',
      salary_min: 130000,
      salary_max: 180000,
      posted_at: '2024-01-14T00:00:00Z',
      remote_type: 'remote',
      employment_type: 'full-time',
      experience_level: 'senior',
      skills: ['Python', 'Django', 'AWS'],
      saved: true,
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 20,
    total: 2,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  };

  const mockFacets = {
    remote_types: [
      { key: 'remote', doc_count: 50 },
      { key: 'hybrid', doc_count: 30 },
      { key: 'onsite', doc_count: 20 },
    ],
    experience_levels: [
      { key: 'senior', doc_count: 40 },
      { key: 'mid-level', doc_count: 35 },
      { key: 'junior', doc_count: 25 },
    ],
    employment_types: [
      { key: 'full-time', doc_count: 80 },
      { key: 'contract', doc_count: 15 },
      { key: 'part-time', doc_count: 5 },
    ],
    top_skills: [
      { key: 'JavaScript', doc_count: 60 },
      { key: 'Python', doc_count: 50 },
      { key: 'React', doc_count: 45 },
    ],
    top_locations: [
      { key: 'San Francisco', doc_count: 30 },
      { key: 'New York', doc_count: 25 },
      { key: 'Remote', doc_count: 40 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render job results', () => {
    render(
      <SearchResults
        jobs={mockJobs}
        pagination={mockPagination}
        facets={mockFacets}
      />
    );

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
  });

  it('should display job details correctly', () => {
    render(
      <SearchResults
        jobs={mockJobs}
        pagination={mockPagination}
        facets={mockFacets}
      />
    );

    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText(/\$100,000 - \$150,000/)).toBeInTheDocument();
  });

  it('should show total results count', () => {
    render(
      <SearchResults
        jobs={mockJobs}
        pagination={mockPagination}
        facets={mockFacets}
      />
    );

    expect(screen.getByText(/2 jobs found/i)).toBeInTheDocument();
  });

  it('should render empty state when no results', () => {
    render(
      <SearchResults
        jobs={[]}
        pagination={{ ...mockPagination, total: 0 }}
        facets={mockFacets}
      />
    );

    expect(screen.getByText(/no jobs found/i)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(
      <SearchResults
        jobs={[]}
        pagination={mockPagination}
        facets={mockFacets}
        isLoading={true}
      />
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  describe('Pagination', () => {
    it('should show pagination controls', () => {
      const pagination = {
        ...mockPagination,
        total: 100,
        total_pages: 5,
        has_next: true,
      };

      render(
        <SearchResults
          jobs={mockJobs}
          pagination={pagination}
          facets={mockFacets}
        />
      );

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      const pagination = {
        ...mockPagination,
        page: 5,
        total_pages: 5,
        has_next: false,
        has_prev: true,
      };

      render(
        <SearchResults
          jobs={mockJobs}
          pagination={pagination}
          facets={mockFacets}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should call onPageChange when next is clicked', async () => {
      const mockOnPageChange = jest.fn();
      const pagination = {
        ...mockPagination,
        has_next: true,
      };

      const user = userEvent.setup();
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={pagination}
          facets={mockFacets}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Filters', () => {
    it('should display filter sidebar', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      expect(screen.getByText(/remote type/i)).toBeInTheDocument();
      expect(screen.getByText(/experience level/i)).toBeInTheDocument();
      expect(screen.getByText(/employment type/i)).toBeInTheDocument();
    });

    it('should show facet counts', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      expect(screen.getByText(/remote.*50/i)).toBeInTheDocument();
      expect(screen.getByText(/senior.*40/i)).toBeInTheDocument();
    });

    it('should call onFilterChange when filter is clicked', async () => {
      const mockOnFilterChange = jest.fn();
      const user = userEvent.setup();

      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
          onFilterChange={mockOnFilterChange}
        />
      );

      const remoteFilter = screen.getByRole('checkbox', { name: /remote/i });
      await user.click(remoteFilter);

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        'remote_type',
        'remote',
        true
      );
    });

    it('should show active filters', () => {
      const activeFilters = {
        remote_type: ['remote'],
        experience_level: ['senior'],
      };

      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
          activeFilters={activeFilters}
        />
      );

      expect(screen.getByTestId('active-filter-remote')).toBeInTheDocument();
      expect(screen.getByTestId('active-filter-senior')).toBeInTheDocument();
    });

    it('should allow clearing all filters', async () => {
      const mockOnClearFilters = jest.fn();
      const user = userEvent.setup();

      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
          activeFilters={{ remote_type: ['remote'] }}
          onClearFilters={mockOnClearFilters}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      expect(mockOnClearFilters).toHaveBeenCalled();
    });
  });

  describe('Sort options', () => {
    it('should display sort dropdown', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });

    it('should call onSortChange when sort option is selected', async () => {
      const mockOnSortChange = jest.fn();
      const user = userEvent.setup();

      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
          onSortChange={mockOnSortChange}
        />
      );

      const sortDropdown = screen.getByLabelText(/sort by/i);
      await user.selectOptions(sortDropdown, 'posted_at');

      expect(mockOnSortChange).toHaveBeenCalledWith('posted_at', 'desc');
    });

    it('should show current sort option as selected', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
          sortBy="salary_max"
          sortOrder="desc"
        />
      );

      const sortDropdown = screen.getByLabelText(/sort by/i) as HTMLSelectElement;
      expect(sortDropdown.value).toBe('salary_max');
    });
  });

  describe('Job actions', () => {
    it('should show save button for each job', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      expect(saveButtons).toHaveLength(2);
    });

    it('should call onSaveJob when save button is clicked', async () => {
      const mockOnSaveJob = jest.fn();
      const user = userEvent.setup();

      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
          onSaveJob={mockOnSaveJob}
        />
      );

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);

      expect(mockOnSaveJob).toHaveBeenCalledWith('1');
    });

    it('should show saved state for saved jobs', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      const savedButton = screen.getByRole('button', { name: /saved/i });
      expect(savedButton).toBeInTheDocument();
      expect(savedButton).toHaveClass('saved');
    });

    it('should navigate to job details when job card is clicked', async () => {
      const mockRouter = {
        push: jest.fn(),
      };

      const { useRouter } = require('next/navigation');
      useRouter.mockReturnValue(mockRouter);

      const user = userEvent.setup();
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      const jobCard = screen.getByTestId('job-card-1');
      await user.click(jobCard);

      expect(mockRouter.push).toHaveBeenCalledWith('/jobs/1');
    });
  });

  describe('View modes', () => {
    it('should support list view mode', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
          viewMode="list"
        />
      );

      const container = screen.getByTestId('results-container');
      expect(container).toHaveClass('list-view');
    });

    it('should support grid view mode', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
          viewMode="grid"
        />
      );

      const container = screen.getByTestId('results-container');
      expect(container).toHaveClass('grid-view');
    });

    it('should toggle between view modes', async () => {
      const mockOnViewModeChange = jest.fn();
      const user = userEvent.setup();

      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
          viewMode="list"
          onViewModeChange={mockOnViewModeChange}
        />
      );

      const gridViewButton = screen.getByRole('button', { name: /grid view/i });
      await user.click(gridViewButton);

      expect(mockOnViewModeChange).toHaveBeenCalledWith('grid');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      expect(screen.getByRole('region', { name: /search results/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /job listings/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      const firstJobCard = screen.getByTestId('job-card-1');
      firstJobCard.focus();

      expect(firstJobCard).toHaveFocus();

      await user.keyboard('{Tab}');
      // Next focusable element should receive focus
    });

    it('should announce result count to screen readers', () => {
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/2 jobs found/i);
    });
  });

  describe('Performance', () => {
    it('should render large result sets efficiently', () => {
      const manyJobs = Array(100).fill(null).map((_, i) => ({
        ...mockJobs[0],
        id: `${i}`,
        title: `Job ${i}`,
      }));

      const startTime = performance.now();
      render(
        <SearchResults
          jobs={manyJobs}
          pagination={{ ...mockPagination, total: 100 }}
          facets={mockFacets}
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
    });

    it('should use virtualization for long lists', () => {
      const manyJobs = Array(1000).fill(null).map((_, i) => ({
        ...mockJobs[0],
        id: `${i}`,
      }));

      render(
        <SearchResults
          jobs={manyJobs}
          pagination={{ ...mockPagination, total: 1000 }}
          facets={mockFacets}
          enableVirtualization={true}
        />
      );

      // Only visible items should be rendered
      const renderedItems = screen.getAllByTestId(/^job-card-/);
      expect(renderedItems.length).toBeLessThan(manyJobs.length);
    });
  });

  describe('Mobile responsiveness', () => {
    it('should show mobile filter toggle', () => {
      global.innerWidth = 375;
      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('should toggle filter sidebar on mobile', async () => {
      global.innerWidth = 375;
      const user = userEvent.setup();

      render(
        <SearchResults
          jobs={mockJobs}
          pagination={mockPagination}
          facets={mockFacets}
        />
      );

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const filterSidebar = screen.getByTestId('filter-sidebar');
      expect(filterSidebar).toHaveClass('open');
    });
  });
});

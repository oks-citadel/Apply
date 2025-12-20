import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchResults } from '../SearchResults';

describe('SearchResults', () => {
  const mockResults = [
    {
      id: '1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      salary: '$100,000 - $150,000',
    },
    {
      id: '2',
      title: 'Senior Software Engineer',
      company: 'Innovation Labs',
      location: 'New York, NY',
      salary: '$130,000 - $180,000',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render job results', () => {
    render(<SearchResults results={mockResults} />);

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
  });

  it('should display job details correctly', () => {
    render(<SearchResults results={mockResults} />);

    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('$100,000 - $150,000')).toBeInTheDocument();
  });

  it('should show total results count', () => {
    render(<SearchResults results={mockResults} />);

    expect(screen.getByText(/2 job\(s\) found/i)).toBeInTheDocument();
  });

  it('should render empty state when no results', () => {
    render(<SearchResults results={[]} />);

    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(<SearchResults isLoading={true} />);

    expect(screen.getByTestId('search-results-loading')).toBeInTheDocument();
  });

  it('should display error state', () => {
    render(<SearchResults error="Something went wrong" />);

    expect(screen.getByTestId('search-results-error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  describe('User Interactions', () => {
    it('should call onJobClick when job is clicked', () => {
      const onJobClick = jest.fn();
      render(<SearchResults results={mockResults} onJobClick={onJobClick} />);

      const firstJob = screen.getByText('Software Engineer');
      fireEvent.click(firstJob);

      expect(onJobClick).toHaveBeenCalledWith('1');
    });

    it('should handle undefined onJobClick', () => {
      render(<SearchResults results={mockResults} />);

      const firstJob = screen.getByText('Software Engineer');
      // Should not throw when clicking without handler
      expect(() => fireEvent.click(firstJob)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should render with default empty results', () => {
      render(<SearchResults />);

      expect(screen.getByTestId('search-results-empty')).toBeInTheDocument();
    });

    it('should not show salary when not provided', () => {
      const resultsWithoutSalary = [
        {
          id: '1',
          title: 'Developer',
          company: 'ABC Corp',
          location: 'Remote',
        },
      ];

      render(<SearchResults results={resultsWithoutSalary} />);

      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper testids for testing', () => {
      render(<SearchResults results={mockResults} />);

      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    it('should announce error to screen readers', () => {
      render(<SearchResults error="Error occurred" />);

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
    });
  });
});

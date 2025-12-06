import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JobMatchesTable } from '../JobMatchesTable';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronUp: () => <div data-testid="chevron-up" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronLeft: () => <div data-testid="chevron-left" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
}));

describe('JobMatchesTable', () => {
  const mockData = [
    {
      id: '1',
      company: 'TechCorp',
      position: 'Senior Software Engineer',
      matchScore: 95,
      status: 'interview' as const,
      dateApplied: '2024-01-15',
    },
    {
      id: '2',
      company: 'DataSystems',
      position: 'Data Scientist',
      matchScore: 88,
      status: 'applied' as const,
      dateApplied: '2024-01-14',
    },
    {
      id: '3',
      company: 'CloudWorks',
      position: 'DevOps Engineer',
      matchScore: 82,
      status: 'offer' as const,
      dateApplied: '2024-01-13',
    },
    {
      id: '4',
      company: 'StartupXYZ',
      position: 'Frontend Developer',
      matchScore: 75,
      status: 'pending' as const,
      dateApplied: '2024-01-12',
    },
    {
      id: '5',
      company: 'Enterprise Inc',
      position: 'Backend Developer',
      matchScore: 70,
      status: 'rejected' as const,
      dateApplied: '2024-01-11',
    },
  ];

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<JobMatchesTable data={mockData} />);
      expect(screen.getByText('Top Job Matches')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<JobMatchesTable data={mockData} />);

      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Position')).toBeInTheDocument();
      expect(screen.getByText('Match Score')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Date Applied')).toBeInTheDocument();
    });

    it('should render all job entries', () => {
      render(<JobMatchesTable data={mockData} />);

      expect(screen.getByText('TechCorp')).toBeInTheDocument();
      expect(screen.getByText('DataSystems')).toBeInTheDocument();
      expect(screen.getByText('CloudWorks')).toBeInTheDocument();
      expect(screen.getByText('StartupXYZ')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Inc')).toBeInTheDocument();
    });

    it('should render positions correctly', () => {
      render(<JobMatchesTable data={mockData} />);

      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Data Scientist')).toBeInTheDocument();
    });

    it('should render match scores with percentage', () => {
      render(<JobMatchesTable data={mockData} />);

      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('should render status badges', () => {
      render(<JobMatchesTable data={mockData} />);

      expect(screen.getByText('Interview')).toBeInTheDocument();
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Offer')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by match score in descending order by default', () => {
      render(<JobMatchesTable data={mockData} />);

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];

      expect(within(firstDataRow).getByText('TechCorp')).toBeInTheDocument();
    });

    it('should sort by company when company header is clicked', () => {
      render(<JobMatchesTable data={mockData} />);

      const companyHeader = screen.getByText('Company');
      fireEvent.click(companyHeader);

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];

      expect(within(firstDataRow).getByText('CloudWorks')).toBeInTheDocument();
    });

    it('should toggle sort direction on second click', () => {
      render(<JobMatchesTable data={mockData} />);

      const companyHeader = screen.getByText('Company');

      fireEvent.click(companyHeader);
      fireEvent.click(companyHeader);

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];

      expect(within(firstDataRow).getByText('TechCorp')).toBeInTheDocument();
    });

    it('should sort by match score', () => {
      render(<JobMatchesTable data={mockData} />);

      const scoreHeader = screen.getByText('Match Score');
      fireEvent.click(scoreHeader);

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];

      expect(within(firstDataRow).getByText('95%')).toBeInTheDocument();
    });

    it('should sort by date', () => {
      render(<JobMatchesTable data={mockData} />);

      const dateHeader = screen.getByText('Date Applied');
      fireEvent.click(dateHeader);

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];

      expect(within(firstDataRow).getByText('1/11/2024')).toBeInTheDocument();
    });

    it('should display sort indicator', () => {
      render(<JobMatchesTable data={mockData} />);

      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('should change sort indicator when direction changes', () => {
      render(<JobMatchesTable data={mockData} />);

      const scoreHeader = screen.getByText('Match Score');
      fireEvent.click(scoreHeader);

      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();

      fireEvent.click(scoreHeader);

      expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show only first page items by default', () => {
      render(<JobMatchesTable data={mockData} pageSize={3} />);

      expect(screen.getByText('TechCorp')).toBeInTheDocument();
      expect(screen.getByText('DataSystems')).toBeInTheDocument();
      expect(screen.getByText('CloudWorks')).toBeInTheDocument();
      expect(screen.queryByText('StartupXYZ')).not.toBeInTheDocument();
    });

    it('should display pagination controls when needed', () => {
      render(<JobMatchesTable data={mockData} pageSize={3} />);

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    });

    it('should navigate to next page', () => {
      render(<JobMatchesTable data={mockData} pageSize={3} />);

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
      expect(screen.getByText('StartupXYZ')).toBeInTheDocument();
      expect(screen.queryByText('TechCorp')).not.toBeInTheDocument();
    });

    it('should navigate to previous page', () => {
      render(<JobMatchesTable data={mockData} pageSize={3} />);

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      const prevButton = screen.getByLabelText('Previous page');
      fireEvent.click(prevButton);

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      render(<JobMatchesTable data={mockData} pageSize={3} />);

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(<JobMatchesTable data={mockData} pageSize={3} />);

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      expect(nextButton).toBeDisabled();
    });

    it('should not show pagination for small datasets', () => {
      render(<JobMatchesTable data={mockData.slice(0, 3)} pageSize={5} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
    });

    it('should maintain sort when paginating', () => {
      render(<JobMatchesTable data={mockData} pageSize={3} />);

      const companyHeader = screen.getByText('Company');
      fireEvent.click(companyHeader);

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });
  });

  describe('Match Score Visualization', () => {
    it('should render progress bars for match scores', () => {
      const { container } = render(<JobMatchesTable data={mockData} />);

      const progressBars = container.querySelectorAll('.bg-primary-600');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should set correct width for progress bars', () => {
      const { container } = render(<JobMatchesTable data={mockData} />);

      const progressBar = container.querySelector('[style*="95%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should apply correct colors to status badges', () => {
      const { container } = render(<JobMatchesTable data={mockData} />);

      expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-purple-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
    });

    it('should capitalize status text', () => {
      render(<JobMatchesTable data={mockData} />);

      expect(screen.getByText('Interview')).toBeInTheDocument();
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Offer')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      render(<JobMatchesTable data={mockData} />);

      expect(screen.getByText('1/15/2024')).toBeInTheDocument();
      expect(screen.getByText('1/14/2024')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading skeletons when isLoading is true', () => {
      render(<JobMatchesTable data={[]} isLoading={true} />);

      const skeletons = screen.getAllByRole('generic', { hidden: true });
      const animatedSkeletons = skeletons.filter((el) =>
        el.className.includes('animate-pulse'),
      );

      expect(animatedSkeletons.length).toBeGreaterThan(0);
    });

    it('should render title when loading', () => {
      render(<JobMatchesTable data={[]} isLoading={true} />);

      expect(screen.getByText('Top Job Matches')).toBeInTheDocument();
    });

    it('should not render table when loading', () => {
      render(<JobMatchesTable data={mockData} isLoading={true} />);

      expect(screen.queryByText('TechCorp')).not.toBeInTheDocument();
    });

    it('should render 5 skeleton rows by default', () => {
      const { container } = render(<JobMatchesTable data={[]} isLoading={true} />);

      const skeletons = container.querySelectorAll('.h-12.bg-gray-200');
      expect(skeletons.length).toBe(5);
    });
  });

  describe('Empty Data Handling', () => {
    it('should render table with empty data', () => {
      render(<JobMatchesTable data={[]} />);

      expect(screen.getByText('Top Job Matches')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
    });

    it('should not show pagination with no data', () => {
      render(<JobMatchesTable data={[]} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should highlight row on hover', () => {
      const { container } = render(<JobMatchesTable data={mockData} />);

      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0]).toHaveClass('hover:bg-gray-50');
    });

    it('should make headers clickable', () => {
      render(<JobMatchesTable data={mockData} />);

      const companyHeader = screen.getByText('Company');
      expect(companyHeader.parentElement).toHaveClass('cursor-pointer');
    });

    it('should apply hover effect to headers', () => {
      render(<JobMatchesTable data={mockData} />);

      const companyHeader = screen.getByText('Company');
      expect(companyHeader.parentElement).toHaveClass('hover:text-gray-900');
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(<JobMatchesTable data={mockData} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should have column headers', () => {
      render(<JobMatchesTable data={mockData} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(5);
    });

    it('should have accessible pagination buttons', () => {
      render(<JobMatchesTable data={mockData} pageSize={3} />);

      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    });

    it('should have proper aria attributes for disabled buttons', () => {
      render(<JobMatchesTable data={mockData} pageSize={3} />);

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toHaveAttribute('disabled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data entry', () => {
      const singleData = [mockData[0]];
      render(<JobMatchesTable data={singleData} />);

      expect(screen.getByText('TechCorp')).toBeInTheDocument();
      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('should handle 100% match score', () => {
      const perfectMatch = [
        {
          ...mockData[0],
          matchScore: 100,
        },
      ];

      render(<JobMatchesTable data={perfectMatch} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle 0% match score', () => {
      const zeroMatch = [
        {
          ...mockData[0],
          matchScore: 0,
        },
      ];

      render(<JobMatchesTable data={zeroMatch} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle very long company names', () => {
      const longNameData = [
        {
          ...mockData[0],
          company: 'Very Long Company Name That Should Still Display Correctly',
        },
      ];

      render(<JobMatchesTable data={longNameData} />);

      expect(
        screen.getByText('Very Long Company Name That Should Still Display Correctly'),
      ).toBeInTheDocument();
    });

    it('should handle very long position names', () => {
      const longPositionData = [
        {
          ...mockData[0],
          position:
            'Senior Principal Staff Software Architect Engineer Lead Manager Director',
        },
      ];

      render(<JobMatchesTable data={longPositionData} />);

      expect(
        screen.getByText(
          'Senior Principal Staff Software Architect Engineer Lead Manager Director',
        ),
      ).toBeInTheDocument();
    });

    it('should handle custom page sizes', () => {
      render(<JobMatchesTable data={mockData} pageSize={2} />);

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should handle sorting with duplicate values', () => {
      const duplicateData = [
        ...mockData,
        { ...mockData[0], id: '6' },
        { ...mockData[1], id: '7' },
      ];

      render(<JobMatchesTable data={duplicateData} />);

      const scoreHeader = screen.getByText('Match Score');
      fireEvent.click(scoreHeader);

      expect(screen.getByText('Top Job Matches')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have overflow handling', () => {
      const { container } = render(<JobMatchesTable data={mockData} />);

      const tableContainer = container.querySelector('.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
    });

    it('should render table with proper text sizing', () => {
      const { container } = render(<JobMatchesTable data={mockData} />);

      const table = container.querySelector('table');
      expect(table).toHaveClass('text-sm');
    });
  });

  describe('Re-rendering', () => {
    it('should update when data changes', () => {
      const { rerender } = render(<JobMatchesTable data={mockData} />);

      expect(screen.getByText('TechCorp')).toBeInTheDocument();

      const newData = [
        {
          id: '99',
          company: 'NewCompany',
          position: 'New Position',
          matchScore: 99,
          status: 'offer' as const,
          dateApplied: '2024-01-20',
        },
      ];

      rerender(<JobMatchesTable data={newData} />);

      expect(screen.getByText('NewCompany')).toBeInTheDocument();
      expect(screen.queryByText('TechCorp')).not.toBeInTheDocument();
    });

    it('should reset to first page when data changes', () => {
      const { rerender } = render(<JobMatchesTable data={mockData} pageSize={3} />);

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

      rerender(<JobMatchesTable data={mockData.slice(0, 2)} pageSize={3} />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });
  });
});

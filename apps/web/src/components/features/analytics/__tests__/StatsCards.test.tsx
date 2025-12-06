import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatsCards } from '../StatsCards';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowUp: () => <div data-testid="arrow-up" />,
  ArrowDown: () => <div data-testid="arrow-down" />,
  Briefcase: () => <div data-testid="briefcase-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Award: () => <div data-testid="award-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
}));

describe('StatsCards', () => {
  const mockStats = {
    totalApplications: 150,
    responseRate: 65.5,
    interviewRate: 45.2,
    offerCount: 12,
    applicationsTrend: 15.5,
    responseTrend: -5.2,
    interviewTrend: 8.3,
    offerTrend: 25.0,
  };

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<StatsCards stats={mockStats} />);
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
    });

    it('should render all four stat cards', () => {
      render(<StatsCards stats={mockStats} />);

      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('Response Rate')).toBeInTheDocument();
      expect(screen.getByText('Interview Rate')).toBeInTheDocument();
      expect(screen.getByText('Offers Received')).toBeInTheDocument();
    });

    it('should render correct icons for each card', () => {
      render(<StatsCards stats={mockStats} />);

      expect(screen.getByTestId('briefcase-icon')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();
      expect(screen.getByTestId('award-icon')).toBeInTheDocument();
    });

    it('should display stat values correctly', () => {
      render(<StatsCards stats={mockStats} />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('65.5%')).toBeInTheDocument();
      expect(screen.getByText('45.2%')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should use grid layout', () => {
      const { container } = render(<StatsCards stats={mockStats} />);
      const gridContainer = container.firstChild;

      expect(gridContainer).toHaveClass('grid');
    });
  });

  describe('Trend Indicators', () => {
    it('should show positive trend with arrow up', () => {
      render(<StatsCards stats={mockStats} />);

      const arrowUpIcons = screen.getAllByTestId('arrow-up');
      expect(arrowUpIcons.length).toBeGreaterThan(0);
    });

    it('should show negative trend with arrow down', () => {
      render(<StatsCards stats={mockStats} />);

      const arrowDownIcons = screen.getAllByTestId('arrow-down');
      expect(arrowDownIcons.length).toBeGreaterThan(0);
    });

    it('should display percentage changes', () => {
      render(<StatsCards stats={mockStats} />);

      expect(screen.getByText('15.5%')).toBeInTheDocument();
      expect(screen.getByText('5.2%')).toBeInTheDocument();
      expect(screen.getByText('8.3%')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should display trend labels', () => {
      render(<StatsCards stats={mockStats} />);

      const trendLabels = screen.getAllByText('vs last month');
      expect(trendLabels).toHaveLength(4);
    });

    it('should apply correct color classes for positive trends', () => {
      const { container } = render(<StatsCards stats={mockStats} />);

      const positiveElements = container.querySelectorAll('.text-green-600');
      expect(positiveElements.length).toBeGreaterThan(0);
    });

    it('should apply correct color classes for negative trends', () => {
      const { container } = render(<StatsCards stats={mockStats} />);

      const negativeElements = container.querySelectorAll('.text-red-600');
      expect(negativeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Loading State', () => {
    it('should render loading skeletons when isLoading is true', () => {
      render(<StatsCards stats={mockStats} isLoading={true} />);

      const skeletons = screen.getAllByRole('generic', { hidden: true });
      const animatedSkeletons = skeletons.filter((el) =>
        el.className.includes('animate-pulse'),
      );

      expect(animatedSkeletons.length).toBeGreaterThan(0);
    });

    it('should not display stat values when loading', () => {
      render(<StatsCards stats={mockStats} isLoading={true} />);

      expect(screen.queryByText('150')).not.toBeInTheDocument();
      expect(screen.queryByText('65.5%')).not.toBeInTheDocument();
    });

    it('should not display trend indicators when loading', () => {
      render(<StatsCards stats={mockStats} isLoading={true} />);

      expect(screen.queryByTestId('arrow-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('arrow-down')).not.toBeInTheDocument();
    });

    it('should render four loading cards', () => {
      const { container } = render(<StatsCards stats={mockStats} isLoading={true} />);

      const cards = container.querySelectorAll('[class*="Card"]');
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Data Handling', () => {
    it('should handle zero values', () => {
      const zeroStats = {
        totalApplications: 0,
        responseRate: 0,
        interviewRate: 0,
        offerCount: 0,
      };

      render(<StatsCards stats={zeroStats} />);

      const zeroTexts = screen.getAllByText('0');
      expect(zeroTexts.length).toBeGreaterThan(0);
    });

    it('should handle undefined trend values', () => {
      const noTrendStats = {
        totalApplications: 150,
        responseRate: 65.5,
        interviewRate: 45.2,
        offerCount: 12,
      };

      render(<StatsCards stats={noTrendStats} />);

      expect(screen.queryByTestId('arrow-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('arrow-down')).not.toBeInTheDocument();
    });

    it('should handle zero trend values', () => {
      const zeroTrendStats = {
        totalApplications: 150,
        responseRate: 65.5,
        interviewRate: 45.2,
        offerCount: 12,
        applicationsTrend: 0,
        responseTrend: 0,
        interviewTrend: 0,
        offerTrend: 0,
      };

      render(<StatsCards stats={zeroTrendStats} />);

      expect(screen.queryByTestId('arrow-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('arrow-down')).not.toBeInTheDocument();
    });

    it('should handle very large numbers', () => {
      const largeStats = {
        totalApplications: 999999,
        responseRate: 99.99,
        interviewRate: 88.88,
        offerCount: 9999,
      };

      render(<StatsCards stats={largeStats} />);

      expect(screen.getByText('999999')).toBeInTheDocument();
      expect(screen.getByText('9999')).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      const decimalStats = {
        totalApplications: 150.5,
        responseRate: 65.55,
        interviewRate: 45.25,
        offerCount: 12.7,
      };

      render(<StatsCards stats={decimalStats} />);

      expect(screen.getByText('150.5')).toBeInTheDocument();
      expect(screen.getByText('65.55%')).toBeInTheDocument();
    });
  });

  describe('Percentage Formatting', () => {
    it('should append % to rate values', () => {
      render(<StatsCards stats={mockStats} />);

      expect(screen.getByText('65.5%')).toBeInTheDocument();
      expect(screen.getByText('45.2%')).toBeInTheDocument();
    });

    it('should not append % to count values', () => {
      render(<StatsCards stats={mockStats} />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should show absolute values for negative trends', () => {
      render(<StatsCards stats={mockStats} />);

      expect(screen.getByText('5.2%')).toBeInTheDocument();
    });
  });

  describe('Card Layout', () => {
    it('should render cards in responsive grid', () => {
      const { container } = render(<StatsCards stats={mockStats} />);
      const gridContainer = container.firstChild;

      expect(gridContainer?.className).toContain('grid');
      expect(gridContainer?.className).toContain('grid-cols-1');
      expect(gridContainer?.className).toContain('sm:grid-cols-2');
      expect(gridContainer?.className).toContain('lg:grid-cols-4');
    });

    it('should have consistent spacing between cards', () => {
      const { container } = render(<StatsCards stats={mockStats} />);
      const gridContainer = container.firstChild;

      expect(gridContainer?.className).toContain('gap-4');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(<StatsCards stats={mockStats} />);

      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should have readable text labels', () => {
      render(<StatsCards stats={mockStats} />);

      expect(screen.getByText('Total Applications')).toBeVisible();
      expect(screen.getByText('Response Rate')).toBeVisible();
      expect(screen.getByText('Interview Rate')).toBeVisible();
      expect(screen.getByText('Offers Received')).toBeVisible();
    });

    it('should maintain readability with color coding', () => {
      const { container } = render(<StatsCards stats={mockStats} />);

      const greenText = container.querySelectorAll('.text-green-600');
      const redText = container.querySelectorAll('.text-red-600');

      expect(greenText.length + redText.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Styling', () => {
    it('should apply primary color to icon backgrounds', () => {
      const { container } = render(<StatsCards stats={mockStats} />);

      const iconContainers = container.querySelectorAll('.bg-primary-50');
      expect(iconContainers.length).toBe(4);
    });

    it('should apply consistent text styles', () => {
      const { container } = render(<StatsCards stats={mockStats} />);

      const titles = container.querySelectorAll('.text-sm');
      expect(titles.length).toBeGreaterThan(0);

      const values = container.querySelectorAll('.text-2xl');
      expect(values.length).toBeGreaterThan(0);
    });

    it('should have rounded corners on cards', () => {
      const { container } = render(<StatsCards stats={mockStats} />);

      const cards = container.querySelectorAll('[class*="rounded"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative values gracefully', () => {
      const negativeStats = {
        totalApplications: -10,
        responseRate: -5.5,
        interviewRate: -2.2,
        offerCount: -1,
      };

      render(<StatsCards stats={negativeStats} />);

      expect(screen.getByText('-10')).toBeInTheDocument();
    });

    it('should handle very small decimal values', () => {
      const smallStats = {
        totalApplications: 1,
        responseRate: 0.01,
        interviewRate: 0.001,
        offerCount: 0,
      };

      render(<StatsCards stats={smallStats} />);

      expect(screen.getByText('0.01%')).toBeInTheDocument();
    });

    it('should handle mixed positive and negative trends', () => {
      const mixedTrendStats = {
        totalApplications: 150,
        responseRate: 65.5,
        interviewRate: 45.2,
        offerCount: 12,
        applicationsTrend: 10,
        responseTrend: -5,
        interviewTrend: 0,
        offerTrend: 15,
      };

      render(<StatsCards stats={mixedTrendStats} />);

      expect(screen.getAllByTestId('arrow-up').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('arrow-down').length).toBeGreaterThan(0);
    });

    it('should handle 100% values', () => {
      const maxStats = {
        totalApplications: 100,
        responseRate: 100,
        interviewRate: 100,
        offerCount: 100,
      };

      render(<StatsCards stats={maxStats} />);

      const hundredPercents = screen.getAllByText('100%');
      expect(hundredPercents.length).toBe(2);
    });
  });

  describe('Re-rendering', () => {
    it('should update when stats change', () => {
      const { rerender } = render(<StatsCards stats={mockStats} />);

      expect(screen.getByText('150')).toBeInTheDocument();

      const newStats = {
        ...mockStats,
        totalApplications: 200,
      };

      rerender(<StatsCards stats={newStats} />);

      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.queryByText('150')).not.toBeInTheDocument();
    });

    it('should transition from loading to loaded state', () => {
      const { rerender } = render(<StatsCards stats={mockStats} isLoading={true} />);

      expect(screen.queryByText('150')).not.toBeInTheDocument();

      rerender(<StatsCards stats={mockStats} isLoading={false} />);

      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });
});

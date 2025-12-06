import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ApplicationsChart } from '../ApplicationsChart';

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ data, children }: { data: any[]; children: React.ReactNode }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  BarChart: ({ data, children }: { data: any[]; children: React.ReactNode }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, name }: { dataKey: string; stroke: string; name: string }) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} data-name={name} />
  ),
  Bar: ({ dataKey, fill, name }: { dataKey: string; fill: string; name: string }) => (
    <div data-testid={`bar-${dataKey}`} data-fill={fill} data-name={name} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('ApplicationsChart', () => {
  const mockData = [
    { date: '2024-01-01', applications: 10, interviews: 5, offers: 2 },
    { date: '2024-01-02', applications: 15, interviews: 7, offers: 3 },
    { date: '2024-01-03', applications: 12, interviews: 6, offers: 2 },
    { date: '2024-01-04', applications: 20, interviews: 10, offers: 5 },
    { date: '2024-01-05', applications: 18, interviews: 9, offers: 4 },
  ];

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ApplicationsChart data={mockData} />);
      expect(screen.getByText('Application Trends')).toBeInTheDocument();
    });

    it('should display chart title', () => {
      render(<ApplicationsChart data={mockData} />);
      expect(screen.getByText('Application Trends')).toBeInTheDocument();
    });

    it('should render line chart by default', () => {
      render(<ApplicationsChart data={mockData} />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('should render chart controls', () => {
      render(<ApplicationsChart data={mockData} />);
      expect(screen.getByRole('button', { name: /line/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bar/i })).toBeInTheDocument();
    });

    it('should render all chart components', () => {
      render(<ApplicationsChart data={mockData} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });
  });

  describe('Chart Type Switching', () => {
    it('should switch to bar chart when bar button is clicked', () => {
      render(<ApplicationsChart data={mockData} />);

      const barButton = screen.getByRole('button', { name: /bar/i });
      fireEvent.click(barButton);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('should switch back to line chart when line button is clicked', () => {
      render(<ApplicationsChart data={mockData} />);

      const barButton = screen.getByRole('button', { name: /bar/i });
      fireEvent.click(barButton);

      const lineButton = screen.getByRole('button', { name: /line/i });
      fireEvent.click(lineButton);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('should highlight active chart type button', () => {
      render(<ApplicationsChart data={mockData} />);

      const lineButton = screen.getByRole('button', { name: /line/i });
      const barButton = screen.getByRole('button', { name: /bar/i });

      expect(lineButton).toHaveAttribute('aria-pressed', 'true');
      expect(barButton).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(barButton);

      expect(lineButton).toHaveAttribute('aria-pressed', 'false');
      expect(barButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Data Rendering', () => {
    it('should render line chart with all data series', () => {
      render(<ApplicationsChart data={mockData} />);

      expect(screen.getByTestId('line-applications')).toBeInTheDocument();
      expect(screen.getByTestId('line-interviews')).toBeInTheDocument();
      expect(screen.getByTestId('line-offers')).toBeInTheDocument();
    });

    it('should render bar chart with all data series', () => {
      render(<ApplicationsChart data={mockData} />);

      const barButton = screen.getByRole('button', { name: /bar/i });
      fireEvent.click(barButton);

      expect(screen.getByTestId('bar-applications')).toBeInTheDocument();
      expect(screen.getByTestId('bar-interviews')).toBeInTheDocument();
      expect(screen.getByTestId('bar-offers')).toBeInTheDocument();
    });

    it('should pass correct data to chart component', () => {
      render(<ApplicationsChart data={mockData} />);

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toEqual(mockData);
    });

    it('should apply correct colors to lines', () => {
      render(<ApplicationsChart data={mockData} />);

      const applicationsLine = screen.getByTestId('line-applications');
      const interviewsLine = screen.getByTestId('line-interviews');
      const offersLine = screen.getByTestId('line-offers');

      expect(applicationsLine).toHaveAttribute('data-stroke', '#3b82f6');
      expect(interviewsLine).toHaveAttribute('data-stroke', '#10b981');
      expect(offersLine).toHaveAttribute('data-stroke', '#8b5cf6');
    });

    it('should apply correct colors to bars', () => {
      render(<ApplicationsChart data={mockData} />);

      const barButton = screen.getByRole('button', { name: /bar/i });
      fireEvent.click(barButton);

      const applicationsBar = screen.getByTestId('bar-applications');
      const interviewsBar = screen.getByTestId('bar-interviews');
      const offersBar = screen.getByTestId('bar-offers');

      expect(applicationsBar).toHaveAttribute('data-fill', '#3b82f6');
      expect(interviewsBar).toHaveAttribute('data-fill', '#10b981');
      expect(offersBar).toHaveAttribute('data-fill', '#8b5cf6');
    });

    it('should display correct legend names', () => {
      render(<ApplicationsChart data={mockData} />);

      const applicationsLine = screen.getByTestId('line-applications');
      const interviewsLine = screen.getByTestId('line-interviews');
      const offersLine = screen.getByTestId('line-offers');

      expect(applicationsLine).toHaveAttribute('data-name', 'Applications');
      expect(interviewsLine).toHaveAttribute('data-name', 'Interviews');
      expect(offersLine).toHaveAttribute('data-name', 'Offers');
    });
  });

  describe('Loading State', () => {
    it('should render loading skeleton when isLoading is true', () => {
      render(<ApplicationsChart data={[]} isLoading={true} />);

      expect(screen.getByText('Application Trends')).toBeInTheDocument();
      const skeleton = screen.getByRole('generic', { hidden: true });
      expect(skeleton.className).toContain('animate-pulse');
    });

    it('should not render chart when loading', () => {
      render(<ApplicationsChart data={mockData} isLoading={true} />);

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('should not render chart controls when loading', () => {
      render(<ApplicationsChart data={mockData} isLoading={true} />);

      expect(screen.queryByRole('button', { name: /line/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /bar/i })).not.toBeInTheDocument();
    });
  });

  describe('Empty Data Handling', () => {
    it('should render chart with empty data array', () => {
      render(<ApplicationsChart data={[]} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const singleData = [
        { date: '2024-01-01', applications: 10, interviews: 5, offers: 2 },
      ];

      render(<ApplicationsChart data={singleData} />);

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(1);
    });

    it('should handle data with zero values', () => {
      const zeroData = [
        { date: '2024-01-01', applications: 0, interviews: 0, offers: 0 },
      ];

      render(<ApplicationsChart data={zeroData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<ApplicationsChart data={mockData} />);

      const lineButton = screen.getByRole('button', { name: /line/i });
      const barButton = screen.getByRole('button', { name: /bar/i });

      expect(lineButton).toBeInTheDocument();
      expect(barButton).toBeInTheDocument();
    });

    it('should have proper aria-pressed attributes', () => {
      render(<ApplicationsChart data={mockData} />);

      const lineButton = screen.getByRole('button', { name: /line/i });
      const barButton = screen.getByRole('button', { name: /bar/i });

      expect(lineButton).toHaveAttribute('aria-pressed');
      expect(barButton).toHaveAttribute('aria-pressed');
    });

    it('should update aria-pressed when switching charts', () => {
      render(<ApplicationsChart data={mockData} />);

      const barButton = screen.getByRole('button', { name: /bar/i });

      expect(barButton).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(barButton);

      expect(barButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Responsive Behavior', () => {
    it('should render responsive container', () => {
      render(<ApplicationsChart data={mockData} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should maintain chart type when data updates', () => {
      const { rerender } = render(<ApplicationsChart data={mockData} />);

      const barButton = screen.getByRole('button', { name: /bar/i });
      fireEvent.click(barButton);

      const newData = [
        { date: '2024-01-06', applications: 25, interviews: 12, offers: 6 },
      ];

      rerender(<ApplicationsChart data={newData} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const largeData = [
        { date: '2024-01-01', applications: 1000000, interviews: 500000, offers: 200000 },
      ];

      render(<ApplicationsChart data={largeData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      const decimalData = [
        { date: '2024-01-01', applications: 10.5, interviews: 5.2, offers: 2.7 },
      ];

      render(<ApplicationsChart data={decimalData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      const negativeData = [
        { date: '2024-01-01', applications: -10, interviews: -5, offers: -2 },
      ];

      render(<ApplicationsChart data={negativeData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle missing data keys', () => {
      const incompleteData = [
        { date: '2024-01-01', applications: 10 },
      ];

      render(<ApplicationsChart data={incompleteData as any} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});

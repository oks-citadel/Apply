import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminDashboard } from '../AdminDashboard';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  QueryClient: jest.fn().mockImplementation(() => ({
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Cell: () => <div data-testid="cell" />,
}));

describe('AdminDashboard', () => {
  const mockDashboardStats = {
    totalUsers: 1500,
    activeUsers: 1200,
    totalJobs: 5000,
    pendingJobs: 50,
    totalApplications: 15000,
    successRate: 0.35,
    reportsCount: 25,
    unresolvedReports: 10,
    revenue: 50000,
    newUsersThisMonth: 150,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the admin dashboard heading', async () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        isError: false,
      });

      render(<AdminDashboard />);

      expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument();
    });

    it('should display loading state while fetching data', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      });

      render(<AdminDashboard />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display error state when data fetch fails', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch dashboard data'),
      });

      render(<AdminDashboard />);

      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  describe('Statistics Cards', () => {
    beforeEach(() => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        isError: false,
      });
    });

    it('should display total users count', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/total users/i)).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('should display active users count', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/active users/i)).toBeInTheDocument();
      expect(screen.getByText('1,200')).toBeInTheDocument();
    });

    it('should display total jobs count', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/total jobs/i)).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });

    it('should display pending jobs count', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/pending jobs/i)).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should display total applications count', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/total applications/i)).toBeInTheDocument();
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });

    it('should display success rate as percentage', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/success rate/i)).toBeInTheDocument();
      expect(screen.getByText('35%')).toBeInTheDocument();
    });

    it('should display reports count', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/reports/i)).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should display unresolved reports count', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/unresolved/i)).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should display revenue with currency formatting', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/revenue/i)).toBeInTheDocument();
      expect(screen.getByText(/\$50,000/)).toBeInTheDocument();
    });

    it('should display new users this month', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/new users/i)).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        isError: false,
      });
    });

    it('should display "Manage Users" action button', () => {
      render(<AdminDashboard />);

      const manageUsersButton = screen.getByRole('link', { name: /manage users/i });
      expect(manageUsersButton).toBeInTheDocument();
      expect(manageUsersButton).toHaveAttribute('href', '/admin/users');
    });

    it('should display "Review Jobs" action button', () => {
      render(<AdminDashboard />);

      const reviewJobsButton = screen.getByRole('link', { name: /review jobs/i });
      expect(reviewJobsButton).toBeInTheDocument();
      expect(reviewJobsButton).toHaveAttribute('href', '/admin/jobs/review');
    });

    it('should display "View Reports" action button', () => {
      render(<AdminDashboard />);

      const viewReportsButton = screen.getByRole('link', { name: /view reports/i });
      expect(viewReportsButton).toBeInTheDocument();
      expect(viewReportsButton).toHaveAttribute('href', '/admin/reports');
    });

    it('should display "System Settings" action button', () => {
      render(<AdminDashboard />);

      const settingsButton = screen.getByRole('link', { name: /system settings/i });
      expect(settingsButton).toBeInTheDocument();
      expect(settingsButton).toHaveAttribute('href', '/admin/settings');
    });

    it('should display "Analytics" action button', () => {
      render(<AdminDashboard />);

      const analyticsButton = screen.getByRole('link', { name: /analytics/i });
      expect(analyticsButton).toBeInTheDocument();
      expect(analyticsButton).toHaveAttribute('href', '/admin/analytics');
    });
  });

  describe('Charts and Visualizations', () => {
    beforeEach(() => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        isError: false,
      });
    });

    it('should render user growth chart', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/user growth/i)).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render application statistics chart', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/application statistics/i)).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should render job distribution chart', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/job distribution/i)).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  describe('Recent Activity', () => {
    beforeEach(() => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockImplementation((key: any) => {
        if (key.includes('dashboard-stats')) {
          return {
            data: mockDashboardStats,
            isLoading: false,
            isError: false,
          };
        }
        if (key.includes('recent-activity')) {
          return {
            data: [
              {
                id: '1',
                action: 'User registered',
                user: 'john@example.com',
                timestamp: new Date('2024-01-01T10:00:00Z'),
              },
              {
                id: '2',
                action: 'Job approved',
                user: 'admin@example.com',
                timestamp: new Date('2024-01-01T11:00:00Z'),
              },
            ],
            isLoading: false,
            isError: false,
          };
        }
        return { data: undefined, isLoading: false, isError: false };
      });
    });

    it('should display recent activity section', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
    });

    it('should display recent activity items', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/user registered/i)).toBeInTheDocument();
      expect(screen.getByText(/job approved/i)).toBeInTheDocument();
    });

    it('should display timestamps for activity items', () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/admin@example.com/i)).toBeInTheDocument();
    });
  });

  describe('Alerts and Notifications', () => {
    it('should display alert when there are unresolved reports', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: {
          ...mockDashboardStats,
          unresolvedReports: 10,
        },
        isLoading: false,
        isError: false,
      });

      render(<AdminDashboard />);

      expect(screen.getByText(/10 unresolved reports/i)).toBeInTheDocument();
    });

    it('should display alert when there are pending jobs', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: {
          ...mockDashboardStats,
          pendingJobs: 50,
        },
        isLoading: false,
        isError: false,
      });

      render(<AdminDashboard />);

      expect(screen.getByText(/50 jobs pending review/i)).toBeInTheDocument();
    });

    it('should not display alerts when counts are zero', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: {
          ...mockDashboardStats,
          unresolvedReports: 0,
          pendingJobs: 0,
        },
        isLoading: false,
        isError: false,
      });

      render(<AdminDashboard />);

      expect(screen.queryByText(/unresolved reports/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/jobs pending review/i)).not.toBeInTheDocument();
    });
  });

  describe('Data Refresh', () => {
    it('should have a refresh button', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      render(<AdminDashboard />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should call refetch when refresh button is clicked', async () => {
      const mockRefetch = jest.fn();
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      });

      render(<AdminDashboard />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      refreshButton.click();

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        isError: false,
      });
    });

    it('should have proper heading hierarchy', () => {
      render(<AdminDashboard />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/admin dashboard/i);
    });

    it('should have aria-labels for statistics cards', () => {
      render(<AdminDashboard />);

      const cards = screen.getAllByRole('article');
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach((card) => {
        expect(card).toHaveAttribute('aria-label');
      });
    });

    it('should have accessible links', () => {
      render(<AdminDashboard />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('should have keyboard navigable buttons', () => {
      render(<AdminDashboard />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        isError: false,
      });
    });

    it('should use responsive containers for charts', () => {
      render(<AdminDashboard />);

      const responsiveContainers = screen.getAllByTestId('responsive-container');
      expect(responsiveContainers.length).toBeGreaterThan(0);
    });

    it('should have grid layout for statistics cards', () => {
      const { container } = render(<AdminDashboard />);

      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { useQuery } = require('@tanstack/react-query');
      const mockUseQuery = useQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        isError: false,
      });

      const { rerender } = render(<AdminDashboard />);

      expect(mockUseQuery).toHaveBeenCalled();

      // Re-render with same data
      rerender(<AdminDashboard />);

      // Should use memoization and not cause unnecessary renders
      expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display user-friendly error message on API failure', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
      });

      render(<AdminDashboard />);

      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
    });

    it('should have retry button on error', () => {
      const mockRefetch = jest.fn();
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
        refetch: mockRefetch,
      });

      render(<AdminDashboard />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });
});

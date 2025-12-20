import React from 'react';
import { render, screen, waitFor } from '@/test/test-utils';
import DashboardPage from '../page';
import { useDashboardStats } from '@/hooks/useUser';
import { useApplications } from '@/hooks/useApplications';
import { useJobs } from '@/hooks/useJobs';

// Mock the hooks
jest.mock('@/hooks/useUser');
jest.mock('@/hooks/useApplications');
jest.mock('@/hooks/useJobs');

const mockUseDashboardStats = useDashboardStats as jest.MockedFunction<typeof useDashboardStats>;
const mockUseApplications = useApplications as jest.MockedFunction<typeof useApplications>;
const mockUseJobs = useJobs as jest.MockedFunction<typeof useJobs>;

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading indicators when data is loading', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      mockUseApplications.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      mockUseJobs.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      render(<DashboardPage />);

      // Stats should show loading state
      expect(screen.getByText('Total Resumes')).toBeInTheDocument();
      expect(screen.getAllByText('...').length).toBeGreaterThan(0);

      // Activity sections should show loading spinners
      const spinners = screen.getAllByTestId('loader-icon');
      expect(spinners.length).toBeGreaterThanOrEqual(2); // At least 2: applications and jobs
    });
  });

  describe('Stats Display', () => {
    it('renders dashboard stats correctly', async () => {
      mockUseDashboardStats.mockReturnValue({
        data: {
          totalResumes: 5,
          jobsSaved: 12,
          applicationsSent: 23,
          responseRate: 42,
        },
        isLoading: false,
        isSuccess: true,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Total Resumes
        expect(screen.getByText('12')).toBeInTheDocument(); // Jobs Saved
        expect(screen.getByText('23')).toBeInTheDocument(); // Applications Sent
        expect(screen.getByText('42%')).toBeInTheDocument(); // Response Rate
      });
    });

    it('handles missing stats data with fallback', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        isSuccess: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      // Should show default values
      const zeroValues = screen.getAllByText('0');
      expect(zeroValues.length).toBeGreaterThanOrEqual(3); // At least 3 stats should be 0
      expect(screen.getByText('0%')).toBeInTheDocument(); // Response Rate
    });
  });

  describe('Page Structure', () => {
    it('renders main heading and description', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Welcome back!/)).toBeInTheDocument();
    });

    it('renders all stat cards', () => {
      mockUseDashboardStats.mockReturnValue({
        data: {
          totalResumes: 1,
          jobsSaved: 2,
          applicationsSent: 3,
          responseRate: 50,
        },
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('Total Resumes')).toBeInTheDocument();
      expect(screen.getByText('Jobs Saved')).toBeInTheDocument();
      expect(screen.getByText('Applications Sent')).toBeInTheDocument();
      expect(screen.getByText('Response Rate')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('renders all quick action buttons', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Create Resume')).toBeInTheDocument();
      expect(screen.getByText('Search Jobs')).toBeInTheDocument();
      expect(screen.getByText('View Applications')).toBeInTheDocument();
    });

    it('quick action buttons have correct links', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      const { container } = render(<DashboardPage />);

      const links = container.querySelectorAll('a');
      const hrefs = Array.from(links).map(link => link.getAttribute('href'));

      expect(hrefs).toContain('/resumes');
      expect(hrefs).toContain('/jobs');
      expect(hrefs).toContain('/applications');
    });
  });

  describe('Recent Applications', () => {
    it('renders recent applications when available', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: {
          applications: [
            {
              id: '1',
              jobTitle: 'Senior Developer',
              company: 'TechCorp',
              status: 'Applied',
              appliedAt: new Date().toISOString(),
            },
            {
              id: '2',
              jobTitle: 'Frontend Engineer',
              company: 'StartupXYZ',
              status: 'Under Review',
              appliedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            },
          ],
        },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('Recent Applications')).toBeInTheDocument();
      expect(screen.getByText('Senior Developer')).toBeInTheDocument();
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
      expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
      expect(screen.getByText('StartupXYZ')).toBeInTheDocument();
    });

    it('shows empty state when no applications', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('No applications yet')).toBeInTheDocument();
      expect(screen.getByText('Start applying to jobs')).toBeInTheDocument();
    });

    it('displays application status badges', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: {
          applications: [
            {
              id: '1',
              jobTitle: 'Developer',
              company: 'Company',
              status: 'Interview Scheduled',
              appliedAt: new Date().toISOString(),
            },
          ],
        },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();
    });
  });

  describe('Recommended Jobs', () => {
    it('renders recommended jobs when available', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: {
          jobs: [
            {
              id: '1',
              title: 'Full Stack Developer',
              company: 'TechCorp',
              location: 'Remote',
              salary: { min: 100000, max: 150000, currency: 'USD', period: 'yearly' },
            },
            {
              id: '2',
              title: 'Backend Engineer',
              company: 'DataCo',
              location: 'New York, NY',
              salary: { min: 120000, max: 160000, currency: 'USD', period: 'yearly' },
            },
          ],
        },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('Recommended Jobs')).toBeInTheDocument();
      expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
      expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
      expect(screen.getByText('DataCo')).toBeInTheDocument();
    });

    it('shows empty state when no recommended jobs', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('No job recommendations yet')).toBeInTheDocument();
      expect(screen.getByText('Browse all jobs')).toBeInTheDocument();
    });

    it('formats salary correctly', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: {
          jobs: [
            {
              id: '1',
              title: 'Developer',
              company: 'Company',
              location: 'Remote',
              salary: { min: 80000, max: 120000, currency: 'USD', period: 'yearly' },
            },
          ],
        },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('$80k - $120k')).toBeInTheDocument();
    });

    it('shows competitive when no salary info', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: {
          jobs: [
            {
              id: '1',
              title: 'Developer',
              company: 'Company',
              location: 'Remote',
            },
          ],
        },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('Competitive')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats today correctly', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: {
          applications: [
            {
              id: '1',
              jobTitle: 'Developer',
              company: 'Company',
              status: 'Applied',
              appliedAt: new Date().toISOString(),
            },
          ],
        },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('formats yesterday correctly', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockUseApplications.mockReturnValue({
        data: {
          applications: [
            {
              id: '1',
              jobTitle: 'Developer',
              company: 'Company',
              status: 'Applied',
              appliedAt: yesterday.toISOString(),
            },
          ],
        },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('handles errors in stats gracefully', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load stats'),
      } as any);

      mockUseApplications.mockReturnValue({
        data: { applications: [] },
        isLoading: false,
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      // Should show fallback values instead of crashing
      expect(screen.getByText('Total Resumes')).toBeInTheDocument();
    });

    it('handles errors in applications gracefully', () => {
      mockUseDashboardStats.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      mockUseApplications.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load applications'),
      } as any);

      mockUseJobs.mockReturnValue({
        data: { jobs: [] },
        isLoading: false,
      } as any);

      render(<DashboardPage />);

      // Should show empty state instead of crashing
      expect(screen.getByText('No applications yet')).toBeInTheDocument();
    });
  });
});

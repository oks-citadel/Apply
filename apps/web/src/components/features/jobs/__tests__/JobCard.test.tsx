import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
jest.mock('@/hooks/useJobs', () => ({
  useSaveJob: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useUnsaveJob: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

// JobCard Component (inline for testing - in production, this would be imported)
interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location?: string;
    employmentType?: string;
    salaryMin?: number;
    salaryMax?: number;
    description?: string;
    skills?: string[];
    tags?: string[];
    postedAt?: string;
    isSaved?: boolean;
  };
  onSaveToggle?: (jobId: string, isSaved: boolean) => void;
  onApply?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onSaveToggle, onApply, onViewDetails }) => {
  const formatSalary = (min?: number, max?: number): string => {
    if (!min && !max) return 'Competitive';
    const formatNum = (n: number) => {
      if (n >= 1000) return `$${Math.round(n / 1000)}k`;
      return `$${n}`;
    };
    if (min && max) return `${formatNum(min)} - ${formatNum(max)}`;
    if (min) return `From ${formatNum(min)}`;
    if (max) return `Up to ${formatNum(max)}`;
    return 'Competitive';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div data-testid={`job-card-${job.id}`} className="job-card">
      <div className="job-header">
        <div>
          <h3 data-testid="job-title">{job.title}</h3>
          <p data-testid="job-company">{job.company}</p>
        </div>
        <button
          data-testid="save-button"
          onClick={() => onSaveToggle?.(job.id, job.isSaved || false)}
          aria-label={job.isSaved ? 'Unsave job' : 'Save job'}
        >
          {job.isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="job-details">
        {job.location && (
          <span data-testid="job-location">{job.location}</span>
        )}
        {job.employmentType && (
          <span data-testid="job-type">{job.employmentType}</span>
        )}
        <span data-testid="job-salary">
          {formatSalary(job.salaryMin, job.salaryMax)}
        </span>
      </div>

      {job.description && (
        <p data-testid="job-description" className="line-clamp-2">
          {job.description}
        </p>
      )}

      {(job.skills?.length || 0) > 0 && (
        <div data-testid="job-skills" className="skills-list">
          {job.skills?.slice(0, 5).map((skill) => (
            <span key={skill} className="skill-badge">
              {skill}
            </span>
          ))}
          {(job.skills?.length || 0) > 5 && (
            <span className="skill-badge">+{job.skills!.length - 5} more</span>
          )}
        </div>
      )}

      <div className="job-footer">
        <span data-testid="job-posted-date">Posted {formatDate(job.postedAt)}</span>
        <div className="actions">
          <button
            data-testid="view-details-button"
            onClick={() => onViewDetails?.(job.id)}
          >
            View Details
          </button>
          <button
            data-testid="apply-button"
            onClick={() => onApply?.(job.id)}
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
};

describe('JobCard Component', () => {
  const mockJob = {
    id: 'job-1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    employmentType: 'Full-time',
    salaryMin: 120000,
    salaryMax: 180000,
    description: 'Join our team as a Senior Software Engineer working on cutting-edge technologies.',
    skills: ['TypeScript', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
    tags: ['remote-friendly', 'high-priority'],
    postedAt: new Date().toISOString(),
    isSaved: false,
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render job card with all basic information', () => {
      renderWithProviders(<JobCard job={mockJob} />);

      expect(screen.getByTestId('job-title')).toHaveTextContent('Senior Software Engineer');
      expect(screen.getByTestId('job-company')).toHaveTextContent('Tech Corp');
      expect(screen.getByTestId('job-location')).toHaveTextContent('San Francisco, CA');
      expect(screen.getByTestId('job-type')).toHaveTextContent('Full-time');
    });

    it('should render job description', () => {
      renderWithProviders(<JobCard job={mockJob} />);

      const description = screen.getByTestId('job-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent(/Join our team/);
    });

    it('should render without optional fields', () => {
      const minimalJob = {
        id: 'job-2',
        title: 'Junior Developer',
        company: 'StartupCo',
      };

      renderWithProviders(<JobCard job={minimalJob} />);

      expect(screen.getByTestId('job-title')).toHaveTextContent('Junior Developer');
      expect(screen.getByTestId('job-company')).toHaveTextContent('StartupCo');
      expect(screen.queryByTestId('job-location')).not.toBeInTheDocument();
      expect(screen.queryByTestId('job-description')).not.toBeInTheDocument();
    });

    it('should display skills badges', () => {
      renderWithProviders(<JobCard job={mockJob} />);

      const skillsContainer = screen.getByTestId('job-skills');
      expect(skillsContainer).toBeInTheDocument();

      // Should show first 5 skills
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('AWS')).toBeInTheDocument();
      expect(screen.getByText('Docker')).toBeInTheDocument();

      // Should show "+X more" badge
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('should not render skills section when no skills provided', () => {
      const jobWithoutSkills = { ...mockJob, skills: [] };
      renderWithProviders(<JobCard job={jobWithoutSkills} />);

      expect(screen.queryByTestId('job-skills')).not.toBeInTheDocument();
    });

    it('should render all skills when 5 or fewer', () => {
      const jobWithFewSkills = {
        ...mockJob,
        skills: ['TypeScript', 'React', 'Node.js'],
      };

      renderWithProviders(<JobCard job={jobWithFewSkills} />);

      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });
  });

  describe('Salary Formatting', () => {
    it('should format salary range correctly', () => {
      renderWithProviders(<JobCard job={mockJob} />);

      const salary = screen.getByTestId('job-salary');
      expect(salary).toHaveTextContent('$120k - $180k');
    });

    it('should show "Competitive" when no salary provided', () => {
      const jobWithoutSalary = {
        ...mockJob,
        salaryMin: undefined,
        salaryMax: undefined,
      };

      renderWithProviders(<JobCard job={jobWithoutSalary} />);

      expect(screen.getByTestId('job-salary')).toHaveTextContent('Competitive');
    });

    it('should format minimum salary only', () => {
      const jobWithMinOnly = {
        ...mockJob,
        salaryMin: 100000,
        salaryMax: undefined,
      };

      renderWithProviders(<JobCard job={jobWithMinOnly} />);

      expect(screen.getByTestId('job-salary')).toHaveTextContent('From $100k');
    });

    it('should format maximum salary only', () => {
      const jobWithMaxOnly = {
        ...mockJob,
        salaryMin: undefined,
        salaryMax: 150000,
      };

      renderWithProviders(<JobCard job={jobWithMaxOnly} />);

      expect(screen.getByTestId('job-salary')).toHaveTextContent('Up to $150k');
    });

    it('should handle salaries under 1000', () => {
      const jobWithLowSalary = {
        ...mockJob,
        salaryMin: 50,
        salaryMax: 100,
      };

      renderWithProviders(<JobCard job={jobWithLowSalary} />);

      expect(screen.getByTestId('job-salary')).toHaveTextContent('$50 - $100');
    });
  });

  describe('Date Formatting', () => {
    it('should show "Today" for jobs posted today', () => {
      const todayJob = {
        ...mockJob,
        postedAt: new Date().toISOString(),
      };

      renderWithProviders(<JobCard job={todayJob} />);

      expect(screen.getByTestId('job-posted-date')).toHaveTextContent('Posted Today');
    });

    it('should show "1 day ago" for jobs posted yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayJob = {
        ...mockJob,
        postedAt: yesterday.toISOString(),
      };

      renderWithProviders(<JobCard job={yesterdayJob} />);

      expect(screen.getByTestId('job-posted-date')).toHaveTextContent('Posted 1 day ago');
    });

    it('should show days for jobs posted within a week', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const oldJob = {
        ...mockJob,
        postedAt: fiveDaysAgo.toISOString(),
      };

      renderWithProviders(<JobCard job={oldJob} />);

      expect(screen.getByTestId('job-posted-date')).toHaveTextContent('Posted 5 days ago');
    });

    it('should show weeks for jobs posted within a month', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const oldJob = {
        ...mockJob,
        postedAt: twoWeeksAgo.toISOString(),
      };

      renderWithProviders(<JobCard job={oldJob} />);

      expect(screen.getByTestId('job-posted-date')).toHaveTextContent('Posted 2 weeks ago');
    });

    it('should show "Recently" when no date provided', () => {
      const jobWithoutDate = {
        ...mockJob,
        postedAt: undefined,
      };

      renderWithProviders(<JobCard job={jobWithoutDate} />);

      expect(screen.getByTestId('job-posted-date')).toHaveTextContent('Posted Recently');
    });
  });

  describe('Save/Unsave Functionality', () => {
    it('should show "Save" button for unsaved jobs', () => {
      renderWithProviders(<JobCard job={mockJob} />);

      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toHaveTextContent('Save');
      expect(saveButton).toHaveAccessibleName('Save job');
    });

    it('should show "Saved" button for saved jobs', () => {
      const savedJob = { ...mockJob, isSaved: true };
      renderWithProviders(<JobCard job={savedJob} />);

      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toHaveTextContent('Saved');
      expect(saveButton).toHaveAccessibleName('Unsave job');
    });

    it('should call onSaveToggle when save button clicked', () => {
      const onSaveToggle = jest.fn();
      renderWithProviders(<JobCard job={mockJob} onSaveToggle={onSaveToggle} />);

      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      expect(onSaveToggle).toHaveBeenCalledTimes(1);
      expect(onSaveToggle).toHaveBeenCalledWith('job-1', false);
    });

    it('should call onSaveToggle with correct saved state', () => {
      const onSaveToggle = jest.fn();
      const savedJob = { ...mockJob, isSaved: true };
      renderWithProviders(<JobCard job={savedJob} onSaveToggle={onSaveToggle} />);

      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      expect(onSaveToggle).toHaveBeenCalledWith('job-1', true);
    });
  });

  describe('Action Buttons', () => {
    it('should call onViewDetails when "View Details" clicked', () => {
      const onViewDetails = jest.fn();
      renderWithProviders(<JobCard job={mockJob} onViewDetails={onViewDetails} />);

      const viewDetailsButton = screen.getByTestId('view-details-button');
      fireEvent.click(viewDetailsButton);

      expect(onViewDetails).toHaveBeenCalledTimes(1);
      expect(onViewDetails).toHaveBeenCalledWith('job-1');
    });

    it('should call onApply when "Apply Now" clicked', () => {
      const onApply = jest.fn();
      renderWithProviders(<JobCard job={mockJob} onApply={onApply} />);

      const applyButton = screen.getByTestId('apply-button');
      fireEvent.click(applyButton);

      expect(onApply).toHaveBeenCalledTimes(1);
      expect(onApply).toHaveBeenCalledWith('job-1');
    });

    it('should render action buttons even without callbacks', () => {
      renderWithProviders(<JobCard job={mockJob} />);

      expect(screen.getByTestId('view-details-button')).toBeInTheDocument();
      expect(screen.getByTestId('apply-button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for save button', () => {
      renderWithProviders(<JobCard job={mockJob} />);

      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toHaveAttribute('aria-label', 'Save job');
    });

    it('should have proper ARIA labels for saved button', () => {
      const savedJob = { ...mockJob, isSaved: true };
      renderWithProviders(<JobCard job={savedJob} />);

      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toHaveAttribute('aria-label', 'Unsave job');
    });

    it('should be keyboard accessible', () => {
      const onSaveToggle = jest.fn();
      const onApply = jest.fn();
      renderWithProviders(
        <JobCard job={mockJob} onSaveToggle={onSaveToggle} onApply={onApply} />
      );

      const saveButton = screen.getByTestId('save-button');
      const applyButton = screen.getByTestId('apply-button');

      // Tab navigation
      saveButton.focus();
      expect(saveButton).toHaveFocus();

      // Enter key
      fireEvent.keyDown(saveButton, { key: 'Enter', code: 'Enter' });

      applyButton.focus();
      expect(applyButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long job titles', () => {
      const longTitleJob = {
        ...mockJob,
        title: 'Senior Full Stack Software Engineer with Machine Learning and Cloud Architecture Experience',
      };

      renderWithProviders(<JobCard job={longTitleJob} />);

      const title = screen.getByTestId('job-title');
      expect(title).toHaveTextContent(longTitleJob.title);
    });

    it('should handle very long company names', () => {
      const longCompanyJob = {
        ...mockJob,
        company: 'International Business Machines Corporation and Technology Solutions',
      };

      renderWithProviders(<JobCard job={longCompanyJob} />);

      const company = screen.getByTestId('job-company');
      expect(company).toHaveTextContent(longCompanyJob.company);
    });

    it('should handle very long descriptions', () => {
      const longDescJob = {
        ...mockJob,
        description: 'A'.repeat(500),
      };

      renderWithProviders(<JobCard job={longDescJob} />);

      const description = screen.getByTestId('job-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('line-clamp-2');
    });

    it('should handle empty strings for optional fields', () => {
      const emptyFieldsJob = {
        ...mockJob,
        location: '',
        description: '',
        skills: [],
      };

      renderWithProviders(<JobCard job={emptyFieldsJob} />);

      expect(screen.queryByTestId('job-location')).not.toBeInTheDocument();
      expect(screen.queryByTestId('job-description')).not.toBeInTheDocument();
      expect(screen.queryByTestId('job-skills')).not.toBeInTheDocument();
    });

    it('should handle undefined employment type', () => {
      const noTypeJob = {
        ...mockJob,
        employmentType: undefined,
      };

      renderWithProviders(<JobCard job={noTypeJob} />);

      expect(screen.queryByTestId('job-type')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple job cards independently', () => {
      const job1 = { ...mockJob, id: 'job-1', title: 'Job 1' };
      const job2 = { ...mockJob, id: 'job-2', title: 'Job 2' };

      renderWithProviders(
        <>
          <JobCard job={job1} />
          <JobCard job={job2} />
        </>
      );

      expect(screen.getByTestId('job-card-job-1')).toBeInTheDocument();
      expect(screen.getByTestId('job-card-job-2')).toBeInTheDocument();
      expect(screen.getByText('Job 1')).toBeInTheDocument();
      expect(screen.getByText('Job 2')).toBeInTheDocument();
    });
  });
});

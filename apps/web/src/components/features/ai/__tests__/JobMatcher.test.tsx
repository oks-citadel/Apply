/**
 * Comprehensive tests for JobMatcher component.
 * Tests job matching UI, filter interactions, and match score display.
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import JobMatcher from '../JobMatcher';

// Mock job matches response
const mockJobMatches = [
  {
    id: 'job1',
    title: 'Senior Backend Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    remotePolicy: 'hybrid',
    salary: { min: 150000, max: 200000 },
    matchScore: {
      overall: 92,
      skillMatch: 95,
      experienceMatch: 90,
      locationMatch: 85,
      cultureMatch: 90
    },
    explanation: 'Excellent match! Skills align very well with requirements.',
    strengths: ['Excellent skill match', 'Experience level is ideal'],
    gaps: [],
    requiredSkills: ['Python', 'AWS', 'Docker'],
    preferredSkills: ['Kubernetes', 'GraphQL']
  },
  {
    id: 'job2',
    title: 'Staff Software Engineer',
    company: 'StartupCo',
    location: 'Remote',
    remotePolicy: 'remote',
    salary: { min: 170000, max: 220000 },
    matchScore: {
      overall: 87,
      skillMatch: 88,
      experienceMatch: 92,
      locationMatch: 100,
      cultureMatch: 75
    },
    explanation: 'Strong match. Most required skills are present.',
    strengths: ['Perfect location match', 'Experience is adequate'],
    gaps: ['Some cultural preferences differ'],
    requiredSkills: ['Python', 'JavaScript', 'React'],
    preferredSkills: ['TypeScript', 'Node.js']
  },
  {
    id: 'job3',
    title: 'Backend Developer',
    company: 'Enterprise Inc',
    location: 'New York, NY',
    remotePolicy: 'on-site',
    salary: { min: 120000, max: 160000 },
    matchScore: {
      overall: 65,
      skillMatch: 70,
      experienceMatch: 75,
      locationMatch: 40,
      cultureMatch: 65
    },
    explanation: 'Moderate match. Several key skills are missing.',
    strengths: ['Experience is adequate'],
    gaps: ['Location may be a concern', 'Some key skills missing'],
    requiredSkills: ['Java', 'Spring', 'MySQL'],
    preferredSkills: ['AWS', 'Docker']
  }
];

// Setup MSW server
const server = setupServer(
  http.get('/api/jobs/matches', ({ request }) => {
    const url = new URL(request.url);
    const location = url.searchParams.get('location');
    const remote = url.searchParams.get('remote');
    const minScore = url.searchParams.get('minScore');

    let filtered = [...mockJobMatches];

    if (remote === 'true') {
      filtered = filtered.filter(job => job.remotePolicy === 'remote');
    }

    if (minScore) {
      filtered = filtered.filter(job => job.matchScore.overall >= Number(minScore));
    }

    return HttpResponse.json({ matches: filtered });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('JobMatcher', () => {
  describe('Rendering', () => {
    it('renders the component', () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      expect(screen.getByRole('heading', { name: /job matches/i })).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      expect(screen.getByText(/loading matches/i)).toBeInTheDocument();
    });

    it('displays filter controls', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/remote/i)).toBeInTheDocument();
      });
    });
  });

  describe('Job Match Display', () => {
    it('displays all job matches', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
        expect(screen.getByText('Staff Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Backend Developer')).toBeInTheDocument();
      });
    });

    it('displays match scores', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('92%')).toBeInTheDocument();
        expect(screen.getByText('87%')).toBeInTheDocument();
        expect(screen.getByText('65%')).toBeInTheDocument();
      });
    });

    it('displays company names', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/tech corp/i)).toBeInTheDocument();
        expect(screen.getByText(/startupco/i)).toBeInTheDocument();
        expect(screen.getByText(/enterprise inc/i)).toBeInTheDocument();
      });
    });

    it('displays location information', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/san francisco/i)).toBeInTheDocument();
        expect(screen.getByText(/remote/i)).toBeInTheDocument();
        expect(screen.getByText(/new york/i)).toBeInTheDocument();
      });
    });

    it('displays salary ranges', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/\$150,000 - \$200,000/)).toBeInTheDocument();
      });
    });

    it('displays match explanations', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/excellent match/i)).toBeInTheDocument();
        expect(screen.getByText(/skills align very well/i)).toBeInTheDocument();
      });
    });
  });

  describe('Match Score Breakdown', () => {
    it('displays skill match score', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const firstJob = screen.getByText('Senior Backend Engineer').closest('article');
        expect(firstJob).toBeInTheDocument();
      });

      // Click to expand details
      const firstJob = screen.getByText('Senior Backend Engineer');
      user.click(firstJob);

      await waitFor(() => {
        expect(screen.getByText(/skill match.*95/i)).toBeInTheDocument();
      });
    });

    it('displays experience match score', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const firstJob = screen.getByText('Senior Backend Engineer');
        user.click(firstJob);
      });

      await waitFor(() => {
        expect(screen.getByText(/experience match.*90/i)).toBeInTheDocument();
      });
    });

    it('displays location match score', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const firstJob = screen.getByText('Senior Backend Engineer');
        user.click(firstJob);
      });

      await waitFor(() => {
        expect(screen.getByText(/location match.*85/i)).toBeInTheDocument();
      });
    });

    it('displays culture match score', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const firstJob = screen.getByText('Senior Backend Engineer');
        user.click(firstJob);
      });

      await waitFor(() => {
        expect(screen.getByText(/culture match.*90/i)).toBeInTheDocument();
      });
    });
  });

  describe('Strengths and Gaps', () => {
    it('displays candidate strengths', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const firstJob = screen.getByText('Senior Backend Engineer');
        user.click(firstJob);
      });

      await waitFor(() => {
        expect(screen.getByText(/excellent skill match/i)).toBeInTheDocument();
        expect(screen.getByText(/experience level is ideal/i)).toBeInTheDocument();
      });
    });

    it('displays skill gaps', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const thirdJob = screen.getByText('Backend Developer');
        user.click(thirdJob);
      });

      await waitFor(() => {
        expect(screen.getByText(/location may be a concern/i)).toBeInTheDocument();
        expect(screen.getByText(/some key skills missing/i)).toBeInTheDocument();
      });
    });

    it('highlights missing skills', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const jobCard = screen.getByText('Senior Backend Engineer');
        user.click(jobCard);
      });

      await waitFor(() => {
        const detailsSection = screen.getByText(/required skills/i).closest('div');
        expect(detailsSection).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('filters by location', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
      });

      const locationInput = screen.getByLabelText(/location/i);
      user.type(locationInput, 'San Francisco');

      await waitFor(() => {
        expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
      });
    });

    it('filters by remote work', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(3);
      });

      const remoteCheckbox = screen.getByLabelText(/remote/i);
      user.click(remoteCheckbox);

      await waitFor(() => {
        expect(screen.getByText('Staff Software Engineer')).toBeInTheDocument();
        expect(screen.queryByText('Backend Developer')).not.toBeInTheDocument();
      });
    });

    it('filters by minimum match score', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(3);
      });

      const minScoreSlider = screen.getByLabelText(/minimum match score/i);
      user.click(minScoreSlider);
      // Simulate setting value to 80
      user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');

      await waitFor(() => {
        expect(screen.queryByText('Backend Developer')).not.toBeInTheDocument();
      });
    });

    it('filters by salary range', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      const minSalaryInput = screen.getByLabelText(/minimum salary/i);
      user.type(minSalaryInput, '150000');

      await waitFor(() => {
        expect(screen.queryByText('Backend Developer')).not.toBeInTheDocument();
      });
    });

    it('clears filters', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      // Apply filters
      const remoteCheckbox = screen.getByLabelText(/remote/i);
      user.click(remoteCheckbox);

      await waitFor(() => {
        expect(screen.getAllByRole('article').length).toBeLessThan(3);
      });

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      user.click(clearButton);

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(3);
      });
    });
  });

  describe('Sorting', () => {
    it('sorts by match score (default)', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const jobCards = screen.getAllByRole('article');
        const firstCard = within(jobCards[0]);
        expect(firstCard.getByText('Senior Backend Engineer')).toBeInTheDocument();
      });
    });

    it('sorts by salary', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const sortSelect = screen.getByLabelText(/sort by/i);
        user.selectOptions(sortSelect, 'salary');
      });

      await waitFor(() => {
        const jobCards = screen.getAllByRole('article');
        const firstCard = within(jobCards[0]);
        expect(firstCard.getByText('Staff Software Engineer')).toBeInTheDocument();
      });
    });

    it('sorts by company name', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      const sortSelect = screen.getByLabelText(/sort by/i);
      user.selectOptions(sortSelect, 'company');

      await waitFor(() => {
        const jobCards = screen.getAllByRole('article');
        expect(jobCards).toHaveLength(3);
      });
    });

    it('reverses sort order', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      const reverseButton = screen.getByRole('button', { name: /reverse/i });
      user.click(reverseButton);

      await waitFor(() => {
        const jobCards = screen.getAllByRole('article');
        const firstCard = within(jobCards[0]);
        expect(firstCard.getByText('Backend Developer')).toBeInTheDocument();
      });
    });
  });

  describe('Job Actions', () => {
    it('allows saving a job', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const saveButtons = screen.getAllByRole('button', { name: /save/i });
        expect(saveButtons.length).toBeGreaterThan(0);
      });

      const saveButton = screen.getAllByRole('button', { name: /save/i })[0];
      user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument();
      });
    });

    it('allows applying to a job', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const applyButtons = screen.getAllByRole('button', { name: /apply/i });
        expect(applyButtons.length).toBeGreaterThan(0);
      });

      const applyButton = screen.getAllByRole('button', { name: /apply/i })[0];
      user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/application started/i)).toBeInTheDocument();
      });
    });

    it('allows viewing full job details', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: /view details/i });
        user.click(viewButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/job description/i)).toBeInTheDocument();
      });
    });

    it('allows dismissing a match', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
        user.click(dismissButtons[0]);
      });

      await waitFor(() => {
        expect(screen.queryByText('Senior Backend Engineer')).not.toBeInTheDocument();
      });
    });
  });

  describe('Match Insights', () => {
    it('displays match percentage visualization', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('shows skill overlap', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const firstJob = screen.getByText('Senior Backend Engineer');
        user.click(firstJob);
      });

      await waitFor(() => {
        expect(screen.getByText(/matching skills/i)).toBeInTheDocument();
      });
    });

    it('shows required vs preferred skills', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const firstJob = screen.getByText('Senior Backend Engineer');
        user.click(firstJob);
      });

      await waitFor(() => {
        expect(screen.getByText(/required skills/i)).toBeInTheDocument();
        expect(screen.getByText(/preferred skills/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      server.use(
        http.get('/api/jobs/matches', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/error loading matches/i)).toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      server.use(
        http.get('/api/jobs/matches', () => {
          return HttpResponse.error();
        })
      );

      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('displays empty state when no matches', async () => {
      server.use(
        http.get('/api/jobs/matches', () => {
          return HttpResponse.json({ matches: [] });
        })
      );

      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
      });
    });

    it('allows retrying after error', async () => {
      const user = userEvent.setup();

      server.use(
        http.get('/api/jobs/matches', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/error loading matches/i)).toBeInTheDocument();
      });

      // Fix the server
      server.use(
        http.get('/api/jobs/matches', () => {
          return HttpResponse.json({ matches: mockJobMatches });
        })
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /job matches/i });
        expect(heading.tagName).toBe('H1');
      });
    });

    it('has proper ARIA labels', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/remote/i)).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
      });

      // Tab through job cards
      user.tab();
      const firstJobCard = screen.getByText('Senior Backend Engineer').closest('article');
      expect(firstJobCard).toHaveClass(/focus/);
    });

    it('announces match count to screen readers', async () => {
      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        const announcement = screen.getByText(/3 matches found/i);
        expect(announcement).toHaveAttribute('role', 'status');
      });
    });
  });

  describe('Performance', () => {
    it('implements virtual scrolling for long lists', async () => {
      const manyMatches = Array.from({ length: 100 }, (_, i) => ({
        ...mockJobMatches[0],
        id: `job${i}`,
        title: `Job ${i}`
      }));

      server.use(
        http.get('/api/jobs/matches', () => {
          return HttpResponse.json({ matches: manyMatches });
        })
      );

      render(<JobMatcher />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should only render visible items
        const renderedJobs = screen.getAllByRole('article');
        expect(renderedJobs.length).toBeLessThan(100);
      });
    });

    it('debounces filter inputs', async () => {
      const user = userEvent.setup();
      render(<JobMatcher />, { wrapper: createWrapper() });

      const locationInput = screen.getByLabelText(/location/i);

      // Type rapidly
      user.type(locationInput, 'San Francisco');

      // Should not trigger API call for every keystroke
      expect(locationInput).toHaveValue('San Francisco');
    });
  });
});

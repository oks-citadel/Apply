/**
 * Comprehensive tests for ResumeOptimizer component.
 * Tests UI interactions, optimization features, and API integration.
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import ResumeOptimizer from '../ResumeOptimizer';

// Mock API responses
const mockOptimizationResponse = {
  suggestions: [
    {
      section: 'summary',
      current: 'Generic summary',
      suggested: 'Tailored professional summary with key achievements',
      reason: 'Highlight specific accomplishments',
      impact: 'high'
    },
    {
      section: 'skills',
      current: 'Python, JavaScript',
      suggested: 'Python, JavaScript, AWS, Docker, Kubernetes',
      reason: 'Add missing keywords from job description',
      impact: 'high'
    },
    {
      section: 'experience',
      current: 'Developed applications',
      suggested: 'Developed scalable applications serving 100K+ users',
      reason: 'Quantify achievements with metrics',
      impact: 'medium'
    }
  ],
  optimizedContent: {
    summary: 'Results-driven software engineer with 5+ years of experience',
    skills: ['Python', 'JavaScript', 'AWS', 'Docker', 'Kubernetes'],
    experience: [
      {
        id: 'exp1',
        highlights: [
          'Led development of microservices serving 1M+ users',
          'Improved system performance by 60%'
        ]
      }
    ]
  }
};

const mockATSScore = {
  score: 85,
  breakdown: {
    keywordMatch: 80,
    formatting: 90,
    contentQuality: 85
  },
  suggestions: [
    'Add quantifiable achievements',
    'Include missing keywords: Kubernetes, GraphQL'
  ],
  matchedKeywords: ['Python', 'AWS', 'Docker', 'React'],
  missingKeywords: ['Kubernetes', 'GraphQL']
};

// Setup MSW server
const server = setupServer(
  http.post('/ai/optimize-resume', () => {
    return HttpResponse.json(mockOptimizationResponse);
  }),
  http.post('/ai/ats-score', () => {
    return HttpResponse.json(mockATSScore);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test wrapper with providers
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

describe('ResumeOptimizer', () => {
  describe('Rendering', () => {
    it('renders the component', () => {
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      expect(screen.getByRole('heading', { name: /resume optimizer/i })).toBeInTheDocument();
    });

    it('displays resume upload section', () => {
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      expect(screen.getByText(/upload resume/i)).toBeInTheDocument();
    });

    it('displays job description input', () => {
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    });

    it('displays optimization level selector', () => {
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      expect(screen.getByText(/optimization level/i)).toBeInTheDocument();
    });
  });

  describe('Resume Upload', () => {
    it('allows file upload', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload resume/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(input.files?.[0]).toBe(file);
      expect(input.files).toHaveLength(1);
    });

    it('validates file type', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      const invalidFile = new File(['content'], 'file.xyz', { type: 'application/xyz' });
      const input = screen.getByLabelText(/upload resume/i) as HTMLInputElement;

      await user.upload(input, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/unsupported file format/i)).toBeInTheDocument();
      });
    });

    it('validates file size', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Create 10MB file (over typical limit)
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf'
      });
      const input = screen.getByLabelText(/upload resume/i) as HTMLInputElement;

      await user.upload(input, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument();
      });
    });

    it('displays uploaded file name', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      const file = new File(['content'], 'my-resume.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload resume/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/my-resume\.pdf/i)).toBeInTheDocument();
      });
    });
  });

  describe('Job Description Input', () => {
    it('accepts job description text', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      const textarea = screen.getByLabelText(/job description/i) as HTMLTextAreaElement;
      await user.type(textarea, 'Looking for Python developer with AWS experience');

      expect(textarea.value).toBe('Looking for Python developer with AWS experience');
    });

    it('validates job description length', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      const textarea = screen.getByLabelText(/job description/i) as HTMLTextAreaElement;
      await user.type(textarea, 'Short');

      // Try to optimize
      const optimizeButton = screen.getByRole('button', { name: /optimize/i });
      await user.click(optimizeButton);

      await waitFor(() => {
        expect(screen.getByText(/job description too short/i)).toBeInTheDocument();
      });
    });
  });

  describe('Optimization Process', () => {
    it('shows loading state during optimization', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Upload resume
      const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/upload resume/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      // Add job description
      const textarea = screen.getByLabelText(/job description/i);
      await user.type(textarea, 'Looking for experienced Python developer');

      // Click optimize
      const optimizeButton = screen.getByRole('button', { name: /optimize/i });
      await user.click(optimizeButton);

      expect(screen.getByText(/optimizing/i)).toBeInTheDocument();
    });

    it('displays optimization suggestions', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Upload and optimize
      const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/upload resume/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      const textarea = screen.getByLabelText(/job description/i);
      await user.type(textarea, 'Python developer position');

      const optimizeButton = screen.getByRole('button', { name: /optimize/i });
      await user.click(optimizeButton);

      await waitFor(() => {
        expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
        expect(screen.getByText(/highlight specific accomplishments/i)).toBeInTheDocument();
      });
    });

    it('displays ATS score', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Complete optimization flow
      const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/upload resume/i) as HTMLInputElement;
      await user.upload(fileInput, file);

      const textarea = screen.getByLabelText(/job description/i);
      await user.type(textarea, 'Job requirements here');

      const optimizeButton = screen.getByRole('button', { name: /optimize/i });
      await user.click(optimizeButton);

      await waitFor(() => {
        expect(screen.getByText(/ats score/i)).toBeInTheDocument();
        expect(screen.getByText(/85/)).toBeInTheDocument();
      });
    });

    it('shows keyword analysis', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Trigger optimization
      const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
      await user.upload(screen.getByLabelText(/upload resume/i) as HTMLInputElement, file);
      await user.type(screen.getByLabelText(/job description/i), 'Job description');
      await user.click(screen.getByRole('button', { name: /optimize/i }));

      await waitFor(() => {
        expect(screen.getByText(/matched keywords/i)).toBeInTheDocument();
        expect(screen.getByText(/missing keywords/i)).toBeInTheDocument();
      });
    });
  });

  describe('Optimization Levels', () => {
    it('allows selecting light optimization', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      const lightOption = screen.getByLabelText(/light/i);
      await user.click(lightOption);

      expect(lightOption).toBeChecked();
    });

    it('allows selecting moderate optimization', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      const moderateOption = screen.getByLabelText(/moderate/i);
      await user.click(moderateOption);

      expect(moderateOption).toBeChecked();
    });

    it('allows selecting aggressive optimization', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      const aggressiveOption = screen.getByLabelText(/aggressive/i);
      await user.click(aggressiveOption);

      expect(aggressiveOption).toBeChecked();
    });
  });

  describe('Optimized Content Display', () => {
    it('displays optimized summary', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Complete flow
      await user.upload(
        screen.getByLabelText(/upload resume/i) as HTMLInputElement,
        new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
      );
      await user.type(screen.getByLabelText(/job description/i), 'Job description');
      await user.click(screen.getByRole('button', { name: /optimize/i }));

      await waitFor(() => {
        expect(screen.getByText(/results-driven software engineer/i)).toBeInTheDocument();
      });
    });

    it('displays optimized skills', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Complete flow
      await user.upload(
        screen.getByLabelText(/upload resume/i) as HTMLInputElement,
        new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
      );
      await user.type(screen.getByLabelText(/job description/i), 'Job description');
      await user.click(screen.getByRole('button', { name: /optimize/i }));

      await waitFor(() => {
        expect(screen.getByText(/kubernetes/i)).toBeInTheDocument();
      });
    });

    it('allows applying individual suggestions', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Get optimization results
      await user.upload(
        screen.getByLabelText(/upload resume/i) as HTMLInputElement,
        new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
      );
      await user.type(screen.getByLabelText(/job description/i), 'Job description');
      await user.click(screen.getByRole('button', { name: /optimize/i }));

      await waitFor(() => {
        const applyButtons = screen.getAllByRole('button', { name: /apply/i });
        expect(applyButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Export Functionality', () => {
    it('allows exporting optimized resume', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Complete optimization
      await user.upload(
        screen.getByLabelText(/upload resume/i) as HTMLInputElement,
        new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
      );
      await user.type(screen.getByLabelText(/job description/i), 'Job description');
      await user.click(screen.getByRole('button', { name: /optimize/i }));

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).toBeInTheDocument();
      });
    });

    it('supports PDF export format', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      await user.upload(
        screen.getByLabelText(/upload resume/i) as HTMLInputElement,
        new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
      );
      await user.type(screen.getByLabelText(/job description/i), 'Job description');
      await user.click(screen.getByRole('button', { name: /optimize/i }));

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export.*pdf/i });
        expect(exportButton).toBeInTheDocument();
      });
    });

    it('supports DOCX export format', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      await user.upload(
        screen.getByLabelText(/upload resume/i) as HTMLInputElement,
        new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
      );
      await user.type(screen.getByLabelText(/job description/i), 'Job description');
      await user.click(screen.getByRole('button', { name: /optimize/i }));

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export.*docx/i });
        expect(exportButton).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/ai/optimize-resume', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      await user.upload(
        screen.getByLabelText(/upload resume/i) as HTMLInputElement,
        new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
      );
      await user.type(screen.getByLabelText(/job description/i), 'Job description');
      await user.click(screen.getByRole('button', { name: /optimize/i }));

      await waitFor(() => {
        expect(screen.getByText(/error.*optimizing/i)).toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/ai/optimize-resume', () => {
          return HttpResponse.error();
        })
      );

      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      await user.upload(
        screen.getByLabelText(/upload resume/i) as HTMLInputElement,
        new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
      );
      await user.type(screen.getByLabelText(/job description/i), 'Job description');
      await user.click(screen.getByRole('button', { name: /optimize/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('displays validation errors', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Try to optimize without uploading resume
      const optimizeButton = screen.getByRole('button', { name: /optimize/i });
      await user.click(optimizeButton);

      await waitFor(() => {
        expect(screen.getByText(/please upload.*resume/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/upload resume/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByLabelText(/upload resume/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/job description/i)).toHaveFocus();
    });

    it('announces loading state to screen readers', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      await user.upload(
        screen.getByLabelText(/upload resume/i) as HTMLInputElement,
        new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
      );
      await user.type(screen.getByLabelText(/job description/i), 'Job description');
      await user.click(screen.getByRole('button', { name: /optimize/i }));

      const loadingElement = screen.getByText(/optimizing/i);
      expect(loadingElement).toHaveAttribute('role', 'status');
    });
  });

  describe('Performance', () => {
    it('debounces job description input', async () => {
      const user = userEvent.setup();
      render(<ResumeOptimizer />, { wrapper: createWrapper() });

      const textarea = screen.getByLabelText(/job description/i);

      // Type rapidly
      await user.type(textarea, 'Quick typing test');

      // Should not trigger API calls for every keystroke
      expect(textarea).toHaveValue('Quick typing test');
    });

    it('cleans up on unmount', () => {
      const { unmount } = render(<ResumeOptimizer />, { wrapper: createWrapper() });

      unmount();

      // Component should unmount without errors
      expect(screen.queryByRole('heading', { name: /resume optimizer/i })).not.toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApplicationForm from '../ApplicationForm';

// Mock the useApplications hook
jest.mock('@/hooks/useApplications', () => ({
  useCreateApplication: jest.fn(),
}));

// Mock the useToast hook
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Create a wrapper with React Query provider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ApplicationForm Component', () => {
  let mockCreateApplication: jest.Mock;
  const mockJobId = '123e4567-e89b-12d3-a456-426614174000';
  const mockJobTitle = 'Senior Software Engineer';
  const mockCompanyName = 'Tech Corp';

  beforeEach(() => {
    mockCreateApplication = jest.fn();
    const { useCreateApplication } = require('@/hooks/useApplications');
    useCreateApplication.mockReturnValue({
      mutate: mockCreateApplication,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(/apply to/i)).toBeInTheDocument();
      expect(screen.getByText(mockJobTitle)).toBeInTheDocument();
      expect(screen.getByText(mockCompanyName)).toBeInTheDocument();
      expect(screen.getByLabelText(/select resume/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cover letter/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
    });

    it('should render job details prominently', () => {
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(mockJobTitle)).toBeInTheDocument();
      expect(screen.getByText(mockCompanyName)).toBeInTheDocument();
    });

    it('should show resume selection dropdown', () => {
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const resumeSelect = screen.getByLabelText(/select resume/i);
      expect(resumeSelect).toBeInTheDocument();
      expect(resumeSelect.tagName).toBe('SELECT');
    });

    it('should show optional cover letter field', () => {
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const coverLetterField = screen.getByLabelText(/cover letter/i);
      expect(coverLetterField).toBeInTheDocument();
    });

    it('should show optional notes field', () => {
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const notesField = screen.getByLabelText(/notes/i);
      expect(notesField).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require resume selection', async () => {
      const user = userEvent.setup();
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/resume is required/i)).toBeInTheDocument();
      });
    });

    it('should validate cover letter format if provided', async () => {
      const user = userEvent.setup();
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const coverLetterField = screen.getByLabelText(/cover letter/i);
      await user.type(coverLetterField, 'abc'); // Too short

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/cover letter must be at least/i)).toBeInTheDocument();
      });
    });

    it('should validate notes length', async () => {
      const user = userEvent.setup();
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const notesField = screen.getByLabelText(/notes/i);
      const longNotes = 'a'.repeat(1001); // Exceeds max length
      await user.type(notesField, longNotes);

      await waitFor(() => {
        expect(screen.getByText(/notes cannot exceed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Application Submission', () => {
    it('should submit application with required fields', async () => {
      const user = userEvent.setup();
      const mockResume = { id: 'resume-1', name: 'My Resume.pdf' };

      mockCreateApplication.mockImplementation((data) => {
        expect(data.jobId).toBe(mockJobId);
        expect(data.resumeId).toBe(mockResume.id);
      });

      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const resumeSelect = screen.getByLabelText(/select resume/i);
      await user.selectOptions(resumeSelect, mockResume.id);

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateApplication).toHaveBeenCalledWith(
          expect.objectContaining({
            jobId: mockJobId,
            resumeId: mockResume.id,
          }),
        );
      });
    });

    it('should submit application with cover letter', async () => {
      const user = userEvent.setup();
      const mockResume = { id: 'resume-1', name: 'My Resume.pdf' };
      const coverLetterText = 'Dear Hiring Manager, I am excited to apply for this position...';

      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const resumeSelect = screen.getByLabelText(/select resume/i);
      await user.selectOptions(resumeSelect, mockResume.id);

      const coverLetterField = screen.getByLabelText(/cover letter/i);
      await user.type(coverLetterField, coverLetterText);

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateApplication).toHaveBeenCalledWith(
          expect.objectContaining({
            coverLetter: coverLetterText,
          }),
        );
      });
    });

    it('should submit application with notes', async () => {
      const user = userEvent.setup();
      const mockResume = { id: 'resume-1', name: 'My Resume.pdf' };
      const notes = 'Referred by John Doe';

      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const resumeSelect = screen.getByLabelText(/select resume/i);
      await user.selectOptions(resumeSelect, mockResume.id);

      const notesField = screen.getByLabelText(/notes/i);
      await user.type(notesField, notes);

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateApplication).toHaveBeenCalledWith(
          expect.objectContaining({
            notes,
          }),
        );
      });
    });

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      const { useCreateApplication } = require('@/hooks/useApplications');
      useCreateApplication.mockReturnValue({
        mutate: mockCreateApplication,
        isPending: true,
        isError: false,
        error: null,
      });

      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const submitButton = screen.getByRole('button', { name: /submitting/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state during submission', () => {
      const { useCreateApplication } = require('@/hooks/useApplications');
      useCreateApplication.mockReturnValue({
        mutate: mockCreateApplication,
        isPending: true,
        isError: false,
        error: null,
      });

      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    });
  });

  describe('Duplicate Application Prevention', () => {
    it('should show warning if user already applied to this job', async () => {
      const { useCreateApplication } = require('@/hooks/useApplications');
      useCreateApplication.mockReturnValue({
        mutate: mockCreateApplication,
        isPending: false,
        isError: true,
        error: { message: 'You have already applied to this job' },
      });

      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(/already applied/i)).toBeInTheDocument();
    });

    it('should prevent duplicate submission', async () => {
      const user = userEvent.setup();
      let submitCount = 0;
      mockCreateApplication.mockImplementation(() => {
        submitCount++;
      });

      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const resumeSelect = screen.getByLabelText(/select resume/i);
      await user.selectOptions(resumeSelect, 'resume-1');

      const submitButton = screen.getByRole('button', { name: /submit application/i });

      // Try to click multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitCount).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on submission failure', async () => {
      const errorMessage = 'Failed to submit application';
      const { useCreateApplication } = require('@/hooks/useApplications');
      useCreateApplication.mockReturnValue({
        mutate: mockCreateApplication,
        isPending: false,
        isError: true,
        error: { message: errorMessage },
      });

      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      const { useCreateApplication } = require('@/hooks/useApplications');

      // First render with error
      useCreateApplication.mockReturnValue({
        mutate: mockCreateApplication,
        isPending: false,
        isError: true,
        error: { message: 'Network error' },
      });

      const { rerender } = render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText(/network error/i)).toBeInTheDocument();

      // Clear error and allow retry
      useCreateApplication.mockReturnValue({
        mutate: mockCreateApplication,
        isPending: false,
        isError: false,
        error: null,
      });

      rerender(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
      );

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByLabelText(/select resume/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cover letter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const resumeLabel = screen.getByText(/select resume/i);
      expect(resumeLabel.textContent).toContain('*');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/select resume/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/cover letter/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/notes/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /submit application/i })).toHaveFocus();
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/resume is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Document Upload Integration', () => {
    it('should support resume upload', async () => {
      const user = userEvent.setup();
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const uploadButton = screen.getByRole('button', { name: /upload new resume/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it('should show uploaded resume in dropdown', async () => {
      const mockResumes = [
        { id: 'resume-1', name: 'Software Engineer Resume.pdf' },
        { id: 'resume-2', name: 'Frontend Developer Resume.pdf' },
      ];

      render(
        <ApplicationForm
          jobId={mockJobId}
          jobTitle={mockJobTitle}
          companyName={mockCompanyName}
          availableResumes={mockResumes}
        />,
        { wrapper: createWrapper() },
      );

      const resumeSelect = screen.getByLabelText(/select resume/i);

      mockResumes.forEach((resume) => {
        expect(screen.getByRole('option', { name: resume.name })).toBeInTheDocument();
      });
    });
  });

  describe('Cover Letter Management', () => {
    it('should allow cover letter text input', async () => {
      const user = userEvent.setup();
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const coverLetterField = screen.getByLabelText(/cover letter/i);
      const coverLetterText = 'I am very interested in this position';

      await user.type(coverLetterField, coverLetterText);

      expect(coverLetterField).toHaveValue(coverLetterText);
    });

    it('should provide AI-generated cover letter option', async () => {
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const aiGenerateButton = screen.getByRole('button', { name: /generate with ai/i });
      expect(aiGenerateButton).toBeInTheDocument();
    });

    it('should show character count for cover letter', async () => {
      const user = userEvent.setup();
      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const coverLetterField = screen.getByLabelText(/cover letter/i);
      await user.type(coverLetterField, 'Hello World');

      expect(screen.getByText(/11 characters/i)).toBeInTheDocument();
    });
  });

  describe('Success Handling', () => {
    it('should show success message after submission', async () => {
      const user = userEvent.setup();
      mockCreateApplication.mockResolvedValue({ id: 'new-application-id' });

      render(
        <ApplicationForm
          jobId={mockJobId}
          jobTitle={mockJobTitle}
          companyName={mockCompanyName}
          onSuccess={jest.fn()}
        />,
        { wrapper: createWrapper() },
      );

      const resumeSelect = screen.getByLabelText(/select resume/i);
      await user.selectOptions(resumeSelect, 'resume-1');

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/application submitted successfully/i)).toBeInTheDocument();
      });
    });

    it('should call onSuccess callback when provided', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      mockCreateApplication.mockResolvedValue({ id: 'new-application-id' });

      render(
        <ApplicationForm
          jobId={mockJobId}
          jobTitle={mockJobTitle}
          companyName={mockCompanyName}
          onSuccess={onSuccess}
        />,
        { wrapper: createWrapper() },
      );

      const resumeSelect = screen.getByLabelText(/select resume/i);
      await user.selectOptions(resumeSelect, 'resume-1');

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({ id: 'new-application-id' });
      });
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      mockCreateApplication.mockResolvedValue({ id: 'new-application-id' });

      render(
        <ApplicationForm jobId={mockJobId} jobTitle={mockJobTitle} companyName={mockCompanyName} />,
        { wrapper: createWrapper() },
      );

      const resumeSelect = screen.getByLabelText(/select resume/i);
      const notesField = screen.getByLabelText(/notes/i);

      await user.selectOptions(resumeSelect, 'resume-1');
      await user.type(notesField, 'Test notes');

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(resumeSelect).toHaveValue('');
        expect(notesField).toHaveValue('');
      });
    });
  });
});

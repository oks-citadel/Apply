import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ApplicantList } from '../ApplicantList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API hooks
jest.mock('@/hooks/useApplications', () => ({
  useJobApplicants: jest.fn(),
  useUpdateApplicationStatus: jest.fn(),
}));

const mockUseJobApplicants = require('@/hooks/useApplications').useJobApplicants;
const mockUseUpdateApplicationStatus = require('@/hooks/useApplications').useUpdateApplicationStatus;

describe('ApplicantList', () => {
  let queryClient: QueryClient;

  const mockApplicants = [
    {
      id: 'app-1',
      user_id: 'user-1',
      job_id: 'job-123',
      status: 'applied',
      applied_at: '2024-01-15T10:00:00Z',
      match_score: 85,
      candidate: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        title: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        resume_url: 'https://resumes.com/john.pdf',
        skills: ['React', 'TypeScript', 'Node.js'],
        experience_years: 5,
      },
    },
    {
      id: 'app-2',
      user_id: 'user-2',
      job_id: 'job-123',
      status: 'interviewing',
      applied_at: '2024-01-14T14:30:00Z',
      match_score: 92,
      candidate: {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        title: 'Lead Frontend Developer',
        location: 'New York, NY',
        resume_url: 'https://resumes.com/jane.pdf',
        skills: ['React', 'Vue', 'TypeScript', 'GraphQL'],
        experience_years: 7,
      },
    },
    {
      id: 'app-3',
      user_id: 'user-3',
      job_id: 'job-123',
      status: 'offered',
      applied_at: '2024-01-13T09:15:00Z',
      match_score: 88,
      candidate: {
        id: 'user-3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        title: 'Full Stack Developer',
        location: 'Seattle, WA',
        resume_url: 'https://resumes.com/bob.pdf',
        skills: ['React', 'Python', 'Django', 'AWS'],
        experience_years: 6,
      },
    },
  ];

  const defaultProps = {
    jobId: 'job-123',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup default mock implementations
    mockUseJobApplicants.mockReturnValue({
      data: {
        data: mockApplicants,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          total_pages: 1,
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseUpdateApplicationStatus.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ApplicantList {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  describe('Applicant List Rendering', () => {
    it('should render all applicants', () => {
      renderComponent();

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should display applicant details', () => {
      renderComponent();

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    });

    it('should display match scores', () => {
      renderComponent();

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('should display application status badges', () => {
      renderComponent();

      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Interviewing')).toBeInTheDocument();
      expect(screen.getByText('Offered')).toBeInTheDocument();
    });

    it('should display applied dates', () => {
      renderComponent();

      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/Jan 14, 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/Jan 13, 2024/i)).toBeInTheDocument();
    });

    it('should display candidate skills', () => {
      renderComponent();

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('GraphQL')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading state', () => {
      mockUseJobApplicants.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      renderComponent();

      expect(screen.getByText(/loading applicants/i)).toBeInTheDocument();
    });

    it('should display error message when fetch fails', () => {
      const errorMessage = 'Failed to load applicants';
      mockUseJobApplicants.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: errorMessage },
        refetch: jest.fn(),
      });

      renderComponent();

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display empty state when no applicants', () => {
      mockUseJobApplicants.mockReturnValue({
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            total_pages: 0,
          },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderComponent();

      expect(screen.getByText(/no applicants yet/i)).toBeInTheDocument();
    });
  });

  describe('Status Filtering', () => {
    it('should filter applicants by status', async () => {
      const mockRefetch = jest.fn();
      mockUseJobApplicants.mockReturnValue({
        data: {
          data: mockApplicants.filter((app) => app.status === 'applied'),
          pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderComponent();

      const statusFilter = screen.getByLabelText(/filter by status/i);
      await userEvent.selectOptions(statusFilter, 'applied');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should show all applicants when filter is cleared', async () => {
      renderComponent();

      const statusFilter = screen.getByLabelText(/filter by status/i);
      await userEvent.selectOptions(statusFilter, 'all');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort applicants by match score', async () => {
      renderComponent();

      const sortSelect = screen.getByLabelText(/sort by/i);
      await userEvent.selectOptions(sortSelect, 'match_score');

      const applicantCards = screen.getAllByTestId('applicant-card');
      expect(within(applicantCards[0]).getByText('Jane Smith')).toBeInTheDocument(); // 92%
      expect(within(applicantCards[1]).getByText('Bob Johnson')).toBeInTheDocument(); // 88%
      expect(within(applicantCards[2]).getByText('John Doe')).toBeInTheDocument(); // 85%
    });

    it('should sort applicants by date', async () => {
      renderComponent();

      const sortSelect = screen.getByLabelText(/sort by/i);
      await userEvent.selectOptions(sortSelect, 'date');

      const applicantCards = screen.getAllByTestId('applicant-card');
      expect(within(applicantCards[0]).getByText('John Doe')).toBeInTheDocument();
      expect(within(applicantCards[1]).getByText('Jane Smith')).toBeInTheDocument();
      expect(within(applicantCards[2]).getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  describe('Status Update Actions', () => {
    it('should update status to interviewing', async () => {
      const mockMutate = jest.fn();
      mockUseUpdateApplicationStatus.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const applicantCard = screen.getAllByTestId('applicant-card')[0];
      const statusButton = within(applicantCard).getByRole('button', {
        name: /change status/i,
      });

      fireEvent.click(statusButton);

      const interviewingOption = screen.getByRole('menuitem', {
        name: /schedule interview/i,
      });
      fireEvent.click(interviewingOption);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          applicationId: 'app-1',
          status: 'interviewing',
        });
      });
    });

    it('should update status to offered', async () => {
      const mockMutate = jest.fn();
      mockUseUpdateApplicationStatus.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const applicantCard = screen.getAllByTestId('applicant-card')[1];
      const statusButton = within(applicantCard).getByRole('button', {
        name: /change status/i,
      });

      fireEvent.click(statusButton);

      const offeredOption = screen.getByRole('menuitem', { name: /send offer/i });
      fireEvent.click(offeredOption);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          applicationId: 'app-2',
          status: 'offered',
        });
      });
    });

    it('should update status to rejected', async () => {
      const mockMutate = jest.fn();
      mockUseUpdateApplicationStatus.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const applicantCard = screen.getAllByTestId('applicant-card')[0];
      const statusButton = within(applicantCard).getByRole('button', {
        name: /change status/i,
      });

      fireEvent.click(statusButton);

      const rejectOption = screen.getByRole('menuitem', { name: /reject/i });
      fireEvent.click(rejectOption);

      // Should show confirmation dialog
      expect(screen.getByText(/are you sure you want to reject/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          applicationId: 'app-1',
          status: 'rejected',
        });
      });
    });

    it('should add notes when updating status', async () => {
      const mockMutate = jest.fn();
      mockUseUpdateApplicationStatus.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      renderComponent();

      const applicantCard = screen.getAllByTestId('applicant-card')[0];
      const statusButton = within(applicantCard).getByRole('button', {
        name: /change status/i,
      });

      fireEvent.click(statusButton);

      const interviewingOption = screen.getByRole('menuitem', {
        name: /schedule interview/i,
      });
      fireEvent.click(interviewingOption);

      // Should show notes dialog
      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await userEvent.type(notesInput, 'Technical interview scheduled for Monday');

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          applicationId: 'app-1',
          status: 'interviewing',
          notes: 'Technical interview scheduled for Monday',
        });
      });
    });
  });

  describe('Applicant Details Modal', () => {
    it('should open applicant details when clicking on card', async () => {
      renderComponent();

      const applicantCard = screen.getAllByTestId('applicant-card')[0];
      fireEvent.click(applicantCard);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Applicant Details')).toBeInTheDocument();
      });
    });

    it('should display full applicant profile in modal', async () => {
      renderComponent();

      const applicantCard = screen.getAllByTestId('applicant-card')[0];
      fireEvent.click(applicantCard);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('5 years experience')).toBeInTheDocument();
      });
    });

    it('should show resume download link in modal', async () => {
      renderComponent();

      const applicantCard = screen.getAllByTestId('applicant-card')[0];
      fireEvent.click(applicantCard);

      await waitFor(() => {
        const downloadLink = screen.getByRole('link', { name: /download resume/i });
        expect(downloadLink).toHaveAttribute('href', 'https://resumes.com/john.pdf');
      });
    });

    it('should close modal when clicking close button', async () => {
      renderComponent();

      const applicantCard = screen.getAllByTestId('applicant-card')[0];
      fireEvent.click(applicantCard);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls when multiple pages', () => {
      mockUseJobApplicants.mockReturnValue({
        data: {
          data: mockApplicants,
          pagination: {
            page: 1,
            limit: 20,
            total: 50,
            total_pages: 3,
          },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderComponent();

      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      const mockRefetch = jest.fn();
      mockUseJobApplicants.mockReturnValue({
        data: {
          data: mockApplicants,
          pagination: {
            page: 1,
            limit: 20,
            total: 50,
            total_pages: 3,
          },
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderComponent();

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it('should navigate to previous page', async () => {
      const mockRefetch = jest.fn();
      mockUseJobApplicants.mockReturnValue({
        data: {
          data: mockApplicants,
          pagination: {
            page: 2,
            limit: 20,
            total: 50,
            total_pages: 3,
          },
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderComponent();

      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it('should disable previous button on first page', () => {
      renderComponent();

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      mockUseJobApplicants.mockReturnValue({
        data: {
          data: mockApplicants,
          pagination: {
            page: 3,
            limit: 20,
            total: 50,
            total_pages: 3,
          },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderComponent();

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Search Functionality', () => {
    it('should filter applicants by search query', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/search applicants/i);
      await userEvent.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should clear search when input is cleared', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/search applicants/i);
      await userEvent.type(searchInput, 'John');
      await userEvent.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Actions', () => {
    it('should select multiple applicants', async () => {
      renderComponent();

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      expect(screen.getByText(/2 applicants selected/i)).toBeInTheDocument();
    });

    it('should select all applicants', async () => {
      renderComponent();

      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      fireEvent.click(selectAllCheckbox);

      expect(screen.getByText(/3 applicants selected/i)).toBeInTheDocument();
    });

    it('should perform bulk status update', async () => {
      const mockMutate = jest.fn();
      mockUseUpdateApplicationStatus.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      renderComponent();

      // Select applicants
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      // Open bulk actions menu
      const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
      fireEvent.click(bulkActionsButton);

      const rejectOption = screen.getByRole('menuitem', { name: /reject selected/i });
      fireEvent.click(rejectOption);

      // Confirm bulk action
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Match Score Visualization', () => {
    it('should display match score with color coding', () => {
      renderComponent();

      const highScore = screen.getByText('92%');
      const mediumScore = screen.getByText('85%');

      expect(highScore).toHaveClass('text-green-600');
      expect(mediumScore).toHaveClass('text-yellow-600');
    });

    it('should show match score breakdown on hover', async () => {
      renderComponent();

      const scoreElement = screen.getByText('85%');
      fireEvent.mouseEnter(scoreElement);

      await waitFor(() => {
        expect(screen.getByText(/skills match/i)).toBeInTheDocument();
        expect(screen.getByText(/experience match/i)).toBeInTheDocument();
      });
    });
  });
});

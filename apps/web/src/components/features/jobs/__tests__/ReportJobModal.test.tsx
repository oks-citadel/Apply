import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportJobModal } from '../ReportJobModal';
import { useReportJob } from '@/hooks/useJobs';

// Mock the hooks
jest.mock('@/hooks/useJobs', () => ({
  useReportJob: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
}));

const mockUseReportJob = useReportJob as jest.MockedFunction<typeof useReportJob>;

describe('ReportJobModal', () => {
  const mockOnClose = jest.fn();
  const mockMutateAsync = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    jobId: 'test-job-123',
    jobTitle: 'Senior Software Engineer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReportJob.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  it('renders the modal when open', () => {
    render(<ReportJobModal {...defaultProps} />);

    expect(screen.getByText('Report Job Posting')).toBeInTheDocument();
    expect(screen.getByText(/Reporting: Senior Software Engineer/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ReportJobModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Report Job Posting')).not.toBeInTheDocument();
  });

  it('displays all report reason options', () => {
    render(<ReportJobModal {...defaultProps} />);

    expect(screen.getByText('Spam/Scam')).toBeInTheDocument();
    expect(screen.getByText('Misleading information')).toBeInTheDocument();
    expect(screen.getByText('Discriminatory content')).toBeInTheDocument();
    expect(screen.getByText('Expired/Closed position')).toBeInTheDocument();
    expect(screen.getByText('Duplicate listing')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('requires a reason to be selected', async () => {
    const user = userEvent.setup();
    render(<ReportJobModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when reason is selected', async () => {
    const user = userEvent.setup();
    render(<ReportJobModal {...defaultProps} />);

    const reasonSelect = screen.getByLabelText(/Reason for reporting/i);
    await user.selectOptions(reasonSelect, 'spam');

    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    expect(submitButton).toBeEnabled();
  });

  it('submits report with reason and details', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ message: 'Report submitted' });

    render(<ReportJobModal {...defaultProps} />);

    // Select reason
    const reasonSelect = screen.getByLabelText(/Reason for reporting/i);
    await user.selectOptions(reasonSelect, 'spam');

    // Enter details
    const detailsTextarea = screen.getByLabelText(/Additional details/i);
    await user.type(detailsTextarea, 'This is clearly a scam posting');

    // Submit
    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    await user.click(submitButton);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      jobId: 'test-job-123',
      reason: 'spam',
      details: 'This is clearly a scam posting',
    });
  });

  it('shows success state after submission', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ message: 'Report submitted' });

    render(<ReportJobModal {...defaultProps} />);

    // Select reason and submit
    const reasonSelect = screen.getByLabelText(/Reason for reporting/i);
    await user.selectOptions(reasonSelect, 'spam');

    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    await user.click(submitButton);

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Thank you for your report')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockUseReportJob.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any);

    render(<ReportJobModal {...defaultProps} />);

    const reasonSelect = screen.getByLabelText(/Reason for reporting/i);
    await user.selectOptions(reasonSelect, 'spam');

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('allows canceling the report', async () => {
    const user = userEvent.setup();
    render(<ReportJobModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles submission errors gracefully', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Network error'));

    render(<ReportJobModal {...defaultProps} />);

    const reasonSelect = screen.getByLabelText(/Reason for reporting/i);
    await user.selectOptions(reasonSelect, 'spam');

    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    await user.click(submitButton);

    // Modal should still be open after error
    expect(screen.getByText('Report Job Posting')).toBeInTheDocument();
  });

  it('closes modal on escape key', async () => {
    const user = userEvent.setup();
    render(<ReportJobModal {...defaultProps} />);

    // Press escape key
    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });
});

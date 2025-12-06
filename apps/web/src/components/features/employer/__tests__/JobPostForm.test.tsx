import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { JobPostForm } from '../JobPostForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API hooks
jest.mock('@/hooks/useJobs', () => ({
  useCreateJob: jest.fn(),
  useUpdateJob: jest.fn(),
}));

const mockUseCreateJob = require('@/hooks/useJobs').useCreateJob;
const mockUseUpdateJob = require('@/hooks/useJobs').useUpdateJob;

describe('JobPostForm', () => {
  let queryClient: QueryClient;

  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup default mock implementations
    mockUseCreateJob.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    mockUseUpdateJob.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <JobPostForm {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  describe('Form Rendering', () => {
    it('should render all required form fields', () => {
      renderComponent();

      expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/employment type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/experience level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remote type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/minimum salary/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum salary/i)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /post job/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render with initial data for editing', () => {
      const initialData = {
        title: 'Senior Software Engineer',
        description: 'Looking for a senior engineer...',
        location: 'San Francisco, CA',
        salary_min: 120000,
        salary_max: 180000,
      };

      renderComponent({ initialData, mode: 'edit' });

      expect(screen.getByDisplayValue('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('120000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('180000')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error when title is empty', async () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /post job/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when description is empty', async () => {
      renderComponent();

      const titleInput = screen.getByLabelText(/job title/i);
      await userEvent.type(titleInput, 'Senior Engineer');

      const submitButton = screen.getByRole('button', { name: /post job/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum salary is less than maximum', async () => {
      renderComponent();

      const minSalaryInput = screen.getByLabelText(/minimum salary/i);
      const maxSalaryInput = screen.getByLabelText(/maximum salary/i);

      await userEvent.type(minSalaryInput, '180000');
      await userEvent.type(maxSalaryInput, '120000');

      const submitButton = screen.getByRole('button', { name: /post job/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/maximum salary must be greater than minimum/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate required skills are provided', async () => {
      renderComponent();

      const titleInput = screen.getByLabelText(/job title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await userEvent.type(titleInput, 'Senior Engineer');
      await userEvent.type(descriptionInput, 'Great opportunity');

      const submitButton = screen.getByRole('button', { name: /post job/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least one skill is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Skills Management', () => {
    it('should add skills to the job posting', async () => {
      renderComponent();

      const skillInput = screen.getByPlaceholderText(/add skill/i);
      const addButton = screen.getByRole('button', { name: /add skill/i });

      await userEvent.type(skillInput, 'React');
      fireEvent.click(addButton);

      expect(screen.getByText('React')).toBeInTheDocument();

      await userEvent.type(skillInput, 'TypeScript');
      fireEvent.click(addButton);

      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('should remove skills from the job posting', async () => {
      renderComponent();

      const skillInput = screen.getByPlaceholderText(/add skill/i);
      const addButton = screen.getByRole('button', { name: /add skill/i });

      await userEvent.type(skillInput, 'React');
      fireEvent.click(addButton);

      const removeButton = screen.getByRole('button', { name: /remove react/i });
      fireEvent.click(removeButton);

      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });

    it('should not add duplicate skills', async () => {
      renderComponent();

      const skillInput = screen.getByPlaceholderText(/add skill/i);
      const addButton = screen.getByRole('button', { name: /add skill/i });

      await userEvent.type(skillInput, 'React');
      fireEvent.click(addButton);

      await userEvent.type(skillInput, 'React');
      fireEvent.click(addButton);

      const reactSkills = screen.getAllByText('React');
      expect(reactSkills).toHaveLength(1);
    });
  });

  describe('Requirements Management', () => {
    it('should add requirements to the job posting', async () => {
      renderComponent();

      const reqInput = screen.getByPlaceholderText(/add requirement/i);
      const addButton = screen.getByRole('button', { name: /add requirement/i });

      await userEvent.type(reqInput, '5+ years of experience');
      fireEvent.click(addButton);

      expect(screen.getByText('5+ years of experience')).toBeInTheDocument();
    });

    it('should remove requirements from the job posting', async () => {
      renderComponent();

      const reqInput = screen.getByPlaceholderText(/add requirement/i);
      const addButton = screen.getByRole('button', { name: /add requirement/i });

      await userEvent.type(reqInput, 'Bachelor degree');
      fireEvent.click(addButton);

      const removeButton = screen.getByRole('button', {
        name: /remove bachelor degree/i,
      });
      fireEvent.click(removeButton);

      expect(screen.queryByText('Bachelor degree')).not.toBeInTheDocument();
    });
  });

  describe('Benefits Management', () => {
    it('should add benefits to the job posting', async () => {
      renderComponent();

      const benefitInput = screen.getByPlaceholderText(/add benefit/i);
      const addButton = screen.getByRole('button', { name: /add benefit/i });

      await userEvent.type(benefitInput, 'Health insurance');
      fireEvent.click(addButton);

      expect(screen.getByText('Health insurance')).toBeInTheDocument();
    });

    it('should support multiple benefits', async () => {
      renderComponent();

      const benefitInput = screen.getByPlaceholderText(/add benefit/i);
      const addButton = screen.getByRole('button', { name: /add benefit/i });

      await userEvent.type(benefitInput, 'Health insurance');
      fireEvent.click(addButton);

      await userEvent.type(benefitInput, '401k');
      fireEvent.click(addButton);

      await userEvent.type(benefitInput, 'Equity');
      fireEvent.click(addButton);

      expect(screen.getByText('Health insurance')).toBeInTheDocument();
      expect(screen.getByText('401k')).toBeInTheDocument();
      expect(screen.getByText('Equity')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data for new job', async () => {
      const mockMutate = jest.fn();
      mockUseCreateJob.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      renderComponent();

      // Fill in required fields
      await userEvent.type(screen.getByLabelText(/job title/i), 'Senior Engineer');
      await userEvent.type(
        screen.getByLabelText(/description/i),
        'Great opportunity for a senior engineer'
      );
      await userEvent.type(screen.getByLabelText(/location/i), 'San Francisco, CA');

      // Add skills
      const skillInput = screen.getByPlaceholderText(/add skill/i);
      const addSkillButton = screen.getByRole('button', { name: /add skill/i });
      await userEvent.type(skillInput, 'React');
      fireEvent.click(addSkillButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /post job/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Senior Engineer',
            description: 'Great opportunity for a senior engineer',
            location: 'San Francisco, CA',
            skills: ['React'],
          })
        );
      });
    });

    it('should submit form with all optional fields filled', async () => {
      const mockMutate = jest.fn();
      mockUseCreateJob.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      renderComponent();

      // Fill in all fields
      await userEvent.type(screen.getByLabelText(/job title/i), 'Senior Engineer');
      await userEvent.type(screen.getByLabelText(/description/i), 'Full description');
      await userEvent.type(screen.getByLabelText(/location/i), 'San Francisco, CA');
      await userEvent.type(screen.getByLabelText(/minimum salary/i), '120000');
      await userEvent.type(screen.getByLabelText(/maximum salary/i), '180000');

      // Add skill
      const skillInput = screen.getByPlaceholderText(/add skill/i);
      const addSkillButton = screen.getByRole('button', { name: /add skill/i });
      await userEvent.type(skillInput, 'React');
      fireEvent.click(addSkillButton);

      const submitButton = screen.getByRole('button', { name: /post job/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('should update existing job when in edit mode', async () => {
      const mockMutate = jest.fn();
      mockUseUpdateJob.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      const initialData = {
        id: 'job-123',
        title: 'Senior Engineer',
        description: 'Original description',
        skills: ['React'],
      };

      renderComponent({ initialData, mode: 'edit' });

      // Update title
      const titleInput = screen.getByLabelText(/job title/i);
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Lead Engineer');

      const submitButton = screen.getByRole('button', { name: /update job/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'job-123',
            title: 'Lead Engineer',
          })
        );
      });
    });

    it('should call onSuccess callback after successful submission', async () => {
      const mockMutate = jest.fn((data, callbacks) => {
        callbacks.onSuccess();
      });
      mockUseCreateJob.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      renderComponent();

      await userEvent.type(screen.getByLabelText(/job title/i), 'Senior Engineer');
      await userEvent.type(screen.getByLabelText(/description/i), 'Description');
      await userEvent.type(screen.getByLabelText(/location/i), 'San Francisco');

      const skillInput = screen.getByPlaceholderText(/add skill/i);
      const addSkillButton = screen.getByRole('button', { name: /add skill/i });
      await userEvent.type(skillInput, 'React');
      fireEvent.click(addSkillButton);

      const submitButton = screen.getByRole('button', { name: /post job/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      mockUseCreateJob.mockReturnValue({
        mutate: jest.fn(),
        isLoading: true,
        error: null,
      });

      renderComponent();

      const submitButton = screen.getByRole('button', { name: /posting/i });
      expect(submitButton).toBeDisabled();
    });

    it('should display error message on submission failure', async () => {
      const errorMessage = 'Failed to create job posting';
      mockUseCreateJob.mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        error: { message: errorMessage },
      });

      renderComponent();

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button is clicked', () => {
      renderComponent();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show confirmation dialog when form has changes', async () => {
      renderComponent();

      // Make a change
      await userEvent.type(screen.getByLabelText(/job title/i), 'Some text');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(
        screen.getByText(/are you sure you want to discard changes/i)
      ).toBeInTheDocument();
    });
  });

  describe('Remote Type Selection', () => {
    it('should allow selecting remote type', async () => {
      renderComponent();

      const remoteSelect = screen.getByLabelText(/remote type/i);
      await userEvent.selectOptions(remoteSelect, 'hybrid');

      expect(remoteSelect).toHaveValue('hybrid');
    });

    it('should support all remote type options', () => {
      renderComponent();

      const remoteSelect = screen.getByLabelText(/remote type/i);
      const options = Array.from(remoteSelect.querySelectorAll('option'));

      expect(options).toHaveLength(3);
      expect(options.map((opt) => opt.value)).toEqual(['onsite', 'remote', 'hybrid']);
    });
  });

  describe('Employment Type Selection', () => {
    it('should allow selecting employment type', async () => {
      renderComponent();

      const employmentSelect = screen.getByLabelText(/employment type/i);
      await userEvent.selectOptions(employmentSelect, 'full_time');

      expect(employmentSelect).toHaveValue('full_time');
    });

    it('should support all employment type options', () => {
      renderComponent();

      const employmentSelect = screen.getByLabelText(/employment type/i);
      const options = Array.from(employmentSelect.querySelectorAll('option'));

      expect(options.map((opt) => opt.value)).toContain('full_time');
      expect(options.map((opt) => opt.value)).toContain('part_time');
      expect(options.map((opt) => opt.value)).toContain('contract');
      expect(options.map((opt) => opt.value)).toContain('internship');
    });
  });

  describe('Experience Level Selection', () => {
    it('should allow selecting experience level', async () => {
      renderComponent();

      const experienceSelect = screen.getByLabelText(/experience level/i);
      await userEvent.selectOptions(experienceSelect, 'senior');

      expect(experienceSelect).toHaveValue('senior');
    });

    it('should support all experience level options', () => {
      renderComponent();

      const experienceSelect = screen.getByLabelText(/experience level/i);
      const options = Array.from(experienceSelect.querySelectorAll('option'));

      expect(options.map((opt) => opt.value)).toContain('entry');
      expect(options.map((opt) => opt.value)).toContain('junior');
      expect(options.map((opt) => opt.value)).toContain('mid');
      expect(options.map((opt) => opt.value)).toContain('senior');
    });
  });
});

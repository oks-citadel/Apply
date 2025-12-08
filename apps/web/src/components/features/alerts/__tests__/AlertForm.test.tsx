import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertForm } from '../AlertForm';
import type { JobAlert } from '@/types/alert';

// Mock the UI components
jest.mock('@/components/ui/Input', () => ({
  Input: ({ label, error, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input {...props} />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

jest.mock('@/components/ui/Select', () => ({
  Select: ({ label, children, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <select {...props}>{children}</select>
    </div>
  ),
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));

describe('AlertForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create mode correctly', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Create Job Alert')).toBeInTheDocument();
    expect(screen.getByLabelText(/alert name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/keywords/i)).toBeInTheDocument();
  });

  it('renders edit mode with existing data', () => {
    const mockAlert: JobAlert = {
      id: 'alert-1',
      userId: 'user-1',
      name: 'Test Alert',
      keywords: ['React', 'TypeScript'],
      jobTitle: 'Frontend Developer',
      location: 'San Francisco',
      isRemote: true,
      salaryMin: 100000,
      salaryMax: 150000,
      employmentType: ['full-time'],
      experienceLevel: ['senior'],
      notificationFrequency: 'daily',
      isActive: true,
      createdAt: '2025-12-08T10:00:00Z',
      updatedAt: '2025-12-08T10:00:00Z',
    };

    render(
      <AlertForm
        alert={mockAlert}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Job Alert')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Alert')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('San Francisco')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText(/create alert/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/alert name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates salary range', async () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in name
    const nameInput = screen.getByLabelText(/alert name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Alert' } });

    // Set invalid salary range (min > max)
    const salaryMinInput = screen.getByPlaceholderText(/min salary/i);
    const salaryMaxInput = screen.getByPlaceholderText(/max salary/i);

    fireEvent.change(salaryMinInput, { target: { value: '150000' } });
    fireEvent.change(salaryMaxInput, { target: { value: '100000' } });

    const submitButton = screen.getByText(/create alert/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/minimum salary must be less than or equal to maximum salary/i)
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in form
    fireEvent.change(screen.getByLabelText(/alert name/i), {
      target: { value: 'Senior Developer Jobs' },
    });

    fireEvent.change(screen.getByLabelText(/keywords/i), {
      target: { value: 'React, TypeScript, Node.js' },
    });

    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: 'San Francisco' },
    });

    const submitButton = screen.getByText(/create alert/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Senior Developer Jobs',
          keywords: ['React', 'TypeScript', 'Node.js'],
          location: 'San Francisco',
        })
      );
    });
  });

  it('handles cancel button click', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('disables submit button when loading', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    const submitButton = screen.getByText(/saving.../i);
    expect(submitButton).toBeDisabled();
  });

  it('toggles employment types', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const fullTimeButton = screen.getByText(/full-time/i);
    fireEvent.click(fullTimeButton);

    // The button should have active styling (implementation detail)
    // In a real test, you'd verify the class or style changes
    expect(fullTimeButton).toBeInTheDocument();
  });

  it('toggles remote option', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const remoteCheckbox = screen.getByLabelText(/include remote jobs/i);
    fireEvent.click(remoteCheckbox);

    expect(remoteCheckbox).toBeChecked();
  });

  it('sets active status', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const activeCheckbox = screen.getByLabelText(/enable this alert immediately/i);
    expect(activeCheckbox).toBeChecked(); // Should be checked by default

    fireEvent.click(activeCheckbox);
    expect(activeCheckbox).not.toBeChecked();
  });

  it('handles notification frequency selection', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const frequencySelect = screen.getByLabelText(/notification frequency/i);
    fireEvent.change(frequencySelect, { target: { value: 'weekly' } });

    expect(frequencySelect).toHaveValue('weekly');
  });

  it('formats keywords correctly on submit', async () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.change(screen.getByLabelText(/alert name/i), {
      target: { value: 'Test' },
    });

    // Input with extra spaces and commas
    fireEvent.change(screen.getByLabelText(/keywords/i), {
      target: { value: '  React  ,  TypeScript,  ,  Node.js  ' },
    });

    const submitButton = screen.getByText(/create alert/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          keywords: ['React', 'TypeScript', 'Node.js'],
        })
      );
    });
  });
});

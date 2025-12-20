import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileForm from '../ProfileForm';

// Mock axios
jest.mock('axios');

// Mock useRouter
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/profile/edit',
  query: {},
  asPath: '/profile/edit',
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

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

describe('ProfileForm', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockProfile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    full_name: 'John Doe',
    headline: 'Senior Software Engineer',
    bio: 'Experienced software engineer with 10+ years',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/johndoe',
    github_url: 'https://github.com/johndoe',
    portfolio_url: 'https://johndoe.dev',
    profile_photo_url: 'https://storage.example.com/photos/user123.jpg',
    completeness_score: 100,
  };

  describe('Rendering', () => {
    it('should render the profile form', () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/headline/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    });

    it('should render social links fields', () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/linkedin/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/github/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/portfolio/i)).toBeInTheDocument();
    });

    it('should populate form with existing profile data', () => {
      render(<ProfileForm initialData={mockProfile} />, { wrapper: createWrapper() });

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Experienced software engineer with 10+ years')).toBeInTheDocument();
    });

    it('should show submit button', () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate full name max length (255 chars)', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const fullNameInput = screen.getByLabelText(/full name/i);
      const longName = 'a'.repeat(256);

      await user.type(fullNameInput, longName);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/full name must be less than 255 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate headline max length (255 chars)', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const headlineInput = screen.getByLabelText(/headline/i);
      const longHeadline = 'a'.repeat(256);

      await user.type(headlineInput, longHeadline);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/headline must be less than 255 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate URL format for LinkedIn', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const linkedinInput = screen.getByLabelText(/linkedin/i);
      await user.type(linkedinInput, 'invalid-url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid url format/i)).toBeInTheDocument();
      });
    });

    it('should validate URL format for GitHub', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const githubInput = screen.getByLabelText(/github/i);
      await user.type(githubInput, 'not-a-url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid url format/i)).toBeInTheDocument();
      });
    });

    it('should validate URL format for Portfolio', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const portfolioInput = screen.getByLabelText(/portfolio/i);
      await user.type(portfolioInput, 'bad url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid url format/i)).toBeInTheDocument();
      });
    });

    it('should accept valid URLs', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const linkedinInput = screen.getByLabelText(/linkedin/i);
      await user.type(linkedinInput, 'https://linkedin.com/in/johndoe');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/invalid url format/i)).not.toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, 'abc123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
      });
    });

    it('should accept valid phone numbers', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, '+1234567890');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/invalid phone number/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const onSubmit = jest.fn();
      render(<ProfileForm onSubmit={onSubmit} />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText(/full name/i), 'Jane Smith');
      await user.type(screen.getByLabelText(/headline/i), 'Principal Engineer');
      await user.type(screen.getByLabelText(/bio/i), 'Passionate about cloud architecture');
      await user.type(screen.getByLabelText(/phone/i), '+0987654321');
      await user.type(screen.getByLabelText(/location/i), 'New York, NY');

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: 'Jane Smith',
            headline: 'Principal Engineer',
            bio: 'Passionate about cloud architecture',
            phone: '+0987654321',
            location: 'New York, NY',
          })
        );
      });
    });

    it('should handle partial updates', async () => {
      const onSubmit = jest.fn();
      render(<ProfileForm initialData={mockProfile} onSubmit={onSubmit} />, { wrapper: createWrapper() });

      const fullNameInput = screen.getByDisplayValue('John Doe');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Jane Doe');

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: 'Jane Doe',
          })
        );
      });
    });

    it('should show loading state during submission', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });

    it('should show success message on successful submission', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message on submission failure', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<ProfileForm onSubmit={onSubmit} />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should clear form fields when reset button is clicked', async () => {
      render(<ProfileForm initialData={mockProfile} />, { wrapper: createWrapper() });

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toHaveValue('');
        expect(screen.getByLabelText(/headline/i)).toHaveValue('');
      });
    });

    it('should show character count for bio field', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const bioInput = screen.getByLabelText(/bio/i);
      await user.type(bioInput, 'This is my bio');

      expect(screen.getByText(/14 characters/i)).toBeInTheDocument();
    });

    it('should enable/disable submit button based on form validity', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      expect(submitButton).toBeDisabled();

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should focus first error field on validation failure', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        const fullNameInput = screen.getByLabelText(/full name/i);
        expect(fullNameInput).toHaveFocus();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/full name/i)).toHaveAttribute('aria-label', 'Full Name');
      expect(screen.getByLabelText(/headline/i)).toHaveAttribute('aria-label', 'Professional Headline');
    });

    it('should have proper error announcements', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/full name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should support keyboard navigation', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const fullNameInput = screen.getByLabelText(/full name/i);
      fullNameInput.focus();

      expect(fullNameInput).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/headline/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/bio/i)).toHaveFocus();
    });
  });

  describe('Profile Completeness', () => {
    it('should display completeness score', () => {
      render(<ProfileForm initialData={mockProfile} />, { wrapper: createWrapper() });

      expect(screen.getByText(/100% complete/i)).toBeInTheDocument();
    });

    it('should update completeness score as fields are filled', async () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      expect(screen.getByText(/0% complete/i)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');

      await waitFor(() => {
        expect(screen.getByText(/12% complete/i)).toBeInTheDocument();
      });
    });

    it('should show missing fields indicator', () => {
      const incompleteProfile = { ...mockProfile, bio: null, linkedin_url: null };
      render(<ProfileForm initialData={incompleteProfile} />, { wrapper: createWrapper() });

      expect(screen.getByText(/missing: bio, linkedin/i)).toBeInTheDocument();
    });

    it('should highlight incomplete required fields', () => {
      render(<ProfileForm />, { wrapper: createWrapper() });

      const fullNameInput = screen.getByLabelText(/full name/i);
      expect(fullNameInput).toHaveClass('border-yellow-500');
    });
  });

  describe('Data Persistence', () => {
    it('should save draft to localStorage on change', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      render(<ProfileForm />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(
          'profile-draft',
          expect.stringContaining('John Doe')
        );
      });
    });

    it('should restore draft from localStorage on mount', () => {
      const draft = { full_name: 'Draft Name', headline: 'Draft Headline' };
      localStorage.setItem('profile-draft', JSON.stringify(draft));

      render(<ProfileForm />, { wrapper: createWrapper() });

      expect(screen.getByDisplayValue('Draft Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Draft Headline')).toBeInTheDocument();
    });

    it('should clear draft from localStorage on successful submission', async () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      render(<ProfileForm />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(removeItemSpy).toHaveBeenCalledWith('profile-draft');
      });
    });
  });
});

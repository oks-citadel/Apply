# Email Verification - Usage Examples

## Complete Integration Examples

### Example 1: Basic Dashboard Layout with Verification Banner

```tsx
// apps/web/src/app/(dashboard)/layout.tsx
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Verification banner shows only for unverified users */}
      <EmailVerificationBanner />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
```

### Example 2: Enhanced Registration Form with Success State

```tsx
// apps/web/src/components/forms/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { RegistrationSuccess } from '@/components/auth/RegistrationSuccess';
import { AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const { register: registerUser, isLoading } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptTerms: data.acceptTerms,
      });

      // Show success state
      setRegisteredEmail(data.email);
      setRegistrationSuccess(true);
    } catch (error: any) {
      setServerError(error.message || 'Registration failed. Please try again.');
    }
  };

  // Show success component after registration
  if (registrationSuccess) {
    return <RegistrationSuccess email={registeredEmail} redirectDelay={5000} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-200">{serverError}</p>
        </div>
      )}

      <Input
        {...register('fullName')}
        type="text"
        label="Full Name"
        placeholder="John Doe"
        error={errors.fullName?.message}
        disabled={isLoading}
        required
      />

      <Input
        {...register('email')}
        type="email"
        label="Email Address"
        placeholder="john.doe@example.com"
        error={errors.email?.message}
        disabled={isLoading}
        required
      />

      <Input
        {...register('password')}
        type="password"
        label="Password"
        placeholder="Create a strong password"
        error={errors.password?.message}
        disabled={isLoading}
        required
      />

      <Input
        {...register('confirmPassword')}
        type="password"
        label="Confirm Password"
        placeholder="Re-enter your password"
        error={errors.confirmPassword?.message}
        disabled={isLoading}
        required
      />

      <div className="flex items-start">
        <input
          {...register('acceptTerms')}
          type="checkbox"
          className="h-4 w-4 mt-1 rounded"
        />
        <label className="ml-2 text-sm">
          I agree to the Terms of Service and Privacy Policy
        </label>
      </div>
      {errors.acceptTerms && (
        <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
      )}

      <Button type="submit" loading={isLoading} className="w-full">
        Create Account
      </Button>
    </form>
  );
}
```

### Example 3: Protected Route with Strict Verification

```tsx
// apps/web/src/app/(dashboard)/settings/page.tsx
import { RequireVerification } from '@/middleware/RequireVerification';
import { SettingsForm } from '@/components/settings/SettingsForm';

export default function SettingsPage() {
  return (
    <RequireVerification strictMode={true}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences.
        </p>
        <SettingsForm />
      </div>
    </RequireVerification>
  );
}
```

### Example 4: Custom Verification Status Component

```tsx
// apps/web/src/components/auth/VerificationStatus.tsx
'use client';

import { useAuthStore } from '@/stores/authStore';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function VerificationStatus() {
  const { user } = useAuthStore();

  if (!user) return null;

  if (user.isEmailVerified) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        <span className="text-sm text-green-800 dark:text-green-200">
          Email verified
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Email not verified
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            Please verify your email to unlock all features.
          </p>
          <div className="mt-3 flex gap-2">
            <Button asChild size="sm" variant="primary">
              <Link href="/resend-verification">
                <Mail className="h-4 w-4 mr-2" />
                Resend Email
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Example 5: Profile Page with Verification Status

```tsx
// apps/web/src/app/(dashboard)/profile/page.tsx
import { VerificationStatus } from '@/components/auth/VerificationStatus';
import { ProfileForm } from '@/components/profile/ProfileForm';

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Your Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Show verification status at the top */}
      <VerificationStatus />

      {/* Profile form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <ProfileForm />
      </div>
    </div>
  );
}
```

### Example 6: Dashboard with Conditional Features

```tsx
// apps/web/src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useAuthStore } from '@/stores/authStore';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { DashboardStats } from '@/components/dashboard/Stats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PremiumFeatures } from '@/components/dashboard/PremiumFeatures';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isVerified = user?.isEmailVerified;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {user?.fullName}!
        </p>
      </div>

      {/* Stats available to all users */}
      <DashboardStats />

      {/* Recent activity available to all users */}
      <RecentActivity />

      {/* Premium features only for verified users */}
      {isVerified ? (
        <PremiumFeatures />
      ) : (
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Unlock Premium Features
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Verify your email to access advanced analytics, AI-powered insights, and more.
            </p>
            <Button asChild>
              <Link href="/resend-verification">Verify Email</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Example 7: API Client with Verification Handling

```typescript
// apps/web/src/lib/api-client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle verification errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
      // Redirect to verification page
      window.location.href = '/resend-verification';
    }
    return Promise.reject(error);
  }
);

// Verification API methods
export const verificationApi = {
  verifyEmail: (token: string) =>
    apiClient.post('/auth/verify-email', { token }),

  resendVerification: () =>
    apiClient.post('/auth/resend-verification'),
};
```

### Example 8: Email Verification Hook

```typescript
// apps/web/src/hooks/useEmailVerification.ts
import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function useEmailVerification() {
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { accessToken, user } = useAuthStore();

  const resendVerification = async () => {
    if (!accessToken) {
      setError('You must be logged in');
      return;
    }

    setIsResending(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post(
        `${API_BASE_URL}/auth/resend-verification`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  const verifyEmail = async (token: string) => {
    setError(null);

    try {
      await axios.post(`${API_BASE_URL}/auth/verify-email`, { token });
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
      return false;
    }
  };

  return {
    resendVerification,
    verifyEmail,
    isResending,
    error,
    success,
    isVerified: user?.isEmailVerified ?? false,
  };
}
```

### Example 9: Using the Verification Hook

```tsx
// apps/web/src/components/ResendButton.tsx
'use client';

import { useEmailVerification } from '@/hooks/useEmailVerification';
import { Button } from '@/components/ui/Button';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

export function ResendButton() {
  const { resendVerification, isResending, error, success, isVerified } = useEmailVerification();

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span>Email verified</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={resendVerification}
        loading={isResending}
        disabled={isResending || success}
        size="sm"
      >
        <Mail className="h-4 w-4 mr-2" />
        Resend Verification Email
      </Button>

      {success && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-4 w-4" />
          Email sent! Check your inbox.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
```

### Example 10: Testing the Flow

```typescript
// apps/web/__tests__/email-verification.test.ts
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { useAuthStore } from '@/stores/authStore';

// Mock the auth store
jest.mock('@/stores/authStore');

describe('Email Verification Banner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render for verified users', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { isEmailVerified: true },
      accessToken: 'token',
    });

    const { container } = render(<EmailVerificationBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render for unverified users', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { isEmailVerified: false },
      accessToken: 'token',
    });

    render(<EmailVerificationBanner />);
    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
  });

  it('should handle resend button click', async () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { isEmailVerified: false },
      accessToken: 'token',
    });

    render(<EmailVerificationBanner />);

    const resendButton = screen.getByText(/resend email/i);
    await userEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/email sent/i)).toBeInTheDocument();
    });
  });

  it('should be dismissible', async () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { isEmailVerified: false },
      accessToken: 'token',
    });

    const { container } = render(<EmailVerificationBanner />);

    const dismissButton = screen.getByLabelText(/dismiss/i);
    await userEvent.click(dismissButton);

    expect(container).toBeEmptyDOMElement();
  });
});
```

## Quick Reference

### Import Paths
```typescript
// Components
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { RegistrationSuccess } from '@/components/auth/RegistrationSuccess';
import { RequireVerification } from '@/middleware/RequireVerification';

// Hooks
import { useEmailVerification } from '@/hooks/useEmailVerification';

// Store
import { useAuthStore } from '@/stores/authStore';
```

### Common Props
```typescript
// RegistrationSuccess
<RegistrationSuccess
  email="user@example.com"
  redirectDelay={5000}
/>

// RequireVerification
<RequireVerification strictMode={true}>
  {children}
</RequireVerification>
```

### API Endpoints
```typescript
// Verify email
POST /api/auth/verify-email
Body: { token: string }

// Resend verification
POST /api/auth/resend-verification
Headers: { Authorization: Bearer <token> }
```

---

**Last Updated**: December 2025
**Version**: 1.0.0

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { MfaVerification } from '@/components/auth/MfaVerification';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showMfaVerification, setShowMfaVerification] = useState(false);
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const { login, verifyMfaLogin, isLoading, resetMfaState } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setLoginEmail(data.email);
    try {
      const result = await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (result.requiresMfa && result.tempToken) {
        // MFA is required, show verification screen
        setMfaTempToken(result.tempToken);
        setShowMfaVerification(true);
      } else {
        // Regular login success
        router.push('/dashboard');
      }
    } catch (error: any) {
      setServerError(error.message || 'Login failed. Please try again.');
    }
  };

  const handleMfaVerify = async (code: string) => {
    if (!mfaTempToken) return;

    setServerError(null);
    try {
      await verifyMfaLogin(mfaTempToken, code);
      router.push('/dashboard');
    } catch (error: any) {
      throw error;
    }
  };

  const handleCancelMfa = () => {
    setShowMfaVerification(false);
    setMfaTempToken(null);
    resetMfaState();
  };

  // Show MFA verification screen if required
  if (showMfaVerification) {
    return (
      <MfaVerification
        onVerify={handleMfaVerify}
        onCancel={handleCancelMfa}
        isLoading={isLoading}
        error={serverError || undefined}
        email={loginEmail}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div
          className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-800 dark:text-red-200">{serverError}</p>
        </div>
      )}

      <Input
        {...register('email')}
        type="email"
        label="Email Address"
        placeholder="john.doe@example.com"
        error={errors.email?.message}
        disabled={isLoading}
        autoComplete="email"
        required
      />

      <Input
        {...register('password')}
        type="password"
        label="Password"
        placeholder="Enter your password"
        error={errors.password?.message}
        disabled={isLoading}
        autoComplete="current-password"
        required
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            {...register('rememberMe')}
            id="remember-me"
            type="checkbox"
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            Remember me
          </label>
        </div>

        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" loading={isLoading} className="w-full" size="lg">
        Sign In
      </Button>

      <SocialLoginButtons isLoading={isLoading} />

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}

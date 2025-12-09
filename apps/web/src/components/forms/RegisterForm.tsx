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
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { AlertCircle } from 'lucide-react';

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be less than 100 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register: registerUser, isLoading } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
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
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setServerError(errorMessage);
    }
  };

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
        {...register('fullName')}
        type="text"
        label="Full Name"
        placeholder="John Doe"
        error={errors.fullName?.message}
        disabled={isLoading}
        autoComplete="name"
        required
      />

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
        placeholder="Create a strong password"
        error={errors.password?.message}
        disabled={isLoading}
        autoComplete="new-password"
        helperText="Must be at least 8 characters with uppercase, lowercase, and number"
        required
      />

      <Input
        {...register('confirmPassword')}
        type="password"
        label="Confirm Password"
        placeholder="Re-enter your password"
        error={errors.confirmPassword?.message}
        disabled={isLoading}
        autoComplete="new-password"
        required
      />

      <div>
        <div className="flex items-start">
          <input
            {...register('acceptTerms')}
            id="accept-terms"
            type="checkbox"
            disabled={isLoading}
            className="h-4 w-4 mt-1 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
          />
          <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            I agree to the{' '}
            <Link
              href="/terms"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              target="_blank"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              target="_blank"
            >
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      <Button type="submit" loading={isLoading} className="w-full" size="lg">
        Create Account
      </Button>

      <SocialLoginButtons isLoading={isLoading} />

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

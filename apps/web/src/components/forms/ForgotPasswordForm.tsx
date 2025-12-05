'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: data.email,
      });

      setSuccessMessage(
        'Password reset instructions have been sent to your email address. Please check your inbox.'
      );
      reset();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'Failed to send password reset email. Please try again.';
      setServerError(errorMessage);
    } finally {
      setIsLoading(false);
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

      {successMessage && (
        <div
          className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          role="alert"
        >
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
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
      </div>

      <Button type="submit" loading={isLoading} className="w-full" size="lg">
        Send Reset Instructions
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Remember your password?{' '}
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

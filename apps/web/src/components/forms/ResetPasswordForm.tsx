'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

// Password validation schema with strength requirements
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Password strength indicator
function getPasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { strength: 'weak', score };
  if (score <= 4) return { strength: 'medium', score };
  return { strength: 'strong', score };
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    strength: 'weak' | 'medium' | 'strong';
    score: number;
  } | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // Update password strength as user types
  useState(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token,
        newPassword: data.password,
      });

      setSuccessMessage(
        'Your password has been reset successfully. Redirecting to login...'
      );

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosError.response?.data?.message ||
        'Failed to reset password. The reset link may be invalid or expired.';
      setServerError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // If already successful, show success message only
  if (successMessage) {
    return (
      <div
        className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        role="alert"
      >
        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
      </div>
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

      <div>
        <div className="relative">
          <Input
            {...register('password', {
              onChange: (e) => {
                setPasswordStrength(getPasswordStrength(e.target.value));
              },
            })}
            type={showPassword ? 'text' : 'password'}
            label="New Password"
            placeholder="Enter your new password"
            error={errors.password?.message}
            disabled={isLoading}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Password strength indicator */}
        {password && passwordStrength && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Password strength:
              </span>
              <span
                className={`text-xs font-medium ${
                  passwordStrength.strength === 'weak'
                    ? 'text-red-600 dark:text-red-400'
                    : passwordStrength.strength === 'medium'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              >
                {passwordStrength.strength.charAt(0).toUpperCase() +
                  passwordStrength.strength.slice(1)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  passwordStrength.strength === 'weak'
                    ? 'bg-red-500 w-1/3'
                    : passwordStrength.strength === 'medium'
                    ? 'bg-yellow-500 w-2/3'
                    : 'bg-green-500 w-full'
                }`}
              />
            </div>
          </div>
        )}

        <div className="mt-2 space-y-1">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Password must contain:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li className="flex items-center gap-2">
              <span
                className={`${
                  password && password.length >= 8
                    ? 'text-green-600 dark:text-green-400'
                    : ''
                }`}
              >
                {password && password.length >= 8 ? '✓' : '•'}
              </span>
              At least 8 characters
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`${
                  password && /[A-Z]/.test(password)
                    ? 'text-green-600 dark:text-green-400'
                    : ''
                }`}
              >
                {password && /[A-Z]/.test(password) ? '✓' : '•'}
              </span>
              One uppercase letter
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`${
                  password && /[a-z]/.test(password)
                    ? 'text-green-600 dark:text-green-400'
                    : ''
                }`}
              >
                {password && /[a-z]/.test(password) ? '✓' : '•'}
              </span>
              One lowercase letter
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`${
                  password && /[0-9]/.test(password)
                    ? 'text-green-600 dark:text-green-400'
                    : ''
                }`}
              >
                {password && /[0-9]/.test(password) ? '✓' : '•'}
              </span>
              One number
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`${
                  password && /[^A-Za-z0-9]/.test(password)
                    ? 'text-green-600 dark:text-green-400'
                    : ''
                }`}
              >
                {password && /[^A-Za-z0-9]/.test(password) ? '✓' : '•'}
              </span>
              One special character
            </li>
          </ul>
        </div>
      </div>

      <div className="relative">
        <Input
          {...register('confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          error={errors.confirmPassword?.message}
          disabled={isLoading}
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          {showConfirmPassword ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <Button type="submit" loading={isLoading} className="w-full" size="lg">
        Reset Password
      </Button>
    </form>
  );
}

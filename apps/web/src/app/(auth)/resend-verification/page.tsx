'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

// API Base URL - Backend handles routing internally (no /api/v1 needed)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ResendVerificationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { user, accessToken } = useAuthStore();

  const handleResendVerification = async () => {
    if (!accessToken) {
      setMessage({
        type: 'error',
        text: 'You must be logged in to resend verification email. Please log in first.',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/resend-verification`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setMessage({
        type: 'success',
        text: response.data.message || 'Verification email has been sent! Please check your inbox.',
      });
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Failed to send verification email. Please try again later.';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Resend Verification Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Didn't receive the verification email? We'll send you another one.
          </p>
        </div>

        {message && (
          <div
            className={`flex items-start gap-3 p-4 mb-6 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}
            role="alert"
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                message.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {user && user.isEmailVerified ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Your email is already verified!
            </p>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Before you request a new email:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Check your spam or junk folder</li>
                <li>Make sure you're checking the correct email address</li>
                <li>Wait a few minutes for the email to arrive</li>
              </ul>
            </div>

            <Button
              onClick={handleResendVerification}
              loading={isLoading}
              disabled={isLoading || !user}
              className="w-full"
              size="lg"
            >
              Resend Verification Email
            </Button>

            {!user && (
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline"
                >
                  Sign in to resend verification email
                </Link>
              </div>
            )}

            <div className="text-center space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Already verified?{' '}
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline"
                >
                  Sign in
                </Link>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Need help?{' '}
                <Link
                  href="/contact"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

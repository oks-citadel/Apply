'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { AlertCircle, X, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

// API Base URL - Backend handles routing internally (no /api/v1 needed)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function EmailVerificationBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { user, accessToken } = useAuthStore();

  // Don't show banner if user is verified or not logged in
  if (!user || user.isEmailVerified || !isVisible) {
    return null;
  }

  const handleResendEmail = async () => {
    if (!accessToken) return;

    setIsResending(true);
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
        text: 'Verification email sent! Please check your inbox.',
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Failed to send verification email. Please try again.';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/40">
              <AlertCircle className="h-5 w-5 text-yellow-800 dark:text-yellow-200" aria-hidden="true" />
            </span>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Please verify your email address to access all features.
              </p>
              {message && (
                <p
                  className={`text-xs mt-1 ${
                    message.type === 'success'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {message.type === 'success' && <CheckCircle className="inline h-3 w-3 mr-1" />}
                  {message.text}
                </p>
              )}
            </div>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto space-x-2">
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              loading={isResending}
              size="sm"
              variant="primary"
              className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
            >
              <Mail className="h-4 w-4 mr-2" />
              Resend Email
            </Button>
            <Link
              href="/verify-email"
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline"
            >
              Learn more
            </Link>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="-mr-1 flex p-2 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/40 focus:outline-none focus:ring-2 focus:ring-yellow-600"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5 text-yellow-800 dark:text-yellow-200" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setVerificationState('error');
      setErrorMessage('Verification token is missing. Please check your email for the correct link.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-email`, {
        token: verificationToken,
      });

      setVerificationState('success');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 3000);
    } catch (error) {
      setVerificationState('error');
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Email verification failed. The link may be invalid or expired.';
      setErrorMessage(message);
    }
  };

  if (verificationState === 'loading') {
    return (
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <Loader2 className="h-16 w-16 text-primary-600 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verifying your email...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we verify your email address.
        </p>
      </div>
    );
  }

  if (verificationState === 'success') {
    return (
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Email Verified Successfully!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your email address has been verified. You can now access all features of JobPilot AI.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          Redirecting you to the login page...
        </p>
        <Button asChild>
          <Link href="/login">Continue to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mb-6 flex justify-center">
        <XCircle className="h-16 w-16 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Verification Failed
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {errorMessage}
      </p>
      <div className="space-y-3">
        <Button asChild variant="primary">
          <Link href="/login">Go to Login</Link>
        </Button>
        <div className="text-sm">
          <Link
            href="/resend-verification"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline"
          >
            Resend verification email
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        </div>
        <Suspense
          fallback={
            <div className="text-center">
              <Loader2 className="h-16 w-16 text-primary-600 animate-spin mx-auto" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}

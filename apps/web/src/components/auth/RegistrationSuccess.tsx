'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Mail, CheckCircle } from 'lucide-react';

interface RegistrationSuccessProps {
  email: string;
  redirectDelay?: number;
}

export function RegistrationSuccess({ email, redirectDelay = 5000 }: RegistrationSuccessProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, redirectDelay);

    return () => clearTimeout(timer);
  }, [router, redirectDelay]);

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="relative">
          <Mail className="h-16 w-16 text-primary-600" />
          <CheckCircle className="h-8 w-8 text-green-600 absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Check Your Email
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We've sent a verification link to
        </p>
        <p className="text-primary-600 dark:text-primary-400 font-medium mb-4">
          {email}
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Next steps:
        </h3>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
          <li>Open the email from JobPilot AI</li>
          <li>Click the verification link</li>
          <li>You'll be redirected back to sign in</li>
        </ol>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Didn't receive the email?</strong> Check your spam folder or{' '}
          <Link
            href="/resend-verification"
            className="underline hover:text-yellow-900 dark:hover:text-yellow-100"
          >
            request a new one
          </Link>
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => router.push('/dashboard')}
          className="w-full"
          variant="primary"
        >
          Continue to Dashboard
        </Button>

        <p className="text-xs text-gray-500 dark:text-gray-500">
          Redirecting automatically in {redirectDelay / 1000} seconds...
        </p>
      </div>
    </div>
  );
}

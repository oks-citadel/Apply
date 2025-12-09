'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { OAuthErrorHandler, clearOAuthSession } from '@/lib/oauth-utils';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setTokens } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Processing authentication...');

  useEffect(() => {
    let successTimeout: NodeJS.Timeout | null = null;
    let errorTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    const handleCallback = async () => {
      const provider = sessionStorage.getItem('oauth_provider') || undefined;

      try {
        // Get tokens from URL query parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          const friendlyMessage = OAuthErrorHandler.getUserFriendlyMessage(
            error,
            provider
          );
          throw new Error(friendlyMessage);
        }

        if (!accessToken || !refreshToken) {
          throw new Error('Authentication tokens not found. Please try signing in again.');
        }

        // Store tokens
        setTokens(accessToken, refreshToken);

        // Fetch user profile
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile. Please try again.');
        }

        const userData = await response.json();
        if (!isMounted) return;
        setUser(userData);

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Get the original redirect path or default to dashboard
        const redirectTo = sessionStorage.getItem('oauth_redirect') || '/dashboard';

        // Clear OAuth session data
        clearOAuthSession();

        // Redirect after a short delay (with cleanup)
        successTimeout = setTimeout(() => {
          if (isMounted) {
            router.push(redirectTo);
          }
        }, 1500);
      } catch (error) {
        if (!isMounted) return;
        console.error('OAuth callback error:', error);
        setStatus('error');

        const friendlyMessage = OAuthErrorHandler.getUserFriendlyMessage(error, provider);
        setMessage(friendlyMessage);

        // Clear OAuth session data
        clearOAuthSession();

        // Redirect to login after a delay (with cleanup)
        errorTimeout = setTimeout(() => {
          if (isMounted) {
            router.push('/login');
          }
        }, 4000);
      }
    };

    handleCallback();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      if (successTimeout) clearTimeout(successTimeout);
      if (errorTimeout) clearTimeout(errorTimeout);
    };
  }, [searchParams, router, setUser, setTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 mx-auto text-primary-600 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Authenticating...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Success!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Authentication Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Redirecting to login page...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 mx-auto text-primary-600 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Loading...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Processing authentication...</p>
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}

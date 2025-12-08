'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface RequireVerificationProps {
  children: React.ReactNode;
  strictMode?: boolean; // If true, redirects unverified users
}

export function RequireVerification({ children, strictMode = false }: RequireVerificationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Skip verification check for certain paths
    const allowedPaths = [
      '/verify-email',
      '/resend-verification',
      '/login',
      '/register',
      '/forgot-password',
    ];

    const isAllowedPath = allowedPaths.some((path) => pathname.startsWith(path));

    if (strictMode && isAuthenticated && user && !user.isEmailVerified && !isAllowedPath) {
      // In strict mode, redirect to verification page
      router.push('/resend-verification');
    }
  }, [user, isAuthenticated, strictMode, router, pathname]);

  // In non-strict mode or if verified, render children
  return <>{children}</>;
}

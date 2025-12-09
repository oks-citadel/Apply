/**
 * Example: Auto Apply Page with Feature Flags
 * This demonstrates how to use feature flags in Next.js pages
 */

'use client';

import { FeatureFlag, RequireAllFlags } from '@/components/features/FeatureFlag';
import { useFeatureFlag, FEATURE_FLAGS } from '@/hooks/useFeatureFlags';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { InfoIcon } from 'lucide-react';

export default function AutoApplyPage() {
  const { isEnabled: isAutoApplyEnabled, isLoading } = useFeatureFlag(
    FEATURE_FLAGS.AUTO_APPLY,
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAutoApplyEnabled) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Feature Not Available</AlertTitle>
          <AlertDescription>
            The auto-apply feature is not currently available. Please check back
            later or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Auto Apply</h1>

      {/* LinkedIn Auto Apply - Only show if enabled */}
      <FeatureFlag
        flag={FEATURE_FLAGS.LINKEDIN_AUTO_APPLY}
        fallback={
          <Alert className="mb-4">
            <AlertDescription>
              LinkedIn auto-apply is currently unavailable.
            </AlertDescription>
          </Alert>
        }
      >
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">LinkedIn Auto Apply</h2>
          <p>Configure your LinkedIn auto-apply settings here.</p>
          {/* Add your LinkedIn auto-apply configuration UI */}
        </div>
      </FeatureFlag>

      {/* Indeed Auto Apply - Only show if enabled */}
      <FeatureFlag flag={FEATURE_FLAGS.INDEED_AUTO_APPLY}>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Indeed Auto Apply</h2>
          <p>Configure your Indeed auto-apply settings here.</p>
          {/* Add your Indeed auto-apply configuration UI */}
        </div>
      </FeatureFlag>

      {/* Glassdoor Auto Apply - Only show if enabled */}
      <FeatureFlag
        flag={FEATURE_FLAGS.GLASSDOOR_AUTO_APPLY}
        fallback={
          <Alert className="mb-4">
            <AlertDescription>
              Glassdoor auto-apply is coming soon! Stay tuned.
            </AlertDescription>
          </Alert>
        }
      >
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Glassdoor Auto Apply</h2>
          <p>Configure your Glassdoor auto-apply settings here.</p>
          {/* Add your Glassdoor auto-apply configuration UI */}
        </div>
      </FeatureFlag>
    </div>
  );
}

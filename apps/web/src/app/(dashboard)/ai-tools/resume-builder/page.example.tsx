/**
 * Example: AI Resume Builder Page with Feature Flags
 * This demonstrates conditional rendering based on multiple feature flags
 */

'use client';

import { FeatureFlag, RequireAllFlags } from '@/components/features/FeatureFlag';
import { useFeatureFlags, FEATURE_FLAGS } from '@/hooks/useFeatureFlags';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { InfoIcon, SparklesIcon } from 'lucide-react';

export default function AIResumeBuilderPage() {
  const { isEnabled } = useFeatureFlags();

  return (
    <div className="container mx-auto py-8">
      <FeatureFlag
        flag={FEATURE_FLAGS.AI_RESUME_BUILDER}
        fallback={
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Feature Not Available</AlertTitle>
            <AlertDescription>
              The AI Resume Builder is not currently available. Please check back
              later.
            </AlertDescription>
          </Alert>
        }
      >
        <h1 className="text-3xl font-bold mb-8">AI Resume Builder</h1>

        {/* Resume Optimization Section */}
        <FeatureFlag flag={FEATURE_FLAGS.RESUME_OPTIMIZATION}>
          <div className="mb-8 p-6 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="h-5 w-5" />
              <h2 className="text-2xl font-semibold">AI Resume Optimization</h2>
            </div>
            <p className="mb-4">
              Let our AI analyze and optimize your resume for better results.
            </p>
            {/* Add your resume optimization UI */}
          </div>
        </FeatureFlag>

        {/* AI Suggestions Section */}
        <FeatureFlag flag={FEATURE_FLAGS.AI_SUGGESTIONS}>
          <div className="mb-8 p-6 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="h-5 w-5" />
              <h2 className="text-2xl font-semibold">AI Suggestions</h2>
            </div>
            <p className="mb-4">
              Get AI-powered suggestions to improve your resume content.
            </p>
            {/* Add your AI suggestions UI */}
          </div>
        </FeatureFlag>

        {/* Premium Templates - Only for premium users */}
        <FeatureFlag
          flag={FEATURE_FLAGS.PREMIUM_TEMPLATES}
          fallback={
            <Alert className="mb-4">
              <AlertDescription>
                Premium templates are available with a Pro subscription.
              </AlertDescription>
            </Alert>
          }
        >
          <div className="mb-8 p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Premium Templates</h2>
            <p className="mb-4">
              Access our collection of premium resume templates.
            </p>
            {/* Add your premium templates UI */}
          </div>
        </FeatureFlag>

        {/* Feature Availability Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Available Features:</h3>
          <ul className="space-y-1">
            {isEnabled(FEATURE_FLAGS.RESUME_OPTIMIZATION) && (
              <li>✓ AI Resume Optimization</li>
            )}
            {isEnabled(FEATURE_FLAGS.AI_SUGGESTIONS) && (
              <li>✓ AI Suggestions</li>
            )}
            {isEnabled(FEATURE_FLAGS.PREMIUM_TEMPLATES) && (
              <li>✓ Premium Templates</li>
            )}
          </ul>
        </div>
      </FeatureFlag>
    </div>
  );
}

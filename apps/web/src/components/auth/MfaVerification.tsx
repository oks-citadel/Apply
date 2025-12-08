'use client';

import { useState } from 'react';
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TOTPInput } from '@/components/ui/TOTPInput';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

interface MfaVerificationProps {
  onVerify: (code: string) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
  email?: string;
}

export function MfaVerification({
  onVerify,
  onCancel,
  isLoading = false,
  error,
  email,
}: MfaVerificationProps) {
  const [code, setCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleCodeComplete = async (completedCode: string) => {
    setVerifyError(null);
    try {
      await onVerify(completedCode);
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed. Please try again.');
      setCode('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      await handleCodeComplete(code);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            {email && (
              <span className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                {email}
              </span>
            )}
            Enter the verification code from your authenticator app
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || verifyError) && (
              <div
                className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                role="alert"
              >
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error || verifyError}
                </p>
              </div>
            )}

            <TOTPInput
              length={6}
              value={code}
              onChange={setCode}
              onComplete={handleCodeComplete}
              disabled={isLoading}
              error={verifyError || error}
              autoFocus
            />

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={code.length !== 6 || isLoading}
                loading={isLoading}
              >
                Verify and Sign In
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Having trouble? Contact support for assistance.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

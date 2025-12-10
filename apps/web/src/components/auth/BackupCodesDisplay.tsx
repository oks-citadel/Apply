'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface BackupCodesDisplayProps {
  codes: string[];
  onComplete?: () => void;
}

export function BackupCodesDisplay({ codes, onComplete }: BackupCodesDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleCopy = async () => {
    const codesText = codes.join('\n');
    await navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const codesText = `ApplyForUs Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${codes.join('\n')}\n\nEach code can only be used once.`;
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applyforus-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Warning */}
      <div
        className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        role="alert"
      >
        <svg
          className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
            Save your backup codes
          </h4>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
            Store these codes in a safe place. Each code can only be used once. If you lose access
            to your authenticator app, you can use these codes to sign in.
          </p>
        </div>
      </div>

      {/* Codes Display */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {codes.length} backup codes
          </span>
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-expanded={visible}
            aria-controls="backup-codes-list"
          >
            {visible ? 'Hide codes' : 'Show codes'}
          </button>
        </div>

        <div id="backup-codes-list">
          {visible ? (
            <div className="grid grid-cols-2 gap-2" role="list" aria-label="Backup codes">
              {codes.map((code, index) => (
                <div
                  key={index}
                  role="listitem"
                  className="font-mono text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 text-center select-all"
                >
                  {code}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg
                className="w-8 h-8 mx-auto mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <p className="text-sm">Click &quot;Show codes&quot; to reveal</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          disabled={!visible}
          className="flex-1"
          aria-label={copied ? 'Codes copied to clipboard' : 'Copy backup codes to clipboard'}
        >
          {copied ? 'Copied!' : 'Copy codes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleDownload}
          disabled={!visible}
          className="flex-1"
          aria-label="Download backup codes as text file"
        >
          Download
        </Button>
      </div>

      {onComplete && (
        <Button type="button" onClick={onComplete} className="w-full">
          I&apos;ve saved my backup codes
        </Button>
      )}
    </div>
  );
}

export default BackupCodesDisplay;

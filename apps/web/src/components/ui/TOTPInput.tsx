'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TOTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  autoFocus?: boolean;
}

export function TOTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  label,
  autoFocus = false,
}: TOTPInputProps) {
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(autoFocus ? 0 : null);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  React.useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input
  React.useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Handle value completion
  React.useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const digit = newValue.replace(/\D/g, '').slice(-1);

    if (digit === '' && newValue === '') {
      // Handle backspace
      const newOtp = value.split('');
      newOtp[index] = '';
      onChange(newOtp.join(''));

      // Move to previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (digit) {
      const newOtp = value.split('');
      newOtp[index] = digit;
      const finalValue = newOtp.join('');
      onChange(finalValue);

      // Move to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    onChange(pastedData);

    // Focus the next empty input or last input
    const nextEmptyIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextEmptyIndex]?.focus();
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
        </label>
      )}
      <div className="flex gap-2 justify-center">
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            disabled={disabled}
            className={cn(
              'w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 transition-all',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-white',
              'placeholder:text-gray-400 dark:placeholder:text-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : focusedIndex === index
                ? 'border-primary-500 ring-2 ring-primary-500'
                : 'border-gray-300 dark:border-gray-700 focus:border-primary-500 focus:ring-primary-500',
              disabled && 'opacity-50 cursor-not-allowed',
              value[index] && 'border-primary-400 dark:border-primary-600'
            )}
            aria-label={`Digit ${index + 1} of ${length}`}
            aria-invalid={error ? 'true' : 'false'}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Enter the 6-digit code from your authenticator app
      </p>
    </div>
  );
}

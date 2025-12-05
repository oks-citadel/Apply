import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password - JobPilot AI',
  description: 'Reset your JobPilot AI password',
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <Link
        href="/login"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to login
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Reset your password
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}

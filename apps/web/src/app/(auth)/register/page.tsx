import Link from 'next/link';
import { RegisterForm } from '@/components/forms/RegisterForm';

export const metadata = {
  title: 'Sign Up - JobPilot AI',
  description: 'Create your JobPilot AI account',
};

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create your account
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Start your AI-powered job search journey today
        </p>
      </div>

      <RegisterForm />

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
        </span>
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

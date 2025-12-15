import Link from 'next/link';
import { LoginForm } from '@/components/forms/LoginForm';

export const metadata = {
  title: 'Login - ApplyForUs',
  description: 'Sign in to your ApplyForUs account',
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sign in to continue your job search journey
        </p>
      </div>

      <LoginForm />

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
        </span>
        <Link
          href="/register"
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
        >
          Sign up for free
        </Link>
      </div>
    </div>
  );
}

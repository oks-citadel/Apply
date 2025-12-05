import React, { useState } from 'react';
import { useExtensionStore } from '../store';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useExtensionStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      // Error is handled in store
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center bg-gradient-to-br from-primary-50 to-white p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/icons/icon128.png"
            alt="JobPilot AI"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to JobPilot AI
          </h2>
          <p className="text-sm text-gray-600">
            Sign in to start auto-applying to jobs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="text-error-600 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="btn btn-primary w-full"
          >
            {isLoading ? (
              <>
                <span className="spinner mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            Don't have an account?{' '}
            <a
              href="https://jobpilot.ai/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

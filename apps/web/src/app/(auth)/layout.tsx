import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-12 text-white flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold">
            <Sparkles className="w-8 h-8" />
            <span>ApplyForUs</span>
          </Link>
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-4">
            Your AI-Powered Job Application Assistant
          </h2>
          <p className="text-primary-100 text-lg">
            Streamline your job search with intelligent resume customization,
            automated cover letters, and smart application tracking.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
              ✓
            </div>
            <div>
              <h3 className="font-semibold">AI-Powered Customization</h3>
              <p className="text-primary-100 text-sm">
                Tailor your resume and cover letter for each job in seconds
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
              ✓
            </div>
            <div>
              <h3 className="font-semibold">Smart Application Tracking</h3>
              <p className="text-primary-100 text-sm">
                Keep all your applications organized in one place
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
              ✓
            </div>
            <div>
              <h3 className="font-semibold">Job Search Made Easy</h3>
              <p className="text-primary-100 text-sm">
                Discover opportunities from multiple platforms in one dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-primary-600">
              <Sparkles className="w-8 h-8" />
              <span>ApplyForUs</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

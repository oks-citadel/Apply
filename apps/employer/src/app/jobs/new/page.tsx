'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { JobForm } from '@/components/jobs/JobForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    // Mock API call - replace with actual implementation
    console.log('Creating job:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/jobs');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64 pt-16">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/jobs"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create New Job Posting</h1>
            <p className="mt-2 text-gray-600">
              Fill in the details to create a new job posting
            </p>
          </div>

          {/* Form */}
          <div className="max-w-4xl">
            <JobForm onSubmit={handleSubmit} />
          </div>
        </main>
      </div>
    </div>
  );
}

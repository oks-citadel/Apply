'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { JobForm } from '@/components/jobs/JobForm';
import { ArrowLeft, Eye, Users, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function EditJobPage({ params }: { params: { id: string } }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // Mock data - replace with actual API call
  const job = {
    id: params.id,
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'Full-time',
    experienceLevel: 'Senior',
    salary: '$120k - $160k',
    description:
      'We are looking for an experienced Frontend Developer to join our team...',
    requirements: [
      '5+ years of experience with React',
      'Strong TypeScript skills',
      'Experience with Next.js',
    ],
    responsibilities: [
      'Build and maintain user interfaces',
      'Collaborate with design team',
      'Code reviews and mentoring',
    ],
    benefits: ['Health insurance', '401k matching', 'Unlimited PTO'],
    applications: 45,
    views: 234,
    status: 'active',
    postedDate: '2024-01-15',
  };

  const handleSubmit = async (data: any) => {
    console.log('Updating job:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this job?')) {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push('/jobs');
    }
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <p className="mt-2 text-gray-600">Manage job posting details</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href={`/jobs/${params.id}/applications`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Applications ({job.applications})
                </Link>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {job.applications}
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="text-2xl font-bold text-gray-900">{job.views}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-2xl font-bold text-green-600 capitalize">
                    {job.status}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl">
            {isEditing ? (
              <JobForm
                initialData={job}
                onSubmit={handleSubmit}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Job Details
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Edit
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Title</h3>
                    <p className="mt-1 text-gray-900">{job.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Department
                      </h3>
                      <p className="mt-1 text-gray-900">{job.department}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Location
                      </h3>
                      <p className="mt-1 text-gray-900">{job.location}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Type</h3>
                      <p className="mt-1 text-gray-900">{job.type}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Salary</h3>
                      <p className="mt-1 text-gray-900">{job.salary}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Description
                    </h3>
                    <p className="mt-1 text-gray-900">{job.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

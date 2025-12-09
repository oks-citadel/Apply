'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import Link from 'next/link';

export default function JobApplicationsPage({
  params,
}: {
  params: { id: string };
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - replace with actual API call
  const jobTitle = 'Senior Frontend Developer';
  const applications = [
    {
      id: '1',
      candidateId: 'c1',
      candidateName: 'John Doe',
      candidateEmail: 'john@example.com',
      candidateAvatar: '',
      experience: '5 years',
      education: 'BS Computer Science',
      appliedDate: '2024-01-20T10:00:00Z',
      status: 'pending' as const,
      resumeUrl: '/resumes/john-doe.pdf',
      coverLetter: 'I am excited to apply for this position...',
    },
    {
      id: '2',
      candidateId: 'c2',
      candidateName: 'Jane Smith',
      candidateEmail: 'jane@example.com',
      candidateAvatar: '',
      experience: '7 years',
      education: 'MS Software Engineering',
      appliedDate: '2024-01-19T14:30:00Z',
      status: 'reviewing' as const,
      resumeUrl: '/resumes/jane-smith.pdf',
      coverLetter: 'With my extensive experience in React...',
    },
    {
      id: '3',
      candidateId: 'c3',
      candidateName: 'Mike Johnson',
      candidateEmail: 'mike@example.com',
      candidateAvatar: '',
      experience: '6 years',
      education: 'BS Information Technology',
      appliedDate: '2024-01-18T09:15:00Z',
      status: 'shortlisted' as const,
      resumeUrl: '/resumes/mike-johnson.pdf',
      coverLetter: 'I have been working with Next.js for the past 3 years...',
    },
    {
      id: '4',
      candidateId: 'c4',
      candidateName: 'Sarah Williams',
      candidateEmail: 'sarah@example.com',
      candidateAvatar: '',
      experience: '4 years',
      education: 'BS Computer Engineering',
      appliedDate: '2024-01-17T16:45:00Z',
      status: 'rejected' as const,
      resumeUrl: '/resumes/sarah-williams.pdf',
      coverLetter: 'I would love to join your team...',
    },
  ];

  const filteredApplications =
    statusFilter === 'all'
      ? applications
      : applications.filter((app) => app.status === statusFilter);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    reviewing: applications.filter((a) => a.status === 'reviewing').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const handleExportCSV = () => {
    // Mock CSV export
    console.log('Exporting applications to CSV...');
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
              href={`/jobs/${params.id}`}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Job
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Applications for {jobTitle}
                </h1>
                <p className="mt-2 text-gray-600">
                  Review and manage candidate applications
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Reviewing</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.reviewing}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Shortlisted</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.shortlisted}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.rejected}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Applications List */}
          <ApplicationList applications={filteredApplications} jobId={params.id} />
        </main>
      </div>
    </div>
  );
}

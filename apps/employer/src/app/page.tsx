'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Briefcase,
  Users,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const stats = [
    {
      name: 'Active Jobs',
      value: '12',
      change: '+2 this week',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total Applications',
      value: '248',
      change: '+18 today',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Profile Views',
      value: '1,234',
      change: '+125 this week',
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Hired This Month',
      value: '8',
      change: '+3 from last month',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const recentJobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      applications: 45,
      views: 234,
      status: 'active',
      postedDate: '2 days ago',
    },
    {
      id: 2,
      title: 'Product Manager',
      applications: 32,
      views: 189,
      status: 'active',
      postedDate: '5 days ago',
    },
    {
      id: 3,
      title: 'UX Designer',
      applications: 28,
      views: 156,
      status: 'closed',
      postedDate: '1 week ago',
    },
  ];

  const recentApplications = [
    {
      id: 1,
      candidateName: 'John Doe',
      jobTitle: 'Senior Frontend Developer',
      appliedDate: '2 hours ago',
      status: 'pending',
    },
    {
      id: 2,
      candidateName: 'Jane Smith',
      jobTitle: 'Product Manager',
      appliedDate: '5 hours ago',
      status: 'reviewing',
    },
    {
      id: 3,
      candidateName: 'Mike Johnson',
      jobTitle: 'UX Designer',
      appliedDate: '1 day ago',
      status: 'shortlisted',
    },
    {
      id: 4,
      candidateName: 'Sarah Williams',
      jobTitle: 'Senior Frontend Developer',
      appliedDate: '1 day ago',
      status: 'rejected',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'reviewing':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'shortlisted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64 pt-16">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back! Here's what's happening with your jobs today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Jobs */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {job.title}
                          </h3>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>{job.applications} applications</span>
                            <span>•</span>
                            <span>{job.views} views</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Posted {job.postedDate}
                          </p>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700">
                  View all jobs →
                </button>
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Applications
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                              {application.candidateName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {application.candidateName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {application.jobTitle}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {application.appliedDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(application.status)}
                          {getStatusBadge(application.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700">
                  View all applications →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

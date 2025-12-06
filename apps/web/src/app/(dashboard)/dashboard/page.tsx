'use client';

import { FileText, Briefcase, Send, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useDashboardStats } from '@/hooks/useUser';
import { useApplications } from '@/hooks/useApplications';
import { useJobs } from '@/hooks/useJobs';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: applications, isLoading: applicationsLoading } = useApplications({ limit: 3, sortBy: 'appliedAt', sortOrder: 'desc' });
  const { data: recommendedJobs, isLoading: jobsLoading } = useJobs({ limit: 3 });

  const isLoading = statsLoading || applicationsLoading || jobsLoading;

  // Fallback stats if API not available
  const dashboardStats = stats || {
    totalResumes: 0,
    jobsSaved: 0,
    applicationsSent: 0,
    responseRate: 0,
  };

  const recentApplications = applications?.applications || [];
  const jobs = recommendedJobs?.jobs || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's your job search overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Resumes"
          value={statsLoading ? '...' : String(dashboardStats.totalResumes)}
          icon={<FileText className="w-5 h-5" />}
          loading={statsLoading}
        />
        <StatCard
          title="Jobs Saved"
          value={statsLoading ? '...' : String(dashboardStats.jobsSaved)}
          icon={<Briefcase className="w-5 h-5" />}
          loading={statsLoading}
        />
        <StatCard
          title="Applications Sent"
          value={statsLoading ? '...' : String(dashboardStats.applicationsSent)}
          icon={<Send className="w-5 h-5" />}
          loading={statsLoading}
        />
        <StatCard
          title="Response Rate"
          value={statsLoading ? '...' : `${dashboardStats.responseRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          loading={statsLoading}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with your job search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/resumes">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <FileText className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Create Resume</div>
                  <div className="text-sm text-gray-500">Build a new resume</div>
                </div>
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Briefcase className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Search Jobs</div>
                  <div className="text-sm text-gray-500">Find opportunities</div>
                </div>
              </Button>
            </Link>
            <Link href="/applications">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Send className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">View Applications</div>
                  <div className="text-sm text-gray-500">Track your progress</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((app: any) => (
                  <ActivityItem
                    key={app.id}
                    title={app.jobTitle || app.job?.title || 'Untitled Position'}
                    company={app.company || app.job?.company || 'Unknown Company'}
                    status={app.status || 'Applied'}
                    date={formatDate(app.appliedAt || app.createdAt)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No applications yet</p>
                <Link href="/jobs">
                  <Button variant="link" className="mt-2">Start applying to jobs</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Jobs</CardTitle>
            <CardDescription>Based on your profile</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job: any) => (
                  <JobItem
                    key={job.id}
                    title={job.title}
                    company={job.company}
                    location={job.location}
                    salary={formatSalary(job.salaryMin, job.salaryMax)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No job recommendations yet</p>
                <Link href="/jobs">
                  <Button variant="link" className="mt-2">Browse all jobs</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
          <div className="text-gray-400">{icon}</div>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            value
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  title,
  company,
  status,
  date,
}: {
  title: string;
  company: string;
  status: string;
  date: string;
}) {
  const statusColors: Record<string, string> = {
    'Applied': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'Under Review': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'Interview Scheduled': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    'Offered': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };

  return (
    <div className="flex items-start justify-between pb-4 border-b last:border-0">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{company}</p>
      </div>
      <div className="text-right">
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
          {status}
        </span>
        <p className="text-xs text-gray-500 mt-1">{date}</p>
      </div>
    </div>
  );
}

function JobItem({
  title,
  company,
  location,
  salary,
}: {
  title: string;
  company: string;
  location: string;
  salary: string;
}) {
  return (
    <div className="flex items-start justify-between pb-4 border-b last:border-0">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{company}</p>
        <p className="text-xs text-gray-500 mt-1">{location}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{salary}</p>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Competitive';
  const formatNum = (n: number) => {
    if (n >= 1000) return `$${Math.round(n / 1000)}k`;
    return `$${n}`;
  };
  if (min && max) return `${formatNum(min)} - ${formatNum(max)}`;
  if (min) return `From ${formatNum(min)}`;
  if (max) return `Up to ${formatNum(max)}`;
  return 'Competitive';
}

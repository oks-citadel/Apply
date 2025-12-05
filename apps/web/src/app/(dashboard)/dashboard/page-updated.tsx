'use client';

import { FileText, Briefcase, Send, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';
import { useApplicationAnalytics, useApplications } from '@/hooks/useApplications';
import { useResumes } from '@/hooks/useResumes';
import { useSavedJobs, useRecommendedJobs } from '@/hooks/useJobs';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useApplicationAnalytics();
  const { data: resumesData, isLoading: resumesLoading } = useResumes({ limit: 1 });
  const { data: savedJobsData, isLoading: savedJobsLoading } = useSavedJobs({ limit: 1 });
  const { data: recentApplications, isLoading: applicationsLoading } = useApplications({ limit: 3, sortBy: 'appliedAt', sortOrder: 'desc' });
  const { data: recommendedJobs, isLoading: recommendedLoading } = useRecommendedJobs({ limit: 3 });

  const isLoading = analyticsLoading || resumesLoading || savedJobsLoading;

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
      {analyticsError && !isLoading ? (
        <ErrorState
          title="Failed to load analytics"
          message="Unable to fetch your dashboard statistics."
          onRetry={refetchAnalytics}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-5 rounded" />
                    </div>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Total Resumes"
                value={resumesData?.total?.toString() || '0'}
                icon={<FileText className="w-5 h-5" />}
                trend={resumesData?.total ? `${resumesData.total} resume${resumesData.total !== 1 ? 's' : ''}` : 'No resumes yet'}
              />
              <StatCard
                title="Jobs Saved"
                value={savedJobsData?.total?.toString() || '0'}
                icon={<Briefcase className="w-5 h-5" />}
                trend={savedJobsData?.total ? `${savedJobsData.total} saved` : 'Start saving jobs'}
              />
              <StatCard
                title="Applications Sent"
                value={analytics?.overview?.totalApplications?.toString() || '0'}
                icon={<Send className="w-5 h-5" />}
                trend={analytics?.overview?.activeApplications ? `${analytics.overview.activeApplications} active` : 'No applications'}
              />
              <StatCard
                title="Response Rate"
                value={analytics?.overview?.responseRate ? `${Math.round(analytics.overview.responseRate)}%` : '0%'}
                icon={<TrendingUp className="w-5 h-5" />}
                trend={analytics?.overview?.interviews ? `${analytics.overview.interviews} interview${analytics.overview.interviews !== 1 ? 's' : ''}` : 'No responses yet'}
              />
            </>
          )}
        </div>
      )}

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
            <Link href="/dashboard/resumes">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <FileText className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Create Resume</div>
                  <div className="text-sm text-gray-500">Build a new resume</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/jobs">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Briefcase className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Search Jobs</div>
                  <div className="text-sm text-gray-500">Find opportunities</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/applications">
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
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="pb-4 border-b last:border-0">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : !recentApplications?.applications?.length ? (
              <EmptyState
                icon={Send}
                title="No applications yet"
                description="Start applying to jobs to see them here"
                action={{
                  label: 'Browse Jobs',
                  onClick: () => window.location.href = '/dashboard/jobs',
                }}
              />
            ) : (
              <div className="space-y-4">
                {recentApplications.applications.slice(0, 3).map((app) => (
                  <ActivityItem
                    key={app.id}
                    title={app.job.title}
                    company={app.job.company}
                    status={app.status}
                    date={formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                  />
                ))}
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
            {recommendedLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="pb-4 border-b last:border-0">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : !recommendedJobs?.jobs?.length ? (
              <EmptyState
                icon={Briefcase}
                title="No recommendations yet"
                description="Create a resume to get personalized job recommendations"
                action={{
                  label: 'Create Resume',
                  onClick: () => window.location.href = '/dashboard/resumes',
                }}
              />
            ) : (
              <div className="space-y-4">
                {recommendedJobs.jobs.slice(0, 3).map((job) => (
                  <JobItem
                    key={job.id}
                    title={job.title}
                    company={job.company}
                    location={job.location}
                    salary={job.salary ? `${job.salary.currency}${job.salary.min/1000}k - ${job.salary.max/1000}k` : 'Not specified'}
                  />
                ))}
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
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
          <div className="text-gray-400">{icon}</div>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
        <p className="text-xs text-gray-500">{trend}</p>
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
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    screening: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="flex items-start justify-between pb-4 border-b last:border-0">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{company}</p>
      </div>
      <div className="text-right">
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColors[status] || statusColors.applied}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
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

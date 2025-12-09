'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  Settings,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
  Loader2,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useAutoApplyStatus,
  useStartAutoApply,
  useStopAutoApply,
  useAutoApplySettings,
  useApplications,
} from '@/hooks/useApplications';

export default function AutoApplyPage() {
  const { data: status, isLoading: statusLoading } = useAutoApplyStatus();
  const { data: settings, isLoading: settingsLoading } = useAutoApplySettings();
  const { data: applicationsData } = useApplications({
    source: ['auto-apply'],
    limit: 5,
    sortBy: 'appliedAt',
    sortOrder: 'desc',
  });

  const startAutoApply = useStartAutoApply();
  const stopAutoApply = useStopAutoApply();

  const isRunning = status?.isRunning || false;
  const isLoading = statusLoading || settingsLoading;
  const recentApplications = applicationsData?.applications || [];

  const handleToggleAutoApply = async () => {
    if (isRunning) {
      await stopAutoApply.mutateAsync();
    } else {
      await startAutoApply.mutateAsync(undefined);
    }
  };

  const stats = {
    today: status?.applicationsToday || 0,
    total: status?.totalApplications || 0,
    successRate: status?.successRate || 0,
    maxPerDay: settings?.maxApplicationsPerDay || 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Auto-Apply
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Automatically apply to jobs that match your criteria
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/auto-apply/settings">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Button
            onClick={handleToggleAutoApply}
            disabled={isLoading || startAutoApply.isPending || stopAutoApply.isPending}
            variant={isRunning ? 'destructive' : 'default'}
          >
            {startAutoApply.isPending || stopAutoApply.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isRunning ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Stop Auto-Apply' : 'Start Auto-Apply'}
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {isRunning && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Auto-Apply is Active
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  The system is automatically applying to matching jobs based on your criteria.
                  {status?.nextRunAt && (
                    <> Next check: {new Date(status.nextRunAt).toLocaleTimeString()}</>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Applications Today"
          value={stats.today}
          max={stats.maxPerDay}
          icon={<Clock className="w-5 h-5" />}
          loading={isLoading}
        />
        <StatCard
          title="Total Auto-Applied"
          value={stats.total}
          icon={<CheckCircle className="w-5 h-5" />}
          loading={isLoading}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          loading={isLoading}
        />
        <StatCard
          title="Status"
          value={isRunning ? 'Running' : 'Stopped'}
          icon={<Activity className="w-5 h-5" />}
          loading={isLoading}
          valueColor={isRunning ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}
        />
      </div>

      {/* Quick Settings Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Settings</CardTitle>
              <CardDescription>Current auto-apply configuration</CardDescription>
            </div>
            <Link href="/auto-apply/settings">
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : !settings?.enabled ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Auto-apply is not configured yet
              </p>
              <Link href="/auto-apply/settings">
                <Button>Configure Settings</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <SettingItem
                label="Job Titles"
                value={
                  settings.filters.jobTitle?.length
                    ? settings.filters.jobTitle.slice(0, 3).join(', ') +
                      (settings.filters.jobTitle.length > 3
                        ? ` +${settings.filters.jobTitle.length - 3} more`
                        : '')
                    : 'Any'
                }
              />
              <SettingItem
                label="Locations"
                value={
                  settings.filters.location?.length
                    ? settings.filters.location.slice(0, 2).join(', ') +
                      (settings.filters.location.length > 2
                        ? ` +${settings.filters.location.length - 2} more`
                        : '')
                    : 'Any'
                }
              />
              <SettingItem
                label="Salary Range"
                value={
                  settings.filters.salaryMin
                    ? `$${(settings.filters.salaryMin / 1000).toFixed(0)}k+`
                    : 'Any'
                }
              />
              <SettingItem
                label="Daily Limit"
                value={settings.maxApplicationsPerDay?.toString() || 'Unlimited'}
              />
              <SettingItem
                label="Resume"
                value={settings.resumeId ? 'Selected' : 'Default'}
              />
              <SettingItem
                label="Cover Letter"
                value={settings.coverLetterTemplate ? 'Custom Template' : 'AI Generated'}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Auto-Applications */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Auto-Applications</CardTitle>
                <CardDescription>Latest jobs applied to automatically</CardDescription>
              </div>
              <Link href="/auto-apply/activity">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No auto-applications yet</p>
                <p className="text-sm mt-1">
                  {isRunning
                    ? 'The system is searching for matching jobs'
                    : 'Start auto-apply to begin'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app: any) => (
                  <ApplicationItem
                    key={app.id}
                    title={app.jobTitle || app.job?.title || 'Untitled Position'}
                    company={app.company || app.job?.company || 'Unknown Company'}
                    status={app.status}
                    appliedAt={app.appliedAt || app.createdAt}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips & Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>Tips for Success</CardTitle>
            <CardDescription>Maximize your auto-apply effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <TipItem
                icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                title="Be Specific"
                description="Target specific job titles and locations to improve match quality"
              />
              <TipItem
                icon={<FileText className="w-5 h-5 text-blue-500" />}
                title="Update Your Resume"
                description="Keep your resume current to maximize application success"
              />
              <TipItem
                icon={<Settings className="w-5 h-5 text-purple-500" />}
                title="Set Daily Limits"
                description="Pace your applications to avoid overwhelming yourself with responses"
              />
              <TipItem
                icon={<Activity className="w-5 h-5 text-orange-500" />}
                title="Monitor Activity"
                description="Regularly review auto-applications and follow up promptly"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  max,
  icon,
  loading,
  valueColor = 'text-gray-900 dark:text-white',
}: {
  title: string;
  value: string | number;
  max?: number;
  icon: React.ReactNode;
  loading?: boolean;
  valueColor?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
          <div className="text-gray-400">{icon}</div>
        </div>
        <div className={`text-3xl font-bold mb-1 ${valueColor}`}>
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : value}
          {max && typeof value === 'number' && (
            <span className="text-lg text-gray-500 ml-1">/ {max}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SettingItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function ApplicationItem({
  title,
  company,
  status,
  appliedAt,
}: {
  title: string;
  company: string;
  status: string;
  appliedAt: string;
}) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
      applied: 'default',
      screening: 'warning',
      interview: 'success',
      rejected: 'destructive',
      withdrawn: 'secondary',
    };
    return variants[status] || 'default';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-start justify-between pb-4 border-b last:border-0 dark:border-gray-800">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{company}</p>
        <p className="text-xs text-gray-500 mt-1">{formatDate(appliedAt)}</p>
      </div>
      <Badge variant={getStatusBadge(status)} size="sm">
        {status}
      </Badge>
    </div>
  );
}

function TipItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="font-medium text-gray-900 dark:text-white text-sm">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}

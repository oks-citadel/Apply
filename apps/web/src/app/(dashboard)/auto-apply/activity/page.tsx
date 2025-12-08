'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Filter,
  Download,
  ArrowLeft,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useApplications, useExportApplications } from '@/hooks/useApplications';
import type { ApplicationStatus } from '@/types/application';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default function AutoApplyActivityPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useApplications({
    source: ['auto-apply'],
    status: statusFilter === 'all' ? undefined : [statusFilter as ApplicationStatus],
    search: searchTerm || undefined,
    page,
    limit: 20,
    sortBy: 'appliedAt',
    sortOrder: 'desc',
  });

  const exportApplications = useExportApplications();

  const applications = data?.applications || [];
  const totalApplications = data?.total || 0;
  const hasMore = applications.length < totalApplications;

  const handleExport = () => {
    exportApplications.mutate({
      format: 'csv',
      filters: {
        source: ['auto-apply'],
        status: statusFilter === 'all' ? undefined : [statusFilter as ApplicationStatus],
      },
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { icon: React.ReactNode; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; label: string }
    > = {
      applied: {
        icon: <Clock className="w-4 h-4" />,
        variant: 'default',
        label: 'Applied',
      },
      screening: {
        icon: <Eye className="w-4 h-4" />,
        variant: 'warning',
        label: 'Screening',
      },
      interview: {
        icon: <MessageSquare className="w-4 h-4" />,
        variant: 'success',
        label: 'Interview',
      },
      offer: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        variant: 'success',
        label: 'Offer',
      },
      rejected: {
        icon: <XCircle className="w-4 h-4" />,
        variant: 'destructive',
        label: 'Rejected',
      },
      withdrawn: {
        icon: <XCircle className="w-4 h-4" />,
        variant: 'secondary',
        label: 'Withdrawn',
      },
    };

    return (
      configs[status] || {
        icon: <Clock className="w-4 h-4" />,
        variant: 'default' as const,
        label: status,
      }
    );
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const groupApplicationsByDate = (apps: any[]) => {
    const grouped: Record<string, any[]> = {};

    apps.forEach((app) => {
      const date = formatDate(app.appliedAt || app.createdAt);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(app);
    });

    return grouped;
  };

  const groupedApplications = groupApplicationsByDate(applications);
  const dates = Object.keys(groupedApplications);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/auto-apply">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Auto-Apply Activity
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Timeline of all your automatic job applications
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exportApplications.isPending}>
          {exportApplications.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Applied"
          value={totalApplications}
          icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          label="In Progress"
          value={
            applications.filter((a) => ['applied', 'screening', 'interview'].includes(a.status))
              .length
          }
          icon={<Clock className="w-5 h-5 text-yellow-500" />}
        />
        <StatCard
          label="Interviews"
          value={applications.filter((a) => a.status === 'interview').length}
          icon={<MessageSquare className="w-5 h-5 text-green-500" />}
        />
        <StatCard
          label="Rejected"
          value={applications.filter((a) => a.status === 'rejected').length}
          icon={<XCircle className="w-5 h-5 text-red-500" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <Input
                placeholder="Search by company or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">Last 3 Months</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {isLoading ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          </CardContent>
        </Card>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No auto-applications found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {statusFilter !== 'all' || searchTerm
                ? 'Try adjusting your filters'
                : 'Start auto-apply to see your applications here'}
            </p>
            {statusFilter !== 'all' || searchTerm ? (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Link href="/auto-apply">
                <Button>Go to Auto-Apply</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {dates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{date}</h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                <Badge variant="secondary" size="sm">
                  {groupedApplications[date].length}
                </Badge>
              </div>

              <div className="space-y-3">
                {groupedApplications[date].map((app: any) => {
                  const statusConfig = getStatusConfig(app.status);

                  return (
                    <Card
                      key={app.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          {/* Timeline dot */}
                          <div className="flex-shrink-0 pt-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {app.jobTitle || app.job?.title || 'Untitled Position'}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Building2 className="w-4 h-4" />
                                    <span>{app.company || app.job?.company || 'Unknown'}</span>
                                  </div>
                                  {app.job?.location && (
                                    <div className="flex items-center gap-1">
                                      <span>{app.job.location}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTime(app.appliedAt || app.createdAt)}</span>
                                  </div>
                                </div>
                              </div>

                              <Badge variant={statusConfig.variant} size="sm">
                                {statusConfig.icon}
                                <span className="ml-1">{statusConfig.label}</span>
                              </Badge>
                            </div>

                            {/* Additional Info */}
                            {app.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {app.notes}
                              </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3">
                              <Link href={`/applications/${app.id}`}>
                                <Button variant="ghost" size="sm">
                                  View Details
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Showing {applications.length} of {totalApplications} applications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className="flex-shrink-0">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

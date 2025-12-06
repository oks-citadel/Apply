'use client';

import { useState, useCallback } from 'react';
import { Filter, Download, MoreVertical, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { useApplications, useWithdrawApplication, useExportApplications, useApplicationAnalytics } from '@/hooks/useApplications';
import type { ApplicationStatus, ApplicationFilters } from '@/types/application';

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const filters: ApplicationFilters = {
    status: statusFilter === 'all' ? undefined : [statusFilter as ApplicationStatus],
    page,
    limit: 20,
    sortBy: 'appliedAt',
    sortOrder: 'desc',
  };

  const { data, isLoading, isFetching } = useApplications(filters);

  const { data: analytics, isLoading: analyticsLoading } = useApplicationAnalytics();
  const withdrawApplication = useWithdrawApplication();
  const exportApplications = useExportApplications();

  const applications = data?.applications || [];
  const totalApplications = data?.total || 0;

  const handleWithdraw = useCallback((id: string) => {
    if (confirm('Are you sure you want to withdraw this application?')) {
      withdrawApplication.mutate({ id });
    }
  }, [withdrawApplication]);

  const handleExport = useCallback((format: 'csv' | 'xlsx' | 'json') => {
    const exportFilters: ApplicationFilters | undefined = statusFilter === 'all'
      ? undefined
      : { status: [statusFilter as ApplicationStatus] };
    exportApplications.mutate({
      format,
      filters: exportFilters,
    });
  }, [exportApplications, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      applied: { label: 'Applied', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      reviewing: { label: 'Under Review', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
      interview: { label: 'Interview', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
      offer: { label: 'Offer Received', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
      withdrawn: { label: 'Withdrawn', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
    };

    const variant = variants[status] || variants.applied;
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${variant.className}`}>
        {variant.label}
      </span>
    );
  };

  const defaultStats = {
    total: totalApplications,
    applied: 0,
    reviewing: 0,
    interview: 0,
    offer: 0,
  };

  // Extract stats from analytics or use default
  const stats = analytics ? {
    total: analytics.overview?.totalApplications || totalApplications,
    applied: analytics.statusBreakdown?.find(s => s.status === 'applied')?.count || 0,
    reviewing: analytics.statusBreakdown?.find(s => s.status === 'screening')?.count || 0,
    interview: analytics.statusBreakdown?.find(s => s.status === 'interview')?.count || 0,
    offer: analytics.statusBreakdown?.find(s => s.status === 'offer')?.count || 0,
  } : defaultStats;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage your job applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportApplications.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportApplications.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total" value={stats.total} loading={analyticsLoading} />
        <StatCard label="Applied" value={stats.applied} loading={analyticsLoading} />
        <StatCard label="Under Review" value={stats.reviewing} loading={analyticsLoading} />
        <StatCard label="Interview" value={stats.interview} loading={analyticsLoading} />
        <StatCard label="Offers" value={stats.offer} loading={analyticsLoading} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 max-w-xs"
            >
              <option value="all">All Applications</option>
              <option value="applied">Applied</option>
              <option value="reviewing">Under Review</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer Received</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">No applications found</p>
              <Button variant="outline" onClick={() => setStatusFilter('all')}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resume Used</TableHead>
                    <TableHead>Next Step</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app: any) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.jobTitle || app.job?.title || 'Untitled'}</TableCell>
                      <TableCell>{app.company || app.job?.company || 'Unknown'}</TableCell>
                      <TableCell>{formatDate(app.appliedAt || app.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {app.resumeUsed || app.resume?.name || 'Default Resume'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {app.nextStep || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {app.status !== 'withdrawn' && app.status !== 'rejected' && app.status !== 'offer' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWithdraw(app.id)}
                              disabled={withdrawApplication.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination info */}
      {!isLoading && applications.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {applications.length} of {totalApplications} applications
          {isFetching && <Loader2 className="w-4 h-4 inline ml-2 animate-spin" />}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : value}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
        </div>
      </CardContent>
    </Card>
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

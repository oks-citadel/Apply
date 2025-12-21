'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Flag,
  X,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { useJobReports, useUpdateReportStatus } from '@/hooks/useJobs';
import type { JobReport } from '@/types/job';

const statusColors: Record<string, 'warning' | 'success' | 'default' | 'secondary'> = {
  pending: 'warning',
  reviewing: 'secondary',
  resolved: 'success',
  dismissed: 'default',
};

const reasonLabels = {
  spam: 'Spam/Scam',
  misleading: 'Misleading Info',
  discriminatory: 'Discriminatory',
  expired: 'Expired/Closed',
  duplicate: 'Duplicate',
  other: 'Other',
} as const;

export default function JobReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<JobReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data, isLoading, error, refetch } = useJobReports({
    page: currentPage,
    limit: 20,
    status: statusFilter || undefined,
    reason: reasonFilter || undefined,
  });

  const updateStatus = useUpdateReportStatus();

  const handleUpdateStatus = async (
    reportId: string,
    status: 'reviewing' | 'resolved' | 'dismissed'
  ) => {
    await updateStatus.mutateAsync({ reportId, status });
    setShowDetailModal(false);
    setSelectedReport(null);
  };

  const handleViewDetails = (report: JobReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setReasonFilter('');
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Reports</h1>
        </div>
        <Card>
          <CardContent>
            <ErrorState
              title="Failed to load reports"
              message="We couldn't load the job reports. Please try again."
              onRetry={() => refetch()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage reported job listings and moderate content
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? '...' : data?.total || 0}
                </p>
              </div>
              <Flag className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {isLoading
                    ? '...'
                    : data?.reports.filter((r) => r.status === 'pending').length || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reviewing</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {isLoading
                    ? '...'
                    : data?.reports.filter((r) => r.status === 'reviewing').length || 0}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {isLoading
                    ? '...'
                    : data?.reports.filter((r) => r.status === 'resolved').length || 0}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters:
              </span>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </Select>
            <Select
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            >
              <option value="">All Reasons</option>
              <option value="spam">Spam/Scam</option>
              <option value="misleading">Misleading</option>
              <option value="discriminatory">Discriminatory</option>
              <option value="expired">Expired</option>
              <option value="duplicate">Duplicate</option>
              <option value="other">Other</option>
            </Select>
            {(statusFilter || reasonFilter) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !data?.reports || data.reports.length === 0 ? (
            <EmptyState
              title="No reports found"
              description={
                statusFilter || reasonFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'No job reports have been submitted yet.'
              }
              icon={Flag}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Company</th>
                      <th>Reason</th>
                      <th>Reported By</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {report.job?.title || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {report.job?.company || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline">
                            {reasonLabels[report.reason] || report.reason}
                          </Badge>
                        </td>
                        <td>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {report.user?.email || 'Anonymous'}
                          </div>
                        </td>
                        <td>
                          <Badge variant={statusColors[report.status]}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(report.createdAt), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(report)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {report.job && (
                              <Link href={`/jobs/${report.jobId}`} target="_blank">
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {data.total > 20 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(currentPage - 1) * 20 + 1} to{' '}
                    {Math.min(currentPage * 20, data.total)} of {data.total} reports
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage * 20 >= data.total}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <Modal
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReport(null);
          }}
          title="Report Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {selectedReport.job?.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Company: {selectedReport.job?.company}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Location: {selectedReport.job?.location}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason
              </label>
              <Badge variant="outline">
                {reasonLabels[selectedReport.reason] || selectedReport.reason}
              </Badge>
            </div>

            {selectedReport.details && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Details
                </label>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedReport.details}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reported By
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedReport.user?.email || 'Anonymous'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <Badge variant={statusColors[selectedReport.status]}>
                  {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                </Badge>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reported On
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {format(new Date(selectedReport.createdAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailModal(false);
                setSelectedReport(null);
              }}
            >
              Close
            </Button>
            {selectedReport.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'reviewing')}
                  disabled={updateStatus.isPending}
                >
                  Mark as Reviewing
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                  disabled={updateStatus.isPending}
                >
                  Resolve
                </Button>
              </>
            )}
            {selectedReport.status === 'reviewing' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                  disabled={updateStatus.isPending}
                >
                  Dismiss
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                  disabled={updateStatus.isPending}
                >
                  Resolve
                </Button>
              </>
            )}
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

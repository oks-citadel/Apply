'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useApplications } from '@/hooks/useApplications';
import { FileText, Loader2 } from 'lucide-react';

export function RecentAutoApplications({ limit = 5 }: { limit?: number }) {
  const { data, isLoading } = useApplications({
    source: ['auto-apply'],
    limit,
    sortBy: 'appliedAt',
    sortOrder: 'desc',
  });

  const applications = data?.applications || [];

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> =
      {
        applied: 'default',
        screening: 'warning',
        interview: 'success',
        rejected: 'destructive',
        withdrawn: 'secondary',
      };
    return variants[status] || 'default';
  };

  return (
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No auto-applications yet</p>
            <p className="text-sm mt-1">Start auto-apply to begin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app: any) => (
              <div
                key={app.id}
                className="flex items-start justify-between pb-4 border-b last:border-0 dark:border-gray-800"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {app.jobTitle || app.job?.title || 'Untitled Position'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {app.company || app.job?.company || 'Unknown Company'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(app.appliedAt || app.createdAt)}
                  </p>
                </div>
                <Badge variant={getStatusBadge(app.status)} size="sm">
                  {app.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

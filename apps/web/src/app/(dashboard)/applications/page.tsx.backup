'use client';

import { useState } from 'react';
import { Filter, Download, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';

type ApplicationStatus = 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: ApplicationStatus;
  resumeUsed: string;
  nextStep?: string;
}

export default function ApplicationsPage() {
  const [applications] = useState<Application[]>([
    {
      id: '1',
      jobTitle: 'Senior Frontend Developer',
      company: 'Tech Corp',
      appliedDate: '2024-01-20',
      status: 'interview',
      resumeUsed: 'Software Engineer Resume',
      nextStep: 'Technical Interview - Jan 25',
    },
    {
      id: '2',
      jobTitle: 'Full Stack Engineer',
      company: 'StartupXYZ',
      appliedDate: '2024-01-18',
      status: 'reviewing',
      resumeUsed: 'Full Stack Resume',
    },
    {
      id: '3',
      jobTitle: 'React Developer',
      company: 'Digital Agency',
      appliedDate: '2024-01-15',
      status: 'applied',
      resumeUsed: 'Frontend Developer Resume',
    },
    {
      id: '4',
      jobTitle: 'Software Engineer',
      company: 'Innovation Labs',
      appliedDate: '2024-01-10',
      status: 'offer',
      resumeUsed: 'Software Engineer Resume',
      nextStep: 'Offer expires Jan 30',
    },
    {
      id: '5',
      jobTitle: 'Frontend Developer',
      company: 'Design Studio',
      appliedDate: '2024-01-08',
      status: 'rejected',
      resumeUsed: 'Frontend Developer Resume',
    },
  ]);

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredApplications = applications.filter(
    (app) => statusFilter === 'all' || app.status === statusFilter
  );

  const getStatusBadge = (status: ApplicationStatus) => {
    const variants: Record<ApplicationStatus, { label: string; className: string }> = {
      applied: { label: 'Applied', className: 'bg-blue-100 text-blue-700' },
      reviewing: { label: 'Under Review', className: 'bg-yellow-100 text-yellow-700' },
      interview: { label: 'Interview', className: 'bg-purple-100 text-purple-700' },
      offer: { label: 'Offer Received', className: 'bg-green-100 text-green-700' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
    };

    const variant = variants[status];
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${variant.className}`}>
        {variant.label}
      </span>
    );
  };

  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === 'applied').length,
    reviewing: applications.filter((a) => a.status === 'reviewing').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    offer: applications.filter((a) => a.status === 'offer').length,
  };

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
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Applied" value={stats.applied} />
        <StatCard label="Under Review" value={stats.reviewing} />
        <StatCard label="Interview" value={stats.interview} />
        <StatCard label="Offers" value={stats.offer} />
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
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.jobTitle}</TableCell>
                    <TableCell>{app.company}</TableCell>
                    <TableCell>{new Date(app.appliedDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{app.resumeUsed}</TableCell>
                    <TableCell className="text-sm">
                      {app.nextStep || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No applications found</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

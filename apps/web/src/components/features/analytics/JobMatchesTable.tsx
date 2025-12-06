'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface JobMatch {
  id: string;
  company: string;
  position: string;
  matchScore: number;
  status: 'pending' | 'applied' | 'interview' | 'offer' | 'rejected';
  dateApplied: string;
}

interface JobMatchesTableProps {
  data: JobMatch[];
  isLoading?: boolean;
  pageSize?: number;
}

type SortField = 'company' | 'position' | 'matchScore' | 'status' | 'dateApplied';
type SortDirection = 'asc' | 'desc';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  applied: 'bg-blue-100 text-blue-800',
  interview: 'bg-green-100 text-green-800',
  offer: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
};

export function JobMatchesTable({ data, isLoading = false, pageSize = 5 }: JobMatchesTableProps) {
  const [sortField, setSortField] = useState<SortField>('matchScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'company':
      case 'position':
      case 'status':
        comparison = a[sortField].localeCompare(b[sortField]);
        break;
      case 'matchScore':
        comparison = a.matchScore - b.matchScore;
        break;
      case 'dateApplied':
        comparison = new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime();
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Job Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Job Matches</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('company')}
                >
                  Company <SortIcon field="company" />
                </th>
                <th
                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('position')}
                >
                  Position <SortIcon field="position" />
                </th>
                <th
                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('matchScore')}
                >
                  Match Score <SortIcon field="matchScore" />
                </th>
                <th
                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('status')}
                >
                  Status <SortIcon field="status" />
                </th>
                <th
                  className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('dateApplied')}
                >
                  Date Applied <SortIcon field="dateApplied" />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((job) => (
                <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-900">{job.company}</td>
                  <td className="py-3 px-2 text-gray-600">{job.position}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${job.matchScore}%` }}
                        />
                      </div>
                      <span className="text-gray-600">{job.matchScore}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600">
                    {new Date(job.dateApplied).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

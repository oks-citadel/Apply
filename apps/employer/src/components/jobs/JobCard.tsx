import Link from 'next/link';
import { MapPin, Briefcase, Users, Eye, MoreVertical } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary?: string;
  applications: number;
  views: number;
  status: 'active' | 'draft' | 'closed';
  postedDate: string;
  description?: string;
}

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Link
              href={`/jobs/${job.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-primary-600"
            >
              {job.title}
            </Link>
            {getStatusBadge(job.status)}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1" />
              {job.department}
            </span>
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {job.location}
            </span>
            <span>{job.type}</span>
            {job.salary && <span className="font-medium">{job.salary}</span>}
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {job.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {job.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-6 text-sm">
          <span className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-1 text-primary-600" />
            <span className="font-medium text-gray-900">{job.applications}</span>
            <span className="ml-1">applications</span>
          </span>
          <span className="flex items-center text-gray-600">
            <Eye className="h-4 w-4 mr-1 text-purple-600" />
            <span className="font-medium text-gray-900">{job.views}</span>
            <span className="ml-1">views</span>
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Posted {formatDate(job.postedDate)}
        </span>
      </div>

      <div className="mt-4 flex items-center space-x-3">
        <Link
          href={`/jobs/${job.id}/applications`}
          className="flex-1 text-center px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
        >
          View Applications
        </Link>
        <Link
          href={`/jobs/${job.id}`}
          className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Manage Job
        </Link>
      </div>
    </div>
  );
}

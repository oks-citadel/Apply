'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import {
  Mail,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageCircle,
} from 'lucide-react';

interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  experience: string;
  education: string;
  appliedDate: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected';
  resumeUrl: string;
  coverLetter: string;
}

interface ApplicationListProps {
  applications: Application[];
  jobId: string;
}

export function ApplicationList({ applications, jobId }: ApplicationListProps) {
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map((app) => app.id));
    }
  };

  const handleSelectApplication = (id: string) => {
    if (selectedApplications.includes(id)) {
      setSelectedApplications(selectedApplications.filter((appId) => appId !== id));
    } else {
      setSelectedApplications([...selectedApplications, id]);
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on:`, selectedApplications);
    // Implement bulk action logic here
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'reviewing':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'shortlisted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
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

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No applications yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Bulk Actions */}
      {selectedApplications.length > 0 && (
        <div className="px-6 py-3 bg-primary-50 border-b border-primary-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-900">
              {selectedApplications.length} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('shortlist')}
                className="px-3 py-1 text-sm font-medium text-green-700 bg-white border border-green-300 rounded hover:bg-green-50"
              >
                Shortlist
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1 text-sm font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedApplications.length === applications.length}
            onChange={handleSelectAll}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-3 text-xs font-medium text-gray-500 uppercase">
            Candidate
          </span>
        </div>
      </div>

      {/* Applications List */}
      <div className="divide-y divide-gray-200">
        {applications.map((application) => (
          <div
            key={application.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start space-x-4">
              <div className="flex items-center h-full pt-1">
                <input
                  type="checkbox"
                  checked={selectedApplications.includes(application.id)}
                  onChange={() => handleSelectApplication(application.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {application.candidateName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Link
                      href={`/candidates/${application.candidateId}`}
                      className="text-base font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {application.candidateName}
                    </Link>
                    <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {application.candidateEmail}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(application.status)}
                    {getStatusBadge(application.status)}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <span>{application.experience}</span>
                  <span>•</span>
                  <span>{application.education}</span>
                  <span>•</span>
                  <span>Applied {formatDate(application.appliedDate)}</span>
                </div>

                {application.coverLetter && (
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                    {application.coverLetter}
                  </p>
                )}

                <div className="flex items-center space-x-3">
                  <Link
                    href={`/candidates/${application.candidateId}`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Profile
                  </Link>
                  <a
                    href={application.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Resume
                  </a>
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </button>

                  {application.status === 'pending' && (
                    <>
                      <button className="inline-flex items-center px-3 py-1.5 border border-green-600 rounded text-sm font-medium text-green-700 bg-white hover:bg-green-50">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Shortlist
                      </button>
                      <button className="inline-flex items-center px-3 py-1.5 border border-red-600 rounded text-sm font-medium text-red-700 bg-white hover:bg-red-50">
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Briefcase, Calendar, Clock, DollarSign, FileText, MessageSquare, XCircle, Check, ChevronRight, Building2, Loader2, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useApplication, useUpdateApplication, useUpdateApplicationStatus, useWithdrawApplication } from '@/hooks/useApplications';
import type { ApplicationStatus } from '@/types/application';

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const { data: application, isLoading, error } = useApplication(applicationId);
  const updateApplication = useUpdateApplication();
  const updateStatus = useUpdateApplicationStatus();
  const withdrawApplication = useWithdrawApplication();

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');

  const handleAddNote = async () => {
    if (!notes.trim()) return;

    const currentNotes = application?.notes || '';
    const timestamp = new Date().toISOString();
    const newNote = `[${new Date(timestamp).toLocaleString()}]\n${notes}\n\n`;

    await updateApplication.mutateAsync({
      id: applicationId,
      data: {
        notes: newNote + currentNotes,
      },
    });

    setNotes('');
    setShowNotesModal(false);
  };

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    await updateStatus.mutateAsync({
      id: applicationId,
      status: newStatus,
    });
  };

  const handleWithdraw = async () => {
    await withdrawApplication.mutateAsync({
      id: applicationId,
      reason: withdrawReason,
    });
    setShowWithdrawModal(false);
    router.push('/applications');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load application details</p>
          <Link href="/applications">
            <Button>Back to Applications</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<ApplicationStatus, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    screening: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    assessment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    interview: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    withdrawn: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
  };

  const statusLabels: Record<ApplicationStatus, string> = {
    draft: 'Draft',
    applied: 'Applied',
    screening: 'Under Review',
    assessment: 'Assessment',
    interview: 'Interview',
    offer: 'Offer Received',
    accepted: 'Accepted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };

  const canWithdraw = !['withdrawn', 'rejected', 'accepted'].includes(application.status);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center space-x-4">
          <Link href="/applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {canWithdraw && (
            <Button
              variant="outline"
              onClick={() => setShowWithdrawModal(true)}
              disabled={withdrawApplication.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Withdraw Application
            </Button>
          )}
          <Button onClick={() => setShowNotesModal(true)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Application Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {application.job.title}
                </h1>
                <div className="flex items-center gap-2 text-lg text-gray-600 dark:text-gray-400 mb-4">
                  <Building2 className="w-5 h-5" />
                  <span className="font-medium">{application.job.company}</span>
                </div>
              </div>
              <div>
                <Badge
                  size="lg"
                  className={statusColors[application.status]}
                >
                  {statusLabels[application.status]}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="font-medium text-gray-900 dark:text-white">{application.job.location}</p>
                </div>
              </div>

              {application.job.salary && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Salary Range</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatSalary(application.job.salary)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Applied On</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(application.appliedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
              <CardDescription>Track the progress of your application</CardDescription>
            </CardHeader>
            <CardContent>
              {application.timeline && application.timeline.length > 0 ? (
                <div className="space-y-4">
                  {application.timeline.map((event, index) => (
                    <div key={event.id} className="relative pl-8 pb-4 last:pb-0">
                      {index !== application.timeline.length - 1 && (
                        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
                      )}
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 border-2 border-primary-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {statusLabels[event.status]}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        {event.note && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                  <p>No timeline events yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cover Letter */}
          {application.coverLetter && (
            <Card>
              <CardHeader>
                <CardTitle>Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {application.coverLetter}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notes & Comments</CardTitle>
                  <CardDescription>Track your thoughts and updates</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowNotesModal(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {application.notes ? (
                <div className="space-y-4">
                  {application.notes.split('\n\n').filter(n => n.trim()).map((note, index) => {
                    const lines = note.split('\n');
                    const timestamp = lines[0].match(/\[(.*?)\]/)?.[1];
                    const content = lines.slice(1).join('\n');

                    return (
                      <div key={index} className="border-l-2 border-primary-600 pl-4 py-2">
                        {timestamp && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {timestamp}
                          </p>
                        )}
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                  <p>No notes added yet</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setShowNotesModal(true)}
                  >
                    Add your first note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
              <CardDescription>Change application status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(['screening', 'assessment', 'interview', 'offer', 'accepted', 'rejected'] as ApplicationStatus[])
                  .filter(status => status !== application.status)
                  .map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleStatusChange(status)}
                      disabled={updateStatus.isPending}
                    >
                      <ChevronRight className="w-4 h-4 mr-2" />
                      {statusLabels[status]}
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle>Application Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Resume Used</p>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <Link
                    href={`/resumes/${application.resumeId}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {application.resume.name}
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Application Source</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {application.source.replace('-', ' ')}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Updated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(application.updatedAt)}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Application ID</p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                  {application.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Response Details */}
          {application.response && (
            <Card>
              <CardHeader>
                <CardTitle>Response Received</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Response Type</p>
                  <Badge variant={application.response.type === 'offer' ? 'success' : application.response.type === 'rejection' ? 'destructive' : 'default'}>
                    {application.response.type}
                  </Badge>
                </div>

                {application.response.message && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Message</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {application.response.message}
                    </p>
                  </div>
                )}

                {application.response.interviewDate && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interview Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(application.response.interviewDate).toLocaleString()}
                    </p>
                    {application.response.interviewType && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                        {application.response.interviewType} interview
                      </p>
                    )}
                  </div>
                )}

                {application.response.offerDetails && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Offer Details</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Salary:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${application.response.offerDetails.salary.toLocaleString()}
                        </span>
                      </div>
                      {application.response.offerDetails.startDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(application.response.offerDetails.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {application.response.offerDetails.deadline && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Response Deadline:</span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {new Date(application.response.offerDetails.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Received On</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(application.response.receivedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal
        open={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title="Add Note"
        description="Add a note or comment about this application"
        size="lg"
      >
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 resize-none"
            placeholder="Enter your note here..."
          />
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowNotesModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddNote}
            disabled={!notes.trim() || updateApplication.isPending}
            loading={updateApplication.isPending}
          >
            Add Note
          </Button>
        </ModalFooter>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Application"
        description="Are you sure you want to withdraw this application? This action cannot be undone."
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Reason (Optional)"
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            placeholder="e.g., Accepted another offer"
          />
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowWithdrawModal(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleWithdraw}
            disabled={withdrawApplication.isPending}
            loading={withdrawApplication.isPending}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Withdraw Application
          </Button>
        </ModalFooter>
      </Modal>
    </div>
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
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatSalary(salary: { min: number; max: number; currency: string }): string {
  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return n.toString();
  };

  const symbol = salary.currency === 'USD' ? '$' : salary.currency;
  return `${symbol}${formatNum(salary.min)} - ${symbol}${formatNum(salary.max)}`;
}

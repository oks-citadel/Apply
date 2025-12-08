'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Building2,
  ExternalLink,
  Clock,
  Users,
  Globe,
  Send,
  Sparkles,
  FileText,
  CheckCircle,
  Flag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useJob, useSaveJob, useUnsaveJob, useSimilarJobs } from '@/hooks/useJobs';
import { useCreateApplication } from '@/hooks/useApplications';
import { useResumes } from '@/hooks/useResumes';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { ReportJobModal } from '@/components/features/jobs/ReportJobModal';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Fetch job details
  const { data: job, isLoading, error, refetch } = useJob(params.id);
  const { data: similarJobs, isLoading: loadingSimilar } = useSimilarJobs(params.id, 3);
  const { data: resumesData } = useResumes();

  // Mutations
  const saveJob = useSaveJob();
  const unsaveJob = useUnsaveJob();
  const createApplication = useCreateApplication();

  const resumes = resumesData?.resumes || [];

  const handleSaveToggle = () => {
    if (!job) return;

    if (job.isSaved) {
      unsaveJob.mutate(job.id);
    } else {
      saveJob.mutate({ jobId: job.id });
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied',
      description: 'Job link has been copied to clipboard.',
      variant: 'success',
    });
    setShowShareModal(false);
  };

  const handleApplyClick = () => {
    if (resumes.length === 0) {
      toast({
        title: 'No resumes found',
        description: 'Please create a resume first before applying.',
        variant: 'error',
      });
      router.push('/dashboard/resumes');
      return;
    }

    // Pre-select default resume if available
    const defaultResume = resumes.find((r) => r.isDefault);
    if (defaultResume) {
      setSelectedResumeId(defaultResume.id);
    }

    setShowApplyModal(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedResumeId) {
      toast({
        title: 'Resume required',
        description: 'Please select a resume to apply with.',
        variant: 'error',
      });
      return;
    }

    try {
      await createApplication.mutateAsync({
        jobId: params.id,
        resumeId: selectedResumeId,
        coverLetter: coverLetter || undefined,
        source: 'manual',
      });

      setShowApplyModal(false);
      setSelectedResumeId('');
      setCoverLetter('');

      // Navigate to applications page
      router.push('/dashboard/applications');
    } catch (error) {
      logger.error('Failed to submit application', error as Error, { jobId: params.id });
    }
  };

  const formatSalary = (min?: number, max?: number, currency?: string, period?: string): string => {
    if (!min && !max) return 'Competitive';
    const curr = currency || '$';
    const formatNum = (n: number) => {
      if (n >= 1000) return `${curr}${Math.round(n / 1000)}k`;
      return `${curr}${n}`;
    };
    const periodText = period && period !== 'yearly' ? `/${period}` : '/year';
    if (min && max) return `${formatNum(min)} - ${formatNum(max)}${periodText}`;
    if (min) return `From ${formatNum(min)}${periodText}`;
    if (max) return `Up to ${formatNum(max)}${periodText}`;
    return 'Competitive';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const calculateDaysUntilDeadline = (deadline?: string): number | null => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/jobs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>
        <Card>
          <CardContent>
            <ErrorState
              title="Failed to load job"
              message="We couldn't load the job details. Please try again."
              onRetry={() => refetch()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilDeadline = calculateDaysUntilDeadline(job.expiresAt);

  return (
    <div className="space-y-6">
      {/* Header with Back Button and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link href="/dashboard/jobs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveToggle}
            disabled={saveJob.isPending || unsaveJob.isPending}
            className={job.isSaved ? 'text-primary-600 border-primary-600' : ''}
          >
            <Bookmark className={`w-4 h-4 mr-2 ${job.isSaved ? 'fill-current' : ''}`} />
            {job.isSaved ? 'Saved' : 'Save Job'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportModal(true)}
            disabled={job?.isReported}
            className={job?.isReported ? 'text-gray-500 cursor-not-allowed' : ''}
          >
            <Flag className="w-4 h-4 mr-2" />
            {job?.isReported ? 'Reported' : 'Report'}
          </Button>
          <Button size="sm" onClick={handleApplyClick} disabled={createApplication.isPending}>
            <Send className="w-4 h-4 mr-2" />
            Apply Now
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {job.companyLogo && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {job.title}
                  </h1>
                  <div className="flex items-center text-lg text-gray-600 dark:text-gray-400 mb-4">
                    <Building2 className="w-5 h-5 mr-2" />
                    {job.company}
                    {job.companyWebsite && (
                      <a
                        href={job.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      {job.employmentType}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatSalary(
                        job.salary?.min,
                        job.salary?.max,
                        job.salary?.currency,
                        job.salary?.period
                      )}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Posted {formatDate(job.postedAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="secondary">{job.locationType}</Badge>
                    <Badge variant="secondary">{job.experienceLevel}</Badge>
                    {job.industry && <Badge variant="secondary">{job.industry}</Badge>}
                    {job.matchScore && (
                      <Badge variant="success">
                        {job.matchScore}% Match
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {daysUntilDeadline !== null && daysUntilDeadline > 0 && daysUntilDeadline <= 7 && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Application deadline in {daysUntilDeadline} {daysUntilDeadline === 1 ? 'day' : 'days'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {job.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-600 mr-2 mt-0.5">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{resp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Company Info & Similar Jobs */}
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Company</p>
                <p className="font-medium text-gray-900 dark:text-white">{job.company}</p>
              </div>
              {job.industry && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry</p>
                  <p className="font-medium text-gray-900 dark:text-white">{job.industry}</p>
                </div>
              )}
              {job.companySize && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Company Size</p>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-600" />
                    <p className="font-medium text-gray-900 dark:text-white">{job.companySize}</p>
                  </div>
                </div>
              )}
              {job.companyWebsite && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Website</p>
                  <a
                    href={job.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary-600 hover:text-primary-700"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    <span className="text-sm">Visit website</span>
                  </a>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Source</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{job.source}</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  toast({
                    title: 'Coming Soon',
                    description: 'Resume match analysis feature coming soon!',
                    variant: 'info',
                  });
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Analyze Resume Match
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  toast({
                    title: 'Coming Soon',
                    description: 'Interview preparation feature coming soon!',
                    variant: 'info',
                  });
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Prepare for Interview
              </Button>
            </CardContent>
          </Card>

          {/* Similar Jobs */}
          {similarJobs && similarJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {similarJobs.map((similarJob) => (
                  <Link
                    key={similarJob.id}
                    href={`/dashboard/jobs/${similarJob.id}`}
                    className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {similarJob.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{similarJob.company}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      {similarJob.location}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for this position"
        description="Select a resume and optionally add a cover letter"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Resume</label>
            <Select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              required
            >
              <option value="">Choose a resume...</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.name} {resume.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cover Letter (Optional)</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
              placeholder="Write a compelling cover letter to accompany your application..."
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setShowApplyModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitApplication} disabled={createApplication.isPending}>
            {createApplication.isPending ? 'Submitting...' : 'Submit Application'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Share Modal */}
      <Modal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share this job"
        size="sm"
      >
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleCopyLink}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </Modal>

      {/* Report Modal */}
      {job && (
        <ReportJobModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          jobId={job.id}
          jobTitle={job.title}
        />
      )}
    </div>
  );
}

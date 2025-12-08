'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useReportJob } from '@/hooks/useJobs';

const reportReasons = [
  { value: 'spam', label: 'Spam/Scam' },
  { value: 'misleading', label: 'Misleading information' },
  { value: 'discriminatory', label: 'Discriminatory content' },
  { value: 'expired', label: 'Expired/Closed position' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'other', label: 'Other' },
] as const;

const reportSchema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  details: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

export function ReportJobModal({ isOpen, onClose, jobId, jobTitle }: ReportJobModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const reportJob = useReportJob();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    mode: 'onChange',
  });

  const selectedReason = watch('reason');

  const handleClose = () => {
    reset();
    setIsSubmitted(false);
    onClose();
  };

  const onSubmit = async (data: ReportFormData) => {
    try {
      await reportJob.mutateAsync({
        jobId,
        reason: data.reason,
        details: data.details,
      });
      setIsSubmitted(true);

      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  if (isSubmitted) {
    return (
      <Modal open={isOpen} onClose={handleClose} title="Report Submitted" size="sm">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Thank you for your report
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We'll review this job posting and take appropriate action if needed.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Report Job Posting"
      description="Help us maintain quality by reporting inappropriate job listings"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Reporting: {jobTitle}
              </h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                False reports may result in account restrictions.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for reporting <span className="text-red-500">*</span>
          </label>
          <Select
            id="reason"
            {...register('reason')}
            error={errors.reason?.message}
            aria-required="true"
          >
            <option value="">Select a reason...</option>
            {reportReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="details" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional details {selectedReason === 'other' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id="details"
            {...register('details')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 text-sm resize-none"
            placeholder={
              selectedReason === 'other'
                ? 'Please describe the issue...'
                : 'Provide any additional context that might help us review this report (optional)'
            }
            aria-describedby={errors.details ? 'details-error' : undefined}
          />
          {errors.details && (
            <p id="details-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.details.message}
            </p>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Your report will be reviewed by our moderation team. We typically respond within 24-48 hours.
          </p>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={reportJob.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={!isValid || reportJob.isPending}
            loading={reportJob.isPending}
          >
            {reportJob.isPending ? 'Submitting...' : 'Submit Report'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

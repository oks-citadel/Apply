'use client';

import React, { useState } from 'react';

interface ApplicationFormData {
  coverLetter: string;
  resumeId: string;
  answers: Record<string, string>;
}

interface ApplicationFormProps {
  jobId: string;
  onSubmit?: (data: ApplicationFormData) => void;
}

export function ApplicationForm({ jobId, onSubmit }: ApplicationFormProps) {
  const [formData, setFormData] = useState<ApplicationFormData>({
    coverLetter: '',
    resumeId: '',
    answers: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        onSubmit(formData);
      } else {
        const response = await fetch(`/api/jobs/${jobId}/apply`, {
          method: 'POST',
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to submit application');
        }
      }
      setSuccess(true);
    } catch (err) {
      setError('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div>
        <h2>Application Submitted!</h2>
        <p>Your application has been submitted successfully.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Apply for this Position</h2>

      {error && <div role="alert">{error}</div>}

      <div>
        <label htmlFor="resume">Select Resume</label>
        <select
          id="resume"
          value={formData.resumeId}
          onChange={(e) =>
            setFormData({ ...formData, resumeId: e.target.value })
          }
          required
        >
          <option value="">Select a resume</option>
          <option value="resume-1">My Professional Resume</option>
          <option value="resume-2">Technical Resume</option>
        </select>
      </div>

      <div>
        <label htmlFor="coverLetter">Cover Letter</label>
        <textarea
          id="coverLetter"
          value={formData.coverLetter}
          onChange={(e) =>
            setFormData({ ...formData, coverLetter: e.target.value })
          }
          placeholder="Write your cover letter..."
          rows={10}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
}

export default ApplicationForm;

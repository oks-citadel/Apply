'use client';

import React, { useState } from 'react';

interface JobPostData {
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
}

interface JobPostFormProps {
  initialData?: Partial<JobPostData>;
  onSubmit?: (data: JobPostData) => void;
  isEditing?: boolean;
}

export function JobPostForm({ initialData, onSubmit, isEditing }: JobPostFormProps) {
  const [formData, setFormData] = useState<Partial<JobPostData>>(
    initialData || {
      title: '',
      description: '',
      requirements: [],
      location: '',
      salary: { min: 0, max: 0, currency: 'USD' },
      type: 'full-time',
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        onSubmit(formData as JobPostData);
      } else {
        const response = await fetch('/api/jobs', {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to save job');
        }
      }
    } catch (err) {
      setError('Failed to save job posting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEditing ? 'Edit Job Posting' : 'Create Job Posting'}</h2>

      {error && <div role="alert">{error}</div>}

      <div>
        <label htmlFor="title">Job Title</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label htmlFor="location">Location</label>
        <input
          id="location"
          type="text"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
        />
      </div>

      <div>
        <label htmlFor="type">Job Type</label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value as JobPostData['type'] })
          }
        >
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="remote">Remote</option>
        </select>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : isEditing ? 'Update Job' : 'Post Job'}
      </button>
    </form>
  );
}

export default JobPostForm;

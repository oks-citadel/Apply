'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { X } from 'lucide-react';
import { useState } from 'react';
import type { JobAlert } from '@/types/alert';

const alertFormSchema = z.object({
  name: z.string().min(1, 'Alert name is required').max(100, 'Name is too long'),
  keywords: z.string().optional(),
  jobTitle: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  salaryMin: z.coerce.number().min(0).optional().or(z.literal('')),
  salaryMax: z.coerce.number().min(0).optional().or(z.literal('')),
  employmentType: z.array(z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary'])).optional(),
  experienceLevel: z.array(z.enum(['entry', 'mid', 'senior', 'lead', 'executive'])).optional(),
  notificationFrequency: z.enum(['instant', 'daily', 'weekly']),
  isActive: z.boolean().optional(),
}).refine((data) => {
  if (data.salaryMin && data.salaryMax) {
    return Number(data.salaryMin) <= Number(data.salaryMax);
  }
  return true;
}, {
  message: 'Minimum salary must be less than or equal to maximum salary',
  path: ['salaryMin'],
});

type AlertFormData = z.infer<typeof alertFormSchema>;

interface AlertFormProps {
  alert?: JobAlert;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AlertForm({ alert, onSubmit, onCancel, isLoading }: AlertFormProps) {
  const [employmentTypeSelections, setEmploymentTypeSelections] = useState<string[]>(
    alert?.employmentType || []
  );
  const [experienceLevelSelections, setExperienceLevelSelections] = useState<string[]>(
    alert?.experienceLevel || []
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      name: alert?.name || '',
      keywords: alert?.keywords?.join(', ') || '',
      jobTitle: alert?.jobTitle || '',
      location: alert?.location || '',
      isRemote: alert?.isRemote || false,
      salaryMin: alert?.salaryMin || ('' as any),
      salaryMax: alert?.salaryMax || ('' as any),
      employmentType: alert?.employmentType || [],
      experienceLevel: alert?.experienceLevel || [],
      notificationFrequency: alert?.notificationFrequency || 'daily',
      isActive: alert?.isActive !== undefined ? alert.isActive : true,
    },
  });

  const handleFormSubmit = (data: AlertFormData) => {
    const formattedData = {
      ...data,
      keywords: data.keywords
        ? data.keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : undefined,
      salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
      salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
      employmentType: employmentTypeSelections.length > 0 ? employmentTypeSelections : undefined,
      experienceLevel: experienceLevelSelections.length > 0 ? experienceLevelSelections : undefined,
    };
    onSubmit(formattedData);
  };

  const toggleEmploymentType = (type: string) => {
    setEmploymentTypeSelections((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleExperienceLevel = (level: string) => {
    setExperienceLevelSelections((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{alert ? 'Edit Job Alert' : 'Create Job Alert'}</CardTitle>
          <CardDescription>
            Set up criteria for jobs you want to be notified about
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alert Name */}
          <Input
            label="Alert Name"
            placeholder="e.g., Senior Frontend Developer in SF"
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Job Title */}
          <Input
            label="Job Title"
            placeholder="e.g., Frontend Developer, Software Engineer"
            helperText="Optional: Specific job title or role"
            error={errors.jobTitle?.message}
            {...register('jobTitle')}
          />

          {/* Keywords */}
          <Input
            label="Keywords"
            placeholder="e.g., React, TypeScript, Remote"
            helperText="Comma-separated keywords to search for"
            error={errors.keywords?.message}
            {...register('keywords')}
          />

          {/* Location */}
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Location"
              placeholder="e.g., San Francisco, CA"
              error={errors.location?.message}
              {...register('location')}
            />
            <div className="flex items-end">
              <label className="flex items-center space-x-2 h-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  {...register('isRemote')}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include Remote Jobs
                </span>
              </label>
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Salary Range (Optional)
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Min salary"
                error={errors.salaryMin?.message}
                {...register('salaryMin')}
              />
              <Input
                type="number"
                placeholder="Max salary"
                error={errors.salaryMax?.message}
                {...register('salaryMax')}
              />
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Employment Type
            </label>
            <div className="flex flex-wrap gap-2">
              {['full-time', 'part-time', 'contract', 'internship', 'temporary'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleEmploymentType(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    employmentTypeSelections.includes(type)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Experience Level
            </label>
            <div className="flex flex-wrap gap-2">
              {['entry', 'mid', 'senior', 'lead', 'executive'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleExperienceLevel(level)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    experienceLevelSelections.includes(level)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Frequency */}
          <Select
            label="Notification Frequency"
            error={errors.notificationFrequency?.message}
            {...register('notificationFrequency')}
          >
            <option value="instant">Instant (as soon as jobs match)</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Summary</option>
          </Select>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              {...register('isActive')}
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Enable this alert immediately
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : alert ? 'Update Alert' : 'Create Alert'}
        </Button>
      </div>
    </form>
  );
}

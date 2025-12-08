'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  Plus,
  X,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useAutoApplySettings, useUpdateAutoApplySettings } from '@/hooks/useApplications';
import { useResumes } from '@/hooks/useResumes';
import type { AutoApplySettings } from '@/types/application';
import Link from 'next/link';

const EXPERIENCE_LEVELS = [
  { value: 'internship', label: 'Internship' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'remote', label: 'Remote' },
];

export default function AutoApplySettingsPage() {
  const router = useRouter();
  const { data: settings, isLoading: settingsLoading } = useAutoApplySettings();
  const { data: resumesData, isLoading: resumesLoading } = useResumes();
  const updateSettings = useUpdateAutoApplySettings();

  const [formData, setFormData] = useState<AutoApplySettings>({
    enabled: false,
    filters: {},
    resumeId: '',
    maxApplicationsPerDay: 10,
    autoResponse: false,
  });

  const [newJobTitle, setNewJobTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newExcludeKeyword, setNewExcludeKeyword] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const resumes = resumesData?.resumes || [];
  const isLoading = settingsLoading || resumesLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync(formData);
    router.push('/auto-apply');
  };

  const addToArray = (field: keyof AutoApplySettings['filters'], value: string) => {
    if (!value.trim()) return;

    const currentArray = formData.filters[field] as string[] | undefined;
    setFormData({
      ...formData,
      filters: {
        ...formData.filters,
        [field]: [...(currentArray || []), value.trim()],
      },
    });
  };

  const removeFromArray = (field: keyof AutoApplySettings['filters'], index: number) => {
    const currentArray = formData.filters[field] as string[] | undefined;
    if (!currentArray) return;

    setFormData({
      ...formData,
      filters: {
        ...formData.filters,
        [field]: currentArray.filter((_, i) => i !== index),
      },
    });
  };

  const toggleExperienceLevel = (level: string) => {
    const current = formData.filters.experienceLevel || [];
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];

    setFormData({
      ...formData,
      filters: {
        ...formData.filters,
        experienceLevel: updated,
      },
    });
  };

  const toggleEmploymentType = (type: string) => {
    const current = formData.filters.employmentType || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];

    setFormData({
      ...formData,
      filters: {
        ...formData.filters,
        employmentType: updated,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/auto-apply">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Auto-Apply Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your automatic job application preferences
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Criteria */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gray-500" />
              <CardTitle>Job Criteria</CardTitle>
            </div>
            <CardDescription>
              Define what types of jobs you want to apply to automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Titles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Titles
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Add job titles or keywords to match (e.g., Software Engineer, Frontend Developer)
              </p>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Add job title..."
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('jobTitle', newJobTitle);
                      setNewJobTitle('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addToArray('jobTitle', newJobTitle);
                    setNewJobTitle('');
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.filters.jobTitle?.map((title, index) => (
                  <Badge key={index} variant="secondary">
                    {title}
                    <button
                      type="button"
                      onClick={() => removeFromArray('jobTitle', index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Locations
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Specify locations you're interested in (e.g., San Francisco, Remote, New York)
              </p>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Add location..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('location', newLocation);
                      setNewLocation('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addToArray('location', newLocation);
                    setNewLocation('');
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.filters.location?.map((location, index) => (
                  <Badge key={index} variant="secondary">
                    {location}
                    <button
                      type="button"
                      onClick={() => removeFromArray('location', index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Experience Level
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Select all experience levels you're interested in
              </p>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <Badge
                    key={level.value}
                    variant={
                      formData.filters.experienceLevel?.includes(level.value)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleExperienceLevel(level.value)}
                  >
                    {level.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employment Type
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Select preferred job types
              </p>
              <div className="flex flex-wrap gap-2">
                {EMPLOYMENT_TYPES.map((type) => (
                  <Badge
                    key={type.value}
                    variant={
                      formData.filters.employmentType?.includes(type.value)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleEmploymentType(type.value)}
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Salary Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Minimum Salary (Annual)"
                type="number"
                placeholder="e.g., 80000"
                value={formData.filters.salaryMin || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    filters: {
                      ...formData.filters,
                      salaryMin: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Required Keywords
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Jobs must contain these keywords (e.g., React, TypeScript, Python)
              </p>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Add keyword..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('keywords', newKeyword);
                      setNewKeyword('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addToArray('keywords', newKeyword);
                    setNewKeyword('');
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.filters.keywords?.map((keyword, index) => (
                  <Badge key={index} variant="success">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeFromArray('keywords', index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Exclude Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exclude Keywords
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Skip jobs containing these keywords (e.g., sales, manager)
              </p>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Add exclude keyword..."
                  value={newExcludeKeyword}
                  onChange={(e) => setNewExcludeKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('excludeKeywords', newExcludeKeyword);
                      setNewExcludeKeyword('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addToArray('excludeKeywords', newExcludeKeyword);
                    setNewExcludeKeyword('');
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.filters.excludeKeywords?.map((keyword, index) => (
                  <Badge key={index} variant="destructive">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeFromArray('excludeKeywords', index)}
                      className="ml-2 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <CardTitle>Application Limits</CardTitle>
            </div>
            <CardDescription>Control how many applications are sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Maximum Applications Per Day"
              type="number"
              min="1"
              max="100"
              value={formData.maxApplicationsPerDay || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxApplicationsPerDay: Number(e.target.value),
                })
              }
              helperText="Recommended: 10-20 applications per day for better quality"
            />
          </CardContent>
        </Card>

        {/* Resume & Cover Letter */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <CardTitle>Resume & Cover Letter</CardTitle>
            </div>
            <CardDescription>Choose which resume and cover letter to use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Resume"
              value={formData.resumeId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  resumeId: e.target.value,
                })
              }
              helperText="Select the resume to use for auto-applications"
            >
              <option value="">Select a resume...</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.name} {resume.isDefault && '(Default)'}
                </option>
              ))}
            </Select>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Cover Letter Template (Optional)
              </label>
              <textarea
                className="flex w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={6}
                placeholder="Enter a cover letter template. Use {company}, {position}, and {name} as placeholders."
                value={formData.coverLetterTemplate || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coverLetterTemplate: e.target.value,
                  })
                }
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Leave blank to use AI-generated cover letters for each application
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Warning Banner */}
        {!formData.resumeId && (
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    Resume Required
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You must select a resume before enabling auto-apply. The selected resume will
                    be used for all automatic applications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Link href="/auto-apply">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!formData.resumeId || updateSettings.isPending}
            loading={updateSettings.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TemplatePreview } from '@/components/resume/TemplatePreview';
import { RESUME_TEMPLATES, getTemplatesByCategory, searchTemplates, getSortedTemplates } from '@/data/templates';
import { TemplateCategory } from '@/types/template';
import { useToast } from '@/hooks/useToast';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Templates' },
  { id: 'professional', label: 'Professional' },
  { id: 'modern', label: 'Modern' },
  { id: 'creative', label: 'Creative' },
  { id: 'simple', label: 'Simple' },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'name', label: 'Name' },
  { value: 'recent', label: 'Recently Added' },
];

export default function TemplateGalleryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'recent'>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let templates = RESUME_TEMPLATES;

    // Apply category filter
    if (selectedCategory !== 'all') {
      templates = getTemplatesByCategory(selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    // Apply sorting
    templates = getSortedTemplates(sortBy);

    return templates;
  }, [selectedCategory, searchQuery, sortBy]);

  const handleUseTemplate = (templateId: string) => {
    const returnUrl = searchParams.get('returnUrl');
    const resumeId = searchParams.get('resumeId');

    if (returnUrl && resumeId) {
      // Returning to existing resume - update template
      router.push(`${returnUrl}?template=${templateId}`);
    } else {
      // Creating new resume with template
      router.push(`/resumes/new?template=${templateId}`);
    }
  };

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/resumes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Resumes
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Resume Templates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Choose from {RESUME_TEMPLATES.length} professionally designed templates
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="lg:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'name' | 'recent')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
        </p>
        {selectedTemplate && (
          <Button onClick={() => handleUseTemplate(selectedTemplate)}>
            Use Selected Template
          </Button>
        )}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="py-16">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No templates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="relative">
              <TemplatePreview
                template={template}
                selected={selectedTemplate === template.id}
                onSelect={() => handleTemplateClick(template.id)}
                showDetails={true}
                scale={0.2}
              />
              <Button
                variant="default"
                className="w-full mt-3"
                onClick={() => handleUseTemplate(template.id)}
              >
                Use This Template
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <Card className="p-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              ATS-Optimized
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All templates are designed to pass Applicant Tracking Systems
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Fully Customizable
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customize colors, fonts, layouts, and section order to match your style
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Export Ready
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download as PDF or DOCX for easy sharing with employers
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

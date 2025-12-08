'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Save, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TemplateCustomizer } from '@/components/resume/TemplateCustomizer';
import { TemplateRenderer } from '@/components/resume/TemplateRenderer';
import { useResume, useUpdateResume } from '@/hooks/useResumes';
import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';
import { getTemplateById } from '@/data/templates';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

export default function CustomizeResumePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: resume, isLoading } = useResume(params.id);
  const updateResume = useUpdateResume();

  const [customization, setCustomization] = useState<TemplateCustomization>(DEFAULT_CUSTOMIZATION);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.5);

  // Load customization from resume
  useEffect(() => {
    if (resume?.customization) {
      setCustomization(resume.customization);
    } else if (resume?.template) {
      const template = getTemplateById(resume.template);
      if (template) {
        setCustomization(template.defaultCustomization);
      }
    }
  }, [resume]);

  const handleCustomizationChange = (newCustomization: TemplateCustomization) => {
    setCustomization(newCustomization);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateResume.mutateAsync({
        id: params.id,
        data: {
          customization,
        },
      });

      setHasChanges(false);
      toast({
        title: 'Saved',
        description: 'Template customization saved successfully',
        variant: 'success',
      });
    } catch (error) {
      logger.error('Failed to save customization', error as Error, { resumeId: params.id });
      toast({
        title: 'Error',
        description: 'Failed to save customization',
        variant: 'error',
      });
    }
  };

  const handleReset = () => {
    if (resume?.template) {
      const template = getTemplateById(resume.template);
      if (template) {
        setCustomization(template.defaultCustomization);
        setHasChanges(true);
        toast({
          title: 'Reset',
          description: 'Customization reset to template defaults',
          variant: 'info',
        });
      }
    }
  };

  const handleExport = () => {
    toast({
      title: 'Export',
      description: 'Export feature coming soon!',
      variant: 'info',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Resume not found</p>
          <Link href="/resumes">
            <Button className="mt-4">Back to Resumes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/resumes/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Editor
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Customize Template
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{resume.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || updateResume.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateResume.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You have unsaved changes. Click "Save Changes" to apply your customization.
          </p>
        </Card>
      )}

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Customization Panel */}
        <div className="space-y-6">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Template Options</h2>
            <TemplateCustomizer
              customization={customization}
              onChange={handleCustomizationChange}
              onReset={handleReset}
            />
          </Card>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Live Preview</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewScale(Math.max(0.3, previewScale - 0.1))}
                >
                  -
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-center">
                  {Math.round(previewScale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewScale(Math.min(1, previewScale + 0.1))}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Preview Container */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 overflow-auto max-h-[1200px]">
              <div className="inline-block min-w-full">
                <TemplateRenderer
                  templateId={resume.template}
                  resume={resume}
                  customization={customization}
                  scale={previewScale}
                />
              </div>
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-4 bg-primary-50 dark:bg-primary-900/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Customization Tips
                </h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• Use consistent colors throughout your resume</li>
                  <li>• Choose readable fonts (avoid decorative fonts)</li>
                  <li>• Keep font size between 12-14px for optimal readability</li>
                  <li>• Two-column layouts work great for creative roles</li>
                  <li>• Single-column layouts are best for ATS compatibility</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TemplatePreview } from '@/components/resume/TemplatePreview';
import { RESUME_TEMPLATES, getTemplateById } from '@/data/templates';
import { useCreateResume } from '@/hooks/useResumes';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

export default function NewResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const createResume = useCreateResume();

  const [step, setStep] = useState(1); // 1: Template Selection, 2: Basic Info
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    searchParams.get('template') || 'professional-classic'
  );
  const [resumeName, setResumeName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
      setSelectedTemplateId(templateParam);
      setStep(2);
    }
  }, [searchParams]);

  const selectedTemplate = getTemplateById(selectedTemplateId);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else {
      handleCreate();
    }
  };

  const handleCreate = async () => {
    if (!resumeName || !fullName || !email || !phone) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'error',
      });
      return;
    }

    try {
      const newResume = await createResume.mutateAsync({
        name: resumeName,
        template: selectedTemplateId,
        personalInfo: {
          fullName,
          email,
          phone,
        },
      });

      toast({
        title: 'Resume Created',
        description: 'Your new resume has been created successfully',
        variant: 'success',
      });

      router.push(`/resumes/${newResume.id}`);
    } catch (error) {
      logger.error('Failed to create resume', error as Error);
      toast({
        title: 'Error',
        description: 'Failed to create resume. Please try again.',
        variant: 'error',
      });
    }
  };

  const canProceed = step === 1 ? !!selectedTemplateId : resumeName && fullName && email && phone;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/resumes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Resume
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Step {step} of 2: {step === 1 ? 'Choose Template' : 'Basic Information'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {step === 1 ? 'Template Selection' : 'Basic Information'}
          </span>
          <span className="text-sm text-gray-500">{step}/2</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {step === 1 ? (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Choose Your Template</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select a professional template to get started. You can customize it later.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {RESUME_TEMPLATES.map((template) => (
                <div key={template.id} className="cursor-pointer">
                  <TemplatePreview
                    template={template}
                    selected={selectedTemplateId === template.id}
                    onSelect={() => handleTemplateSelect(template.id)}
                    showDetails={true}
                    scale={0.18}
                  />
                </div>
              ))}
            </div>
          </Card>

          {selectedTemplateId && (
            <div className="flex justify-between items-center">
              <Link href="/resumes/templates">
                <Button variant="outline">Browse All Templates</Button>
              </Link>
              <Button onClick={handleContinue}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Form */}
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Resume Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  placeholder="e.g., Software Engineer Resume"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give your resume a descriptive name for easy identification
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You'll be able to add more details like work experience, education, and skills after
                  creating your resume.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="space-y-6">
            {selectedTemplate && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Selected Template</h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-hidden">
                  <TemplatePreview
                    template={selectedTemplate}
                    selected={false}
                    showDetails={false}
                    scale={0.25}
                  />
                </div>
                <div className="mt-3">
                  <h4 className="font-medium text-sm mb-1">{selectedTemplate.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {selectedTemplate.description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setStep(1)}
                  >
                    Change Template
                  </Button>
                </div>
              </Card>
            )}

            <Card className="p-4 bg-primary-50 dark:bg-primary-900/20">
              <h3 className="font-semibold mb-2">What's Next?</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">1.</span>
                  <span>Add your work experience and achievements</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">2.</span>
                  <span>Include your education and certifications</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">3.</span>
                  <span>List your technical and soft skills</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">4.</span>
                  <span>Customize colors, fonts, and layout</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">5.</span>
                  <span>Export as PDF and start applying!</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* Actions */}
      {step === 2 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canProceed || createResume.isPending}
          >
            {createResume.isPending ? 'Creating...' : 'Create Resume'}
          </Button>
        </div>
      )}
    </div>
  );
}

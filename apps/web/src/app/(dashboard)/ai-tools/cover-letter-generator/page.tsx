'use client';

import { useState } from 'react';
import { ArrowLeft, Sparkles, Copy, Download, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useResumes } from '@/hooks/useResumes';
import { useGenerateCoverLetter } from '@/hooks/useAI';
import { useToast } from '@/hooks/useToast';

export default function CoverLetterGeneratorPage() {
  const { data: resumesData, isLoading: resumesLoading } = useResumes();
  const generateCoverLetter = useGenerateCoverLetter();
  const { toast } = useToast();

  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'formal'>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [customInstructions, setCustomInstructions] = useState('');

  const resumes = resumesData?.resumes || [];

  const handleGenerate = async () => {
    if (!selectedResumeId || !jobTitle || !company) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'error',
      });
      return;
    }

    generateCoverLetter.mutate({
      resumeId: selectedResumeId,
      jobTitle,
      company,
      jobDescription,
      tone,
      length,
      customInstructions: customInstructions || undefined,
    });
  };

  const handleCopy = () => {
    if (generateCoverLetter.data?.coverLetter) {
      navigator.clipboard.writeText(generateCoverLetter.data.coverLetter);
      toast({
        title: 'Copied!',
        description: 'Cover letter copied to clipboard.',
        variant: 'success',
      });
    }
  };

  const handleDownload = () => {
    if (generateCoverLetter.data?.coverLetter) {
      const blob = new Blob([generateCoverLetter.data.coverLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-letter-${company}-${jobTitle}.txt`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Downloaded!',
        description: 'Cover letter downloaded successfully.',
        variant: 'success',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/ai-tools">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to AI Tools
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Cover Letter Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate customized cover letters based on job descriptions
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Provide job and customization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Resume *</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                  disabled={resumesLoading}
                >
                  <option value="">Select a resume...</option>
                  {resumes.map((resume: any) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Job Title *"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />

              <Input
                label="Company *"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Google"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                  placeholder="Paste the job description (optional)..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                >
                  <option value="professional">Professional</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                >
                  <option value="short">Short (250 words)</option>
                  <option value="medium">Medium (400 words)</option>
                  <option value="long">Long (600 words)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Custom Instructions</label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                  placeholder="Any specific points to highlight? (optional)"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!selectedResumeId || !jobTitle || !company || generateCoverLetter.isPending}
                className="w-full"
              >
                {generateCoverLetter.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {generateCoverLetter.isError && (
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {(generateCoverLetter.error as Error)?.message || 'Failed to generate cover letter. Please try again.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {generateCoverLetter.isSuccess && generateCoverLetter.data && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Cover Letter</CardTitle>
                    {generateCoverLetter.data.subject && (
                      <CardDescription className="mt-2">
                        Subject: {generateCoverLetter.data.subject}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {generateCoverLetter.data.coverLetter}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!generateCoverLetter.isSuccess && !generateCoverLetter.isError && !generateCoverLetter.isPending && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Fill in the required fields and click Generate to create your cover letter</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

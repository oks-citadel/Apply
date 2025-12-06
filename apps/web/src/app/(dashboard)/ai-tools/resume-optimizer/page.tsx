'use client';

import { useState } from 'react';
import { ArrowLeft, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useResumes } from '@/hooks/useResumes';
import { useOptimizeResume } from '@/hooks/useAI';

export default function ResumeOptimizerPage() {
  const { data: resumesData, isLoading: resumesLoading } = useResumes();
  const optimizeResume = useOptimizeResume();

  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [focusAreas, setFocusAreas] = useState<('skills' | 'experience' | 'summary' | 'all')[]>(['all']);

  const resumes = resumesData?.resumes || [];

  const handleOptimize = async () => {
    if (!selectedResumeId || !jobDescription) {
      return;
    }

    optimizeResume.mutate({
      resumeId: selectedResumeId,
      jobDescription,
      focusAreas,
    });
  };

  const suggestions = optimizeResume.data?.suggestions || [];
  const optimizedContent = optimizeResume.data?.optimizedContent;

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
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
            AI Resume Optimization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Analyze and optimize your resume content for better ATS scores
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Select resume and provide job details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Resume</label>
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

              <div>
                <label className="block text-sm font-medium mb-2">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                  placeholder="Paste the job description here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Focus Areas</label>
                <div className="space-y-2">
                  {['all', 'skills', 'experience', 'summary'].map((area) => (
                    <label key={area} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={focusAreas.includes(area as any)}
                        onChange={(e) => {
                          if (area === 'all') {
                            setFocusAreas(e.target.checked ? ['all'] : []);
                          } else {
                            const newAreas = e.target.checked
                              ? [...focusAreas.filter(a => a !== 'all'), area as any]
                              : focusAreas.filter((a) => a !== area);
                            setFocusAreas(newAreas.length === 0 ? ['all'] : newAreas);
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleOptimize}
                disabled={!selectedResumeId || !jobDescription || optimizeResume.isPending}
                className="w-full"
              >
                {optimizeResume.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Optimize Resume
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {optimizeResume.isError && (
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {(optimizeResume.error as Error)?.message || 'Failed to optimize resume. Please try again.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {optimizeResume.isSuccess && suggestions.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Great Job!</h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Your resume is already well-optimized for this job description.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {optimizeResume.isSuccess && suggestions.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Suggestions</CardTitle>
                  <CardDescription>
                    {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} to improve your resume
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                          {suggestion.section}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {suggestion.reason}
                      </p>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Current:</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            {suggestion.current}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">Suggested:</span>
                          <p className="text-sm text-gray-900 dark:text-white mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            {suggestion.suggested}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {optimizedContent && (
                <Card>
                  <CardHeader>
                    <CardTitle>Optimized Content</CardTitle>
                    <CardDescription>Ready to apply to your resume</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {optimizedContent.summary && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          {optimizedContent.summary}
                        </p>
                      </div>
                    )}
                    {optimizedContent.skills && optimizedContent.skills.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {optimizedContent.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!optimizeResume.isSuccess && !optimizeResume.isError && !optimizeResume.isPending && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a resume and provide a job description to get started</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

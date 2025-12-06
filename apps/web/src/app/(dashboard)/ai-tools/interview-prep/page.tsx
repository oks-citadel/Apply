'use client';

import { useState } from 'react';
import { ArrowLeft, MessageSquare, Lightbulb, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useJobs } from '@/hooks/useJobs';
import { useResumes } from '@/hooks/useResumes';
import { useInterviewPrep } from '@/hooks/useAI';

export default function InterviewPrepPage() {
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ limit: 100 });
  const { data: resumesData, isLoading: resumesLoading } = useResumes();
  const interviewPrep = useInterviewPrep();

  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const jobs = jobsData?.jobs || [];
  const resumes = resumesData?.resumes || [];

  const handleGenerate = async () => {
    if (!selectedJobId) {
      return;
    }

    interviewPrep.mutate({
      jobId: selectedJobId,
      resumeId: selectedResumeId || undefined,
    });
  };

  const questions = interviewPrep.data?.questions || [];
  const companyInsights = interviewPrep.data?.companyInsights;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'behavioral':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'situational':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'company':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
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
            AI Interview Preparation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Get interview questions and tips based on job role
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Select job and optional resume</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Job *</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                  disabled={jobsLoading}
                >
                  <option value="">Select a job...</option>
                  {jobs.map((job: any) => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Resume (Optional)</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                  disabled={resumesLoading}
                >
                  <option value="">None</option>
                  {resumes.map((resume: any) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Include your resume for personalized questions
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!selectedJobId || interviewPrep.isPending}
                className="w-full"
              >
                {interviewPrep.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate Interview Questions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {interviewPrep.isError && (
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {(interviewPrep.error as Error)?.message || 'Failed to generate interview questions. Please try again.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {companyInsights && (
            <Card>
              <CardHeader>
                <CardTitle>Company Insights</CardTitle>
                <CardDescription>Important information about the company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {companyInsights.culture && companyInsights.culture.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Culture</h4>
                    <ul className="space-y-1">
                      {companyInsights.culture.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-primary-600 mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {companyInsights.values && companyInsights.values.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Values</h4>
                    <ul className="space-y-1">
                      {companyInsights.values.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-primary-600 mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {companyInsights.interviewProcess && companyInsights.interviewProcess.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Interview Process</h4>
                    <ul className="space-y-1">
                      {companyInsights.interviewProcess.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-primary-600 mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Interview Questions</CardTitle>
                <CardDescription>
                  {questions.length} question{questions.length > 1 ? 's' : ''} to help you prepare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                      className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(q.category)}`}>
                              {q.category}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {q.question}
                          </p>
                        </div>
                        {expandedQuestion === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                    {expandedQuestion === index && (
                      <div className="px-4 pb-4 space-y-3">
                        {q.tips && q.tips.length > 0 && (
                          <div>
                            <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              <Lightbulb className="w-4 h-4 mr-1" />
                              Tips
                            </div>
                            <ul className="space-y-1">
                              {q.tips.map((tip, tipIdx) => (
                                <li key={tipIdx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                                  <span className="text-primary-600 mr-2">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {q.sampleAnswer && (
                          <div>
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Sample Answer
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                              {q.sampleAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {!interviewPrep.isSuccess && !interviewPrep.isError && !interviewPrep.isPending && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a job to generate interview preparation questions</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

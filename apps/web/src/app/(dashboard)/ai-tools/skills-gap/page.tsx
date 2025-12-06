'use client';

import { useState } from 'react';
import { ArrowLeft, TrendingUp, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useResumes } from '@/hooks/useResumes';
import { useSkillGapAnalysis } from '@/hooks/useAI';

export default function SkillsGapPage() {
  const { data: resumesData, isLoading: resumesLoading } = useResumes();
  const skillGapAnalysis = useSkillGapAnalysis();

  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');

  const resumes = resumesData?.resumes || [];

  const handleAnalyze = async () => {
    if (!selectedResumeId || !targetRole) {
      return;
    }

    skillGapAnalysis.mutate({
      resumeId: selectedResumeId,
      targetRole,
      targetCompany: targetCompany || undefined,
    });
  };

  const currentSkills = skillGapAnalysis.data?.currentSkills || [];
  const requiredSkills = skillGapAnalysis.data?.requiredSkills || [];
  const missingSkills = skillGapAnalysis.data?.missingSkills || [];
  const recommendations = skillGapAnalysis.data?.recommendations || [];

  const getImportanceColor = (importance: 'critical' | 'important' | 'nice-to-have') => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'important':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'nice-to-have':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'course':
        return '📚';
      case 'certification':
        return '🎓';
      case 'book':
        return '📖';
      case 'tutorial':
        return '💻';
      default:
        return '🔗';
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
            Skills Gap Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Identify missing skills based on target job requirements
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Select resume and target role</CardDescription>
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
                label="Target Role *"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Senior Full Stack Developer"
              />

              <Input
                label="Target Company (Optional)"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g., Google"
              />

              <Button
                onClick={handleAnalyze}
                disabled={!selectedResumeId || !targetRole || skillGapAnalysis.isPending}
                className="w-full"
              >
                {skillGapAnalysis.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyze Skills Gap
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {skillGapAnalysis.isError && (
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {(skillGapAnalysis.error as Error)?.message || 'Failed to analyze skills gap. Please try again.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {skillGapAnalysis.isSuccess && (
            <>
              {/* Overview */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {currentSkills.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Current Skills</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {requiredSkills.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Required Skills</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                        {missingSkills.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Missing Skills</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Skills */}
              {currentSkills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                      Your Current Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {currentSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Missing Skills */}
              {missingSkills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Missing Skills</CardTitle>
                    <CardDescription>
                      Skills you need to develop for your target role
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {missingSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {skill.skill}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded ${getImportanceColor(skill.importance)}`}>
                            {skill.importance}
                          </span>
                        </div>
                        {skill.learningResources && skill.learningResources.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Learning Resources:
                            </h5>
                            <div className="space-y-2">
                              {skill.learningResources.map((resource, resIdx) => (
                                <a
                                  key={resIdx}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <div className="flex items-center">
                                    <span className="mr-2">{getResourceIcon(resource.type)}</span>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {resource.name}
                                      </div>
                                      <div className="text-xs text-gray-500 capitalize">
                                        {resource.type}
                                      </div>
                                    </div>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-gray-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>Action items to close the skills gap</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-primary-600 dark:text-primary-400 mr-2 mt-1">
                            {idx + 1}.
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!skillGapAnalysis.isSuccess && !skillGapAnalysis.isError && !skillGapAnalysis.isPending && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a resume and target role to analyze your skills gap</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Eye, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useResume, useUpdateResume, useExportResume } from '@/hooks/useResumes';
import { useOptimizeResume } from '@/hooks/useAI';
import { WorkExperienceForm } from '@/components/forms/WorkExperienceForm';
import { EducationForm } from '@/components/forms/EducationForm';
import { SkillsForm } from '@/components/forms/SkillsForm';
import type { Experience, Education, Skill, PersonalInfo } from '@/types/resume';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { aiApi } from '@/lib/api/ai';
import { ResumePreview } from '@/app/(dashboard)/ai-tools/resume-builder/components/ResumePreview';

export default function ResumeDetailPage({ params }: { params: { id: string } }) {
  const { data: resume, isLoading: isLoadingResume, error } = useResume(params.id);
  const updateResume = useUpdateResume();
  const exportResume = useExportResume();
  const optimizeResume = useOptimizeResume();
  const { toast } = useToast();

  const [resumeName, setResumeName] = useState('');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    portfolio: '',
  });
  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingSkillSuggestions, setIsLoadingSkillSuggestions] = useState(false);

  // Initialize form data from resume
  useEffect(() => {
    if (resume) {
      setResumeName(resume.name);
      setPersonalInfo(resume.personalInfo);
      setSummary(resume.summary || '');
      setExperiences(resume.experience || []);
      setEducation(resume.education || []);
      setSkills(resume.skills || []);
    }
  }, [resume]);

  const handleSaveBasicInfo = async () => {
    try {
      await updateResume.mutateAsync({
        id: params.id,
        data: {
          name: resumeName,
          personalInfo,
          summary,
        },
      });
    } catch (error) {
      logger.error('Failed to save basic info', error as Error, { resumeId: params.id });
    }
  };

  const handleExperiencesChange = async (newExperiences: Experience[]) => {
    setExperiences(newExperiences);
    try {
      await updateResume.mutateAsync({
        id: params.id,
        data: {
          experience: newExperiences,
        },
      });
    } catch (error) {
      logger.error('Failed to save experiences', error as Error, { resumeId: params.id });
    }
  };

  const handleEducationChange = async (newEducation: Education[]) => {
    setEducation(newEducation);
    try {
      await updateResume.mutateAsync({
        id: params.id,
        data: {
          education: newEducation,
        },
      });
    } catch (error) {
      logger.error('Failed to save education', error as Error, { resumeId: params.id });
    }
  };

  const handleSkillsChange = async (newSkills: Skill[]) => {
    setSkills(newSkills);
    try {
      await updateResume.mutateAsync({
        id: params.id,
        data: {
          skills: newSkills,
        },
      });
    } catch (error) {
      logger.error('Failed to save skills', error as Error, { resumeId: params.id });
    }
  };

  const handleAISuggestSkills = async () => {
    if (!resume) return;

    setIsLoadingSkillSuggestions(true);
    try {
      // Use skill gap analysis to get skill suggestions
      const response = await aiApi.analyzeSkillGaps({
        resumeId: params.id,
        targetRole: experiences[0]?.position || 'Software Engineer',
      });

      // Convert suggested skills to the Skill format
      const suggestedSkills: Skill[] = response.missingSkills
        .filter(skillData => skillData.importance === 'critical' || skillData.importance === 'important')
        .slice(0, 10)
        .map((skillData, index) => ({
          id: `suggested-${Date.now()}-${index}`,
          name: skillData.skill,
          category: 'technical' as const,
          level: 'intermediate' as const,
        }));

      if (suggestedSkills.length === 0) {
        toast({
          title: 'No Suggestions',
          description: 'Your resume already has comprehensive skills coverage!',
          variant: 'info',
        });
        return;
      }

      // Merge with existing skills (avoid duplicates)
      const existingSkillNames = new Set(skills.map(s => s.name.toLowerCase()));
      const newSkills = suggestedSkills.filter(
        s => !existingSkillNames.has(s.name.toLowerCase())
      );

      if (newSkills.length > 0) {
        const updatedSkills = [...skills, ...newSkills];
        setSkills(updatedSkills);

        await updateResume.mutateAsync({
          id: params.id,
          data: { skills: updatedSkills },
        });

        toast({
          title: 'Skills Added',
          description: `Added ${newSkills.length} suggested skill${newSkills.length > 1 ? 's' : ''} to your resume.`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'All Skills Present',
          description: 'All suggested skills are already in your resume!',
          variant: 'info',
        });
      }
    } catch (error) {
      logger.error('Failed to suggest skills', error as Error, { resumeId: params.id });
      toast({
        title: 'Failed to Suggest Skills',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'error',
      });
    } finally {
      setIsLoadingSkillSuggestions(false);
    }
  };

  const handleAIOptimize = async () => {
    if (!resume) return;

    try {
      await optimizeResume.mutateAsync({
        resumeId: params.id,
        jobDescription: '',
        focusAreas: ['all'],
      });

      const optimizedData = optimizeResume.data;
      if (optimizedData) {
        let updateData: any = {};

        if (optimizedData.optimizedContent.summary) {
          setSummary(optimizedData.optimizedContent.summary);
          updateData.summary = optimizedData.optimizedContent.summary;
        }

        if (optimizedData.optimizedContent.skills && optimizedData.optimizedContent.skills.length > 0) {
          const optimizedSkills: Skill[] = optimizedData.optimizedContent.skills.map((skill, idx) => ({
            id: `optimized-${Date.now()}-${idx}`,
            name: skill,
            category: 'technical' as const,
            level: 'intermediate' as const,
          }));
          setSkills(optimizedSkills);
          updateData.skills = optimizedSkills;
        }

        if (Object.keys(updateData).length > 0) {
          await updateResume.mutateAsync({
            id: params.id,
            data: updateData,
          });

          toast({
            title: 'Resume Optimized',
            description: `Applied ${optimizedData.suggestions.length} optimization${optimizedData.suggestions.length > 1 ? 's' : ''}.`,
            variant: 'success',
          });
        }
      }
    } catch (error) {
      logger.error('Failed to optimize resume', error as Error, { resumeId: params.id });
      toast({
        title: 'Optimization Failed',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'error',
      });
    }
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleDownload = async () => {
    if (!resume) return;

    try {
      await exportResume.mutateAsync({
        id: params.id,
        format: 'pdf',
      });
    } catch (error) {
      logger.error('Failed to download resume', error as Error, { resumeId: params.id });
    }
  };

  if (isLoadingResume) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load resume</p>
          <Link href="/dashboard/resumes">
            <Button className="mt-4">Back to Resumes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const calculateCompleteness = () => {
    let score = 0;
    const maxScore = 7;

    if (resumeName) score++;
    if (personalInfo.fullName && personalInfo.email && personalInfo.phone) score++;
    if (summary && summary.length > 50) score++;
    if (experiences.length > 0) score++;
    if (education.length > 0) score++;
    if (skills.length >= 5) score++;
    if (personalInfo.linkedin || personalInfo.portfolio) score++;

    return Math.round((score / maxScore) * 100);
  };

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/resumes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Resumes
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={exportResume.isPending}
          >
            {exportResume.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button
            onClick={handleAIOptimize}
            disabled={optimizeResume.isPending}
          >
            {optimizeResume.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Optimize
              </>
            )}
          </Button>
        </div>
      </div>

      <div className={`grid ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
        {/* Editor */}
        <div className={`${showPreview ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-6`}>
          <Card>
            <CardHeader>
              <CardTitle>Resume Information</CardTitle>
              <CardDescription>Basic details about your resume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Resume Name</label>
                  <Input
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    onBlur={handleSaveBasicInfo}
                    placeholder="e.g., Software Engineer Resume"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={personalInfo.fullName.split(' ')[0] || ''}
                  onChange={(e) => {
                    const lastName = personalInfo.fullName.split(' ').slice(1).join(' ');
                    setPersonalInfo({
                      ...personalInfo,
                      fullName: `${e.target.value} ${lastName}`.trim(),
                    });
                  }}
                  onBlur={handleSaveBasicInfo}
                  placeholder="John"
                />
                <Input
                  label="Last Name"
                  value={personalInfo.fullName.split(' ').slice(1).join(' ') || ''}
                  onChange={(e) => {
                    const firstName = personalInfo.fullName.split(' ')[0];
                    setPersonalInfo({
                      ...personalInfo,
                      fullName: `${firstName} ${e.target.value}`.trim(),
                    });
                  }}
                  onBlur={handleSaveBasicInfo}
                  placeholder="Doe"
                />
                <div className="md:col-span-2">
                  <Input
                    label="Email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, email: e.target.value })
                    }
                    onBlur={handleSaveBasicInfo}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <Input
                  label="Phone"
                  value={personalInfo.phone}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, phone: e.target.value })
                  }
                  onBlur={handleSaveBasicInfo}
                  placeholder="+1 (555) 123-4567"
                />
                <Input
                  label="Location"
                  value={personalInfo.location || ''}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, location: e.target.value })
                  }
                  onBlur={handleSaveBasicInfo}
                  placeholder="San Francisco, CA"
                />
                <div className="md:col-span-2">
                  <Input
                    label="LinkedIn URL"
                    value={personalInfo.linkedin || ''}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, linkedin: e.target.value })
                    }
                    onBlur={handleSaveBasicInfo}
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Portfolio/Website"
                    value={personalInfo.portfolio || personalInfo.website || ''}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, portfolio: e.target.value })
                    }
                    onBlur={handleSaveBasicInfo}
                    placeholder="https://johndoe.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                onBlur={handleSaveBasicInfo}
                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                placeholder="Write a compelling summary of your professional experience and skills..."
              />
              <p className="text-xs text-gray-500 mt-2">
                {summary.length} characters • Recommended: 150-300 characters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
              <CardDescription>
                Add your professional work experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkExperienceForm
                experiences={experiences}
                onChange={handleExperiencesChange}
                isLoading={updateResume.isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>
                Add your educational background
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EducationForm
                education={education}
                onChange={handleEducationChange}
                isLoading={updateResume.isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                Add your technical and soft skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SkillsForm
                skills={skills}
                onChange={handleSkillsChange}
                isLoading={updateResume.isPending}
                onAISuggest={handleAISuggestSkills}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>Get AI-powered suggestions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAIOptimize}
                disabled={optimizeResume.isPending}
              >
                {optimizeResume.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Optimize for ATS
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  toast({
                    title: 'AI Feature',
                    description: 'Summary improvement feature coming soon!',
                    variant: 'info',
                  });
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Improve Summary
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAISuggestSkills}
                disabled={isLoadingSkillSuggestions}
              >
                {isLoadingSkillSuggestions ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Suggesting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Suggest Skills
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resume Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completeness</span>
                <span className="text-sm font-medium">{completeness}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Work Experience</span>
                  <span className="font-medium">{experiences.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Education</span>
                  <span className="font-medium">{education.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Skills</span>
                  <span className="font-medium">{skills.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                  <span className="font-medium">
                    {resume.updatedAt
                      ? new Date(resume.updatedAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Tips */}
          {completeness < 100 && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {!resumeName && (
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Add a resume name</span>
                    </li>
                  )}
                  {(!personalInfo.fullName || !personalInfo.email || !personalInfo.phone) && (
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Complete personal information</span>
                    </li>
                  )}
                  {(!summary || summary.length < 50) && (
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Write a professional summary</span>
                    </li>
                  )}
                  {experiences.length === 0 && (
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Add work experience</span>
                    </li>
                  )}
                  {education.length === 0 && (
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Add education</span>
                    </li>
                  )}
                  {skills.length < 5 && (
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Add at least 5 skills</span>
                    </li>
                  )}
                  {!personalInfo.linkedin && !personalInfo.portfolio && (
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Add LinkedIn or portfolio link</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resume Preview</CardTitle>
                <CardDescription>Live preview of your resume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResumePreview
                  data={{
                    name: resumeName,
                    personalInfo,
                    summary,
                    experience: experiences,
                    education,
                    skills,
                    projects: [],
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

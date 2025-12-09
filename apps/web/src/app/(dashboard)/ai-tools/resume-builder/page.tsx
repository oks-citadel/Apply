'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Download,
  Sparkles,
  Eye,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  FolderGit2,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import {
  useCreateResume,
  useUpdateResume,
  useExportResume
} from '@/hooks/useResumes';
import { aiApi } from '@/lib/api/ai';
import type { Resume, PersonalInfo, Experience, Education, Skill, Project } from '@/types/resume';

// Import components
import { ResumeSection } from './components/ResumeSection';
import { AISuggestionCard } from './components/AISuggestionCard';
import { ResumePreview } from './components/ResumePreview';
import { ScoreDisplay } from './components/ScoreDisplay';

type WizardStep = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'review';

interface ResumeBuilderState {
  name: string;
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
}

const WIZARD_STEPS: { id: WizardStep; label: string; icon: any }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'review', label: 'Review', icon: Eye },
];

export default function ResumeBuilderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createResume = useCreateResume();
  const updateResume = useUpdateResume();
  const exportResume = useExportResume();

  const [currentStep, setCurrentStep] = useState<WizardStep>('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);

  // Resume state
  const [resumeData, setResumeData] = useState<ResumeBuilderState>({
    name: 'New Resume',
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: '',
      website: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
  });

  // AI features state
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [resumeScore, setResumeScore] = useState<any>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  const currentStepIndex = WIZARD_STEPS.findIndex(step => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  // Update resume data
  const updateResumeData = useCallback((field: string, value: any) => {
    setResumeData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Navigation
  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex + 1].id);
    }
  }, [currentStepIndex, isLastStep]);

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].id);
    }
  }, [currentStepIndex, isFirstStep]);

  const goToStep = useCallback((stepId: WizardStep) => {
    setCurrentStep(stepId);
  }, []);

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    try {
      if (resumeId) {
        await updateResume.mutateAsync({
          id: resumeId,
          data: {
            name: resumeData.name,
            personalInfo: resumeData.personalInfo,
            summary: resumeData.summary,
            experience: resumeData.experience,
            education: resumeData.education,
            skills: resumeData.skills,
            projects: resumeData.projects,
          },
        });
      } else {
        const newResume = await createResume.mutateAsync({
          name: resumeData.name,
          personalInfo: resumeData.personalInfo,
          summary: resumeData.summary,
          template: 'modern',
        });
        setResumeId(newResume.id);
      }
      toast({
        title: 'Draft saved',
        description: 'Your resume has been saved as a draft.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [resumeId, resumeData, createResume, updateResume, toast]);

  // Export resume
  const handleExport = useCallback(async (format: 'pdf' | 'docx') => {
    if (!resumeId) {
      toast({
        title: 'Save first',
        description: 'Please save your resume before exporting.',
        variant: 'warning',
      });
      return;
    }

    try {
      await exportResume.mutateAsync({ id: resumeId, format });
    } catch (error) {
      console.error('Error exporting resume:', error);
    }
  }, [resumeId, exportResume, toast]);

  // AI: Generate suggestions for current section
  const handleGenerateAISuggestions = useCallback(async () => {
    setIsGeneratingAI(true);
    setAiSuggestions([]);

    try {
      let suggestions: any[] = [];

      switch (currentStep) {
        case 'summary':
          if (resumeData.experience.length > 0 || resumeData.skills.length > 0) {
            const response = await aiApi.generateSummary({
              experience: resumeData.experience,
              skills: resumeData.skills.map(s => s.name),
              tone: 'professional',
            });
            suggestions = [
              { type: 'summary', content: response.summary, label: 'AI-Generated Summary' },
              ...response.alternatives.map((alt, idx) => ({
                type: 'summary',
                content: alt,
                label: `Alternative ${idx + 1}`,
              })),
            ];
          }
          break;

        case 'experience':
          // Generate bullet points for the most recent experience
          if (resumeData.experience.length > 0) {
            const latestExp = resumeData.experience[0];
            const response = await aiApi.generateBullets({
              position: latestExp.position,
              company: latestExp.company,
              description: latestExp.description,
              count: 5,
            });
            suggestions = response.bullets.map((bullet, idx) => ({
              type: 'bullet',
              content: bullet,
              label: `Bullet Point ${idx + 1}`,
            }));
          }
          break;

        default:
          toast({
            title: 'No AI suggestions',
            description: 'AI suggestions are not available for this section.',
            variant: 'info',
          });
          return;
      }

      setAiSuggestions(suggestions);

      if (suggestions.length > 0) {
        toast({
          title: 'AI suggestions generated',
          description: `Generated ${suggestions.length} suggestions for you.`,
          variant: 'success',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred.';
      toast({
        title: 'Failed to generate suggestions',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  }, [currentStep, resumeData, toast]);

  // AI: Optimize entire resume
  const handleOptimizeResume = useCallback(async () => {
    if (!resumeId) {
      toast({
        title: 'Save first',
        description: 'Please save your resume before optimizing.',
        variant: 'warning',
      });
      return;
    }

    setIsGeneratingAI(true);

    try {
      const response = await aiApi.optimizeResume({
        resumeId,
        jobDescription: '', // Can be enhanced to accept job description
        focusAreas: ['all'],
      });

      // Apply optimizations
      if (response.optimizedContent.summary) {
        updateResumeData('summary', response.optimizedContent.summary);
      }

      if (response.optimizedContent.skills) {
        const optimizedSkills: Skill[] = response.optimizedContent.skills.map((skill, idx) => ({
          id: `skill-${idx}`,
          name: skill,
          category: 'technical' as const,
          level: 'intermediate' as const,
        }));
        updateResumeData('skills', optimizedSkills);
      }

      toast({
        title: 'Resume optimized',
        description: `Applied ${response.suggestions.length} optimizations to your resume.`,
        variant: 'success',
      });

      // Show suggestions
      setAiSuggestions(response.suggestions.map((sug, idx) => ({
        type: 'optimization',
        label: sug.section,
        content: sug.suggested,
        reason: sug.reason,
        impact: sug.impact,
      })));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred.';
      toast({
        title: 'Optimization failed',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  }, [resumeId, updateResumeData, toast]);

  // AI: Get resume score
  const handleGetResumeScore = useCallback(async () => {
    if (!resumeId) {
      toast({
        title: 'Save first',
        description: 'Please save your resume before scoring.',
        variant: 'warning',
      });
      return;
    }

    setIsLoadingScore(true);

    try {
      const score = await aiApi.getATSScore(resumeId, '');
      setResumeScore(score);

      toast({
        title: 'Score calculated',
        description: `Your resume scored ${score.percentage}%`,
        variant: 'success',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred.';
      toast({
        title: 'Scoring failed',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setIsLoadingScore(false);
    }
  }, [resumeId, toast]);

  // Apply AI suggestion
  const handleApplySuggestion = useCallback((suggestion: any) => {
    if (suggestion.type === 'summary') {
      updateResumeData('summary', suggestion.content);
      toast({
        title: 'Suggestion applied',
        description: 'The AI suggestion has been applied to your summary.',
        variant: 'success',
      });
    } else if (suggestion.type === 'bullet') {
      // Add to latest experience
      if (resumeData.experience.length > 0) {
        const updatedExperience = [...resumeData.experience];
        updatedExperience[0].highlights = [
          ...updatedExperience[0].highlights,
          suggestion.content,
        ];
        updateResumeData('experience', updatedExperience);
        toast({
          title: 'Bullet point added',
          description: 'The bullet point has been added to your experience.',
          variant: 'success',
        });
      }
    }
  }, [resumeData, updateResumeData, toast]);

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isDraft && resumeId) {
        handleSaveDraft();
      }
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [resumeData, isDraft, resumeId]); // Removed handleSaveDraft from deps to avoid infinite loop

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Resume Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Build your professional resume with AI-powered suggestions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={createResume.isPending || updateResume.isPending}
            loading={createResume.isPending || updateResume.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      {/* Wizard Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : isCompleted
                        ? 'text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium hidden md:block">{step.label}</span>
                  </button>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`h-0.5 w-8 mx-2 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Resume Editor */}
        <div className={showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{WIZARD_STEPS[currentStepIndex].label}</CardTitle>
                  <CardDescription>
                    {currentStep === 'personal' && 'Add your contact information'}
                    {currentStep === 'summary' && 'Write a professional summary'}
                    {currentStep === 'experience' && 'Add your work experience'}
                    {currentStep === 'education' && 'Add your education background'}
                    {currentStep === 'skills' && 'List your skills and expertise'}
                    {currentStep === 'projects' && 'Showcase your projects'}
                    {currentStep === 'review' && 'Review and finalize your resume'}
                  </CardDescription>
                </div>
                {(currentStep === 'summary' || currentStep === 'experience') && (
                  <Button
                    onClick={handleGenerateAISuggestions}
                    disabled={isGeneratingAI}
                    loading={isGeneratingAI}
                    size="sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Suggest
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ResumeSection
                step={currentStep}
                data={resumeData}
                onUpdate={updateResumeData}
              />

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={isFirstStep}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Step {currentStepIndex + 1} of {WIZARD_STEPS.length}
                </div>

                {isLastStep ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExport('pdf')}
                      disabled={!resumeId || exportResume.isPending}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button
                      onClick={() => router.push('/resumes')}
                    >
                      Finish
                    </Button>
                  </div>
                ) : (
                  <Button onClick={goToNextStep}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                AI Suggestions
              </h3>
              {aiSuggestions.map((suggestion, index) => (
                <AISuggestionCard
                  key={index}
                  suggestion={suggestion}
                  onApply={() => handleApplySuggestion(suggestion)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Preview & Score */}
        {showPreview && (
          <div className="lg:col-span-1 space-y-6">
            {/* Resume Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resume Score</CardTitle>
              </CardHeader>
              <CardContent>
                {resumeScore ? (
                  <ScoreDisplay score={resumeScore} />
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Get your resume scored by AI
                    </p>
                    <Button
                      size="sm"
                      onClick={handleGetResumeScore}
                      disabled={isLoadingScore || !resumeId}
                      loading={isLoadingScore}
                    >
                      Calculate Score
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Optimize Button */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Optimize with AI
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Let AI analyze and optimize your entire resume for better results
                  </p>
                  <Button
                    onClick={handleOptimizeResume}
                    disabled={isGeneratingAI || !resumeId}
                    loading={isGeneratingAI}
                    className="w-full"
                  >
                    Optimize Resume
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResumePreview data={resumeData} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

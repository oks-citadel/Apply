'use client';

import { useState, useEffect } from 'react';
import { User, Briefcase, GraduationCap, Award, Code, MapPin, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { WorkExperienceForm } from '@/components/forms/WorkExperienceForm';
import { EducationForm } from '@/components/forms/EducationForm';
import { SkillsForm } from '@/components/forms/SkillsForm';
import { CertificationsForm, type Certification } from '@/components/forms/CertificationsForm';
import { useProfile, useUpdateProfile } from '@/hooks/useUser';
import type { Experience, Education as EducationType, Skill } from '@/types/resume';

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const [activeSection, setActiveSection] = useState('basic');

  // State for each section
  const [workExperiences, setWorkExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<EducationType[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'work', label: 'Work Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'contact', label: 'Contact & Links', icon: MapPin },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your professional profile and career information
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Profile Completeness */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Profile Completeness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-semibold">{profile?.completeness_score || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profile?.completeness_score || 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Complete your profile to improve your job match rate
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'basic' && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm />
              </CardContent>
            </Card>
          )}

          {activeSection === 'work' && (
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
                <CardDescription>
                  Add your work history to showcase your professional background
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkExperienceForm
                  experiences={workExperiences}
                  onChange={setWorkExperiences}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          )}

          {activeSection === 'education' && (
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>
                  Add your educational background and qualifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EducationForm
                  education={education}
                  onChange={setEducation}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          )}

          {activeSection === 'skills' && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <CardDescription>
                  Highlight your technical and soft skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkillsForm
                  skills={skills}
                  onChange={setSkills}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          )}

          {activeSection === 'certifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
                <CardDescription>
                  Add your professional certifications and credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CertificationsForm
                  certifications={certifications}
                  onChange={setCertifications}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          )}

          {activeSection === 'contact' && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information & Links</CardTitle>
                <CardDescription>
                  Add your contact details and professional links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm profile={profile} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactForm({ profile }: { profile: any }) {
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    location: profile?.location || '',
    linkedinUrl: profile?.linkedinUrl || profile?.linkedin_url || '',
    githubUrl: profile?.githubUrl || profile?.github_url || '',
    portfolioUrl: profile?.portfolioUrl || profile?.portfolio_url || '',
  });
  const [isModified, setIsModified] = useState(false);

  // Update form when profile data changes (e.g., after save or initial load)
  useEffect(() => {
    if (profile) {
      setFormData({
        phone: profile?.phone || '',
        location: profile?.location || '',
        linkedinUrl: profile?.linkedinUrl || profile?.linkedin_url || '',
        githubUrl: profile?.githubUrl || profile?.github_url || '',
        portfolioUrl: profile?.portfolioUrl || profile?.portfolio_url || '',
      });
      setIsModified(false);
    }
  }, [profile]);

  // Track if form has been modified
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setIsModified(true);
  };

  const handleSave = () => {
    // Validate URLs before saving
    const urlFields: Array<keyof typeof formData> = ['linkedinUrl', 'githubUrl', 'portfolioUrl'];
    for (const field of urlFields) {
      const value = formData[field];
      if (value && value.trim() !== '') {
        try {
          new URL(value);
        } catch {
          // Invalid URL
          alert(`Please enter a valid URL for ${field.replace('Url', '').replace(/([A-Z])/g, ' $1').trim()}`);
          return;
        }
      }
    }

    // Transform camelCase to snake_case for backend compatibility
    const updateData = {
      phone: formData.phone || undefined,
      location: formData.location || undefined,
      linkedin_url: formData.linkedinUrl || undefined,
      github_url: formData.githubUrl || undefined,
      portfolio_url: formData.portfolioUrl || undefined,
    };

    updateProfile(updateData as any, {
      onSuccess: () => {
        setIsModified(false);
      },
    });
  };

  const handleCancel = () => {
    // Reset form to original profile values
    setFormData({
      phone: profile?.phone || '',
      location: profile?.location || '',
      linkedinUrl: profile?.linkedinUrl || profile?.linkedin_url || '',
      githubUrl: profile?.githubUrl || profile?.github_url || '',
      portfolioUrl: profile?.portfolioUrl || profile?.portfolio_url || '',
    });
    setIsModified(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+1 (555) 123-4567"
          disabled={isPending}
        />
        <Input
          label="Location"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="San Francisco, CA"
          disabled={isPending}
        />
      </div>

      <div className="space-y-4">
        <Input
          label="LinkedIn URL"
          type="url"
          value={formData.linkedinUrl}
          onChange={(e) => handleChange('linkedinUrl', e.target.value)}
          placeholder="https://linkedin.com/in/username"
          disabled={isPending}
        />
        <Input
          label="GitHub URL"
          type="url"
          value={formData.githubUrl}
          onChange={(e) => handleChange('githubUrl', e.target.value)}
          placeholder="https://github.com/username"
          disabled={isPending}
        />
        <Input
          label="Portfolio URL"
          type="url"
          value={formData.portfolioUrl}
          onChange={(e) => handleChange('portfolioUrl', e.target.value)}
          placeholder="https://yourportfolio.com"
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isPending || !isModified}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={isPending}
          disabled={!isModified}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}

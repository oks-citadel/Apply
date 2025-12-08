'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Calendar } from 'lucide-react';
import type { PersonalInfo, Experience, Education, Skill, Project } from '@/types/resume';

interface ResumeSectionProps {
  step: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'review';
  data: {
    name: string;
    personalInfo: PersonalInfo;
    summary: string;
    experience: Experience[];
    education: Education[];
    skills: Skill[];
    projects: Project[];
  };
  onUpdate: (field: string, value: any) => void;
}

export function ResumeSection({ step, data, onUpdate }: ResumeSectionProps) {
  switch (step) {
    case 'personal':
      return <PersonalInfoSection data={data.personalInfo} onUpdate={onUpdate} />;
    case 'summary':
      return <SummarySection summary={data.summary} onUpdate={onUpdate} />;
    case 'experience':
      return <ExperienceSection experience={data.experience} onUpdate={onUpdate} />;
    case 'education':
      return <EducationSection education={data.education} onUpdate={onUpdate} />;
    case 'skills':
      return <SkillsSection skills={data.skills} onUpdate={onUpdate} />;
    case 'projects':
      return <ProjectsSection projects={data.projects} onUpdate={onUpdate} />;
    case 'review':
      return <ReviewSection data={data} onUpdate={onUpdate} />;
    default:
      return null;
  }
}

// Personal Info Section
function PersonalInfoSection({
  data,
  onUpdate,
}: {
  data: PersonalInfo;
  onUpdate: (field: string, value: any) => void;
}) {
  const updateField = (field: keyof PersonalInfo, value: string) => {
    onUpdate('personalInfo', { ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={data.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
          placeholder="John Doe"
          required
        />
        <Input
          label="Email"
          type="email"
          value={data.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="john.doe@example.com"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Phone"
          type="tel"
          value={data.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="+1 (555) 123-4567"
          required
        />
        <Input
          label="Location"
          value={data.location || ''}
          onChange={(e) => updateField('location', e.target.value)}
          placeholder="San Francisco, CA"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="LinkedIn"
          value={data.linkedin || ''}
          onChange={(e) => updateField('linkedin', e.target.value)}
          placeholder="linkedin.com/in/johndoe"
        />
        <Input
          label="GitHub"
          value={data.github || ''}
          onChange={(e) => updateField('github', e.target.value)}
          placeholder="github.com/johndoe"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Portfolio"
          value={data.portfolio || ''}
          onChange={(e) => updateField('portfolio', e.target.value)}
          placeholder="johndoe.com"
        />
        <Input
          label="Website"
          value={data.website || ''}
          onChange={(e) => updateField('website', e.target.value)}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );
}

// Summary Section
function SummarySection({
  summary,
  onUpdate,
}: {
  summary: string;
  onUpdate: (field: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Professional Summary
        </label>
        <textarea
          value={summary}
          onChange={(e) => onUpdate('summary', e.target.value)}
          placeholder="Write a brief summary highlighting your key skills, experience, and career objectives..."
          className="flex min-h-[150px] w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={6}
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Tip: Keep it concise (2-4 sentences) and focus on your unique value proposition.
        </p>
      </div>
    </div>
  );
}

// Experience Section
function ExperienceSection({
  experience,
  onUpdate,
}: {
  experience: Experience[];
  onUpdate: (field: string, value: any) => void;
}) {
  const addExperience = () => {
    const newExp: Experience = {
      id: `exp-${Date.now()}`,
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      highlights: [],
    };
    onUpdate('experience', [...experience, newExp]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate('experience', updated);
  };

  const removeExperience = (index: number) => {
    onUpdate('experience', experience.filter((_, i) => i !== index));
  };

  const addHighlight = (index: number) => {
    const updated = [...experience];
    updated[index].highlights = [...updated[index].highlights, ''];
    onUpdate('experience', updated);
  };

  const updateHighlight = (expIndex: number, highlightIndex: number, value: string) => {
    const updated = [...experience];
    updated[expIndex].highlights[highlightIndex] = value;
    onUpdate('experience', updated);
  };

  const removeHighlight = (expIndex: number, highlightIndex: number) => {
    const updated = [...experience];
    updated[expIndex].highlights = updated[expIndex].highlights.filter((_, i) => i !== highlightIndex);
    onUpdate('experience', updated);
  };

  return (
    <div className="space-y-6">
      {experience.map((exp, index) => (
        <div key={exp.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">Experience #{index + 1}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeExperience(index)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Position"
              value={exp.position}
              onChange={(e) => updateExperience(index, 'position', e.target.value)}
              placeholder="Software Engineer"
            />
            <Input
              label="Company"
              value={exp.company}
              onChange={(e) => updateExperience(index, 'company', e.target.value)}
              placeholder="Tech Corp"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Start Date"
              type="month"
              value={exp.startDate}
              onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
            />
            <Input
              label="End Date"
              type="month"
              value={exp.endDate || ''}
              onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
              disabled={exp.current}
            />
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Current Position
              </label>
            </div>
          </div>

          <Input
            label="Location"
            value={exp.location || ''}
            onChange={(e) => updateExperience(index, 'location', e.target.value)}
            placeholder="San Francisco, CA"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={exp.description}
              onChange={(e) => updateExperience(index, 'description', e.target.value)}
              placeholder="Brief description of your role and responsibilities..."
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Key Achievements
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addHighlight(index)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {exp.highlights.map((highlight, hIndex) => (
              <div key={hIndex} className="flex gap-2 mb-2">
                <Input
                  value={highlight}
                  onChange={(e) => updateHighlight(index, hIndex, e.target.value)}
                  placeholder="Led development of feature X that increased Y by Z%"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHighlight(index, hIndex)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button onClick={addExperience} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Experience
      </Button>
    </div>
  );
}

// Education Section
function EducationSection({
  education,
  onUpdate,
}: {
  education: Education[];
  onUpdate: (field: string, value: any) => void;
}) {
  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: '',
    };
    onUpdate('education', [...education, newEdu]);
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate('education', updated);
  };

  const removeEducation = (index: number) => {
    onUpdate('education', education.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {education.map((edu, index) => (
        <div key={edu.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">Education #{index + 1}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeEducation(index)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Institution"
              value={edu.institution}
              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
              placeholder="University of Example"
            />
            <Input
              label="Degree"
              value={edu.degree}
              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
              placeholder="Bachelor of Science"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Field of Study"
              value={edu.field}
              onChange={(e) => updateEducation(index, 'field', e.target.value)}
              placeholder="Computer Science"
            />
            <Input
              label="Location"
              value={edu.location || ''}
              onChange={(e) => updateEducation(index, 'location', e.target.value)}
              placeholder="Boston, MA"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Start Date"
              type="month"
              value={edu.startDate}
              onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
            />
            <Input
              label="End Date"
              type="month"
              value={edu.endDate || ''}
              onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
            />
            <Input
              label="GPA (Optional)"
              value={edu.gpa || ''}
              onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
              placeholder="3.8/4.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Details
            </label>
            <textarea
              value={edu.description || ''}
              onChange={(e) => updateEducation(index, 'description', e.target.value)}
              placeholder="Honors, relevant coursework, activities..."
              className="flex min-h-[60px] w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              rows={2}
            />
          </div>
        </div>
      ))}

      <Button onClick={addEducation} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Education
      </Button>
    </div>
  );
}

// Skills Section
function SkillsSection({
  skills,
  onUpdate,
}: {
  skills: Skill[];
  onUpdate: (field: string, value: any) => void;
}) {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<Skill['category']>('technical');

  const addSkill = () => {
    if (!newSkillName.trim()) return;

    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: newSkillName,
      category: newSkillCategory,
      level: 'intermediate',
    };
    onUpdate('skills', [...skills, newSkill]);
    setNewSkillName('');
  };

  const removeSkill = (index: number) => {
    onUpdate('skills', skills.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
        <h4 className="font-semibold text-gray-900 dark:text-white">Add New Skill</h4>
        <div className="flex gap-3">
          <Input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="e.g., React, Python, Project Management"
            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
          />
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value as Skill['category'])}
            className="flex h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="technical">Technical</option>
            <option value="soft">Soft Skill</option>
            <option value="language">Language</option>
            <option value="tool">Tool</option>
            <option value="other">Other</option>
          </select>
          <Button onClick={addSkill}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Your Skills</h4>
        {skills.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No skills added yet. Add your first skill above.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {skills.map((skill, index) => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{skill.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{skill.category}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSkill(index)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Projects Section
function ProjectsSection({
  projects,
  onUpdate,
}: {
  projects: Project[];
  onUpdate: (field: string, value: any) => void;
}) {
  const addProject = () => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: '',
      description: '',
      technologies: [],
      url: '',
      github: '',
      startDate: '',
      endDate: '',
      highlights: [],
    };
    onUpdate('projects', [...projects, newProject]);
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate('projects', updated);
  };

  const removeProject = (index: number) => {
    onUpdate('projects', projects.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {projects.map((project, index) => (
        <div key={project.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">Project #{index + 1}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeProject(index)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <Input
            label="Project Name"
            value={project.name}
            onChange={(e) => updateProject(index, 'name', e.target.value)}
            placeholder="E-commerce Platform"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={project.description}
              onChange={(e) => updateProject(index, 'description', e.target.value)}
              placeholder="Describe what the project does and your role..."
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Live URL"
              value={project.url || ''}
              onChange={(e) => updateProject(index, 'url', e.target.value)}
              placeholder="https://project.com"
            />
            <Input
              label="GitHub URL"
              value={project.github || ''}
              onChange={(e) => updateProject(index, 'github', e.target.value)}
              placeholder="https://github.com/user/repo"
            />
          </div>

          <Input
            label="Technologies (comma-separated)"
            value={project.technologies.join(', ')}
            onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(t => t.trim()))}
            placeholder="React, Node.js, MongoDB"
          />
        </div>
      ))}

      <Button onClick={addProject} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Project
      </Button>
    </div>
  );
}

// Review Section
function ReviewSection({
  data,
  onUpdate,
}: {
  data: any;
  onUpdate: (field: string, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Review Your Resume</h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Review all sections of your resume. You can go back to any section to make changes.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>{data.personalInfo.fullName}</p>
            <p>{data.personalInfo.email} | {data.personalInfo.phone}</p>
            {data.personalInfo.location && <p>{data.personalInfo.location}</p>}
          </div>
        </div>

        {data.summary && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Professional Summary</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{data.summary}</p>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Experience</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.experience.length} position{data.experience.length !== 1 ? 's' : ''} added
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Education</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.education.length} degree{data.education.length !== 1 ? 's' : ''} added
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Skills</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.skills.length} skill{data.skills.length !== 1 ? 's' : ''} added
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Projects</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.projects.length} project{data.projects.length !== 1 ? 's' : ''} added
          </p>
        </div>
      </div>
    </div>
  );
}

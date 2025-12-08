'use client';

import { Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';
import type { PersonalInfo, Experience, Education, Skill, Project } from '@/types/resume';

interface ResumePreviewProps {
  data: {
    name: string;
    personalInfo: PersonalInfo;
    summary: string;
    experience: Experience[];
    education: Education[];
    skills: Skill[];
    projects: Project[];
  };
}

export function ResumePreview({ data }: ResumePreviewProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-sm max-h-[800px] overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {data.personalInfo.fullName || 'Your Name'}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
          {data.personalInfo.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>{data.personalInfo.email}</span>
            </div>
          )}
          {data.personalInfo.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{data.personalInfo.phone}</span>
            </div>
          )}
          {data.personalInfo.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{data.personalInfo.location}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
          {data.personalInfo.linkedin && (
            <div className="flex items-center gap-1">
              <Linkedin className="w-3 h-3" />
              <span className="truncate">{data.personalInfo.linkedin}</span>
            </div>
          )}
          {data.personalInfo.github && (
            <div className="flex items-center gap-1">
              <Github className="w-3 h-3" />
              <span className="truncate">{data.personalInfo.github}</span>
            </div>
          )}
          {(data.personalInfo.portfolio || data.personalInfo.website) && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span className="truncate">
                {data.personalInfo.portfolio || data.personalInfo.website}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide border-b border-gray-300 dark:border-gray-700 pb-1">
            Professional Summary
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide border-b border-gray-300 dark:border-gray-700 pb-1">
            Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {exp.position}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      {exp.company}
                      {exp.location && ` | ${exp.location}`}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right whitespace-nowrap ml-2">
                    {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate || '')}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                    {exp.description}
                  </p>
                )}
                {exp.highlights.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-700 dark:text-gray-300 ml-2">
                    {exp.highlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide border-b border-gray-300 dark:border-gray-700 pb-1">
            Education
          </h2>
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {edu.degree} in {edu.field}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      {edu.institution}
                      {edu.location && ` | ${edu.location}`}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right whitespace-nowrap ml-2">
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate || '')}
                  </div>
                </div>
                {edu.gpa && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">GPA: {edu.gpa}</p>
                )}
                {edu.description && (
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide border-b border-gray-300 dark:border-gray-700 pb-1">
            Skills
          </h2>
          <div className="space-y-2">
            {['technical', 'soft', 'language', 'tool', 'other'].map((category) => {
              const categorySkills = data.skills.filter((s) => s.category === category);
              if (categorySkills.length === 0) return null;

              return (
                <div key={category}>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-xs capitalize">
                    {category === 'technical' ? 'Technical' : category}:{' '}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-xs">
                    {categorySkills.map((s) => s.name).join(', ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide border-b border-gray-300 dark:border-gray-700 pb-1">
            Projects
          </h2>
          <div className="space-y-3">
            {data.projects.map((project) => (
              <div key={project.id}>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                    {project.description}
                  </p>
                )}
                {project.technologies.length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span className="font-medium">Technologies:</span>{' '}
                    {project.technologies.join(', ')}
                  </p>
                )}
                <div className="flex gap-3 text-xs">
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Live Demo
                    </a>
                  )}
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!data.personalInfo.fullName &&
        !data.summary &&
        data.experience.length === 0 &&
        data.education.length === 0 &&
        data.skills.length === 0 &&
        data.projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 dark:text-gray-500">
              Your resume preview will appear here as you build it.
            </p>
          </div>
        )}
    </div>
  );
}

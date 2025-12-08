import React from 'react';
import { ResumeTemplate, TemplateCustomization } from '@/types/template';
import { Resume } from '@/types/resume';
import { TemplateRenderer } from './TemplateRenderer';
import { Badge } from '@/components/ui/Badge';
import { Check } from 'lucide-react';

interface TemplatePreviewProps {
  template: ResumeTemplate;
  customization?: TemplateCustomization;
  resumeData?: Resume;
  selected?: boolean;
  onSelect?: () => void;
  showDetails?: boolean;
  scale?: number;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  customization,
  resumeData,
  selected = false,
  onSelect,
  showDetails = true,
  scale = 0.25,
}) => {
  const finalCustomization = customization || template.defaultCustomization;

  // Mock resume data for preview if not provided
  const mockResume: Resume = resumeData || {
    id: 'preview',
    userId: 'preview',
    name: 'Preview Resume',
    template: template.id,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    personalInfo: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/johndoe',
      portfolio: 'johndoe.com',
    },
    summary:
      'Results-driven professional with 8+ years of experience in technology and business development. Proven track record of leading cross-functional teams and delivering innovative solutions.',
    experience: [
      {
        id: '1',
        company: 'Tech Company Inc.',
        position: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        startDate: '2020',
        endDate: '2024',
        current: false,
        description:
          'Led development of scalable web applications and mentored junior developers.',
        highlights: [
          'Improved application performance by 40% through optimization',
          'Led team of 5 developers on flagship product',
          'Implemented CI/CD pipeline reducing deployment time by 60%',
        ],
      },
      {
        id: '2',
        company: 'Startup Co.',
        position: 'Software Engineer',
        location: 'New York, NY',
        startDate: '2018',
        endDate: '2020',
        current: false,
        description: 'Developed full-stack features for SaaS platform.',
        highlights: [
          'Built RESTful APIs serving 100K+ requests daily',
          'Implemented responsive UI using React and TypeScript',
        ],
      },
    ],
    education: [
      {
        id: '1',
        institution: 'University of Technology',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'Boston, MA',
        startDate: '2014',
        endDate: '2018',
        gpa: '3.8',
      },
    ],
    skills: [
      { id: '1', name: 'JavaScript', category: 'technical', level: 'expert' },
      { id: '2', name: 'React', category: 'technical', level: 'expert' },
      { id: '3', name: 'Node.js', category: 'technical', level: 'advanced' },
      { id: '4', name: 'TypeScript', category: 'technical', level: 'advanced' },
      { id: '5', name: 'Python', category: 'technical', level: 'intermediate' },
      { id: '6', name: 'AWS', category: 'technical', level: 'advanced' },
      { id: '7', name: 'Docker', category: 'tool', level: 'advanced' },
      { id: '8', name: 'Leadership', category: 'soft', level: 'expert' },
    ],
  };

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 ${
        selected ? 'ring-4 ring-primary-500 ring-offset-2' : 'hover:shadow-xl'
      }`}
      onClick={onSelect}
    >
      {/* Preview Container */}
      <div className="relative bg-white rounded-lg overflow-hidden shadow-md">
        {selected && (
          <div className="absolute top-3 right-3 z-10 bg-primary-600 text-white rounded-full p-2 shadow-lg">
            <Check className="w-5 h-5" />
          </div>
        )}

        {template.isPremium && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="default" className="bg-yellow-500 text-white">
              Premium
            </Badge>
          </div>
        )}

        {/* Scaled Template Preview */}
        <div
          className="relative overflow-hidden"
          style={{
            height: `${297 * scale}mm`,
            width: `${210 * scale}mm`,
          }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <TemplateRenderer
              templateId={template.id}
              resume={mockResume}
              customization={finalCustomization}
              scale={scale}
            />
          </div>
        </div>
      </div>

      {/* Template Details */}
      {showDetails && (
        <div className="mt-3">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
            {template.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {template.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;

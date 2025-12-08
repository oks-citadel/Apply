import React from 'react';
import { Resume } from '@/types/resume';
import { TemplateCustomization, COLOR_SCHEMES, FONT_FAMILIES } from '@/types/template';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Calendar, Briefcase, GraduationCap } from 'lucide-react';

interface TemplateRendererProps {
  templateId: string;
  resume: Resume;
  customization: TemplateCustomization;
  scale?: number;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  templateId,
  resume,
  customization,
  scale = 1,
}) => {
  const colors = COLOR_SCHEMES[customization.colorScheme];
  const fontClass = FONT_FAMILIES[customization.fontFamily].cssClass;

  const containerStyle: React.CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    width: `${100 / scale}%`,
    backgroundColor: 'white',
    color: colors.text,
    fontSize: `${customization.fontSize}px`,
    lineHeight: customization.lineHeight,
  };

  const renderTemplate = () => {
    switch (templateId) {
      case 'professional-classic':
        return <ProfessionalClassicTemplate resume={resume} customization={customization} colors={colors} />;
      case 'modern-minimalist':
        return <ModernMinimalistTemplate resume={resume} customization={customization} colors={colors} />;
      case 'creative-designer':
        return <CreativeDesignerTemplate resume={resume} customization={customization} colors={colors} />;
      case 'executive-professional':
        return <ExecutiveProfessionalTemplate resume={resume} customization={customization} colors={colors} />;
      case 'tech-developer':
        return <TechDeveloperTemplate resume={resume} customization={customization} colors={colors} />;
      case 'simple-elegant':
        return <SimpleElegantTemplate resume={resume} customization={customization} colors={colors} />;
      default:
        return <ProfessionalClassicTemplate resume={resume} customization={customization} colors={colors} />;
    }
  };

  return (
    <div className={`resume-template ${fontClass}`} style={containerStyle}>
      {renderTemplate()}
    </div>
  );
};

// Professional Classic Template
const ProfessionalClassicTemplate: React.FC<{
  resume: Resume;
  customization: TemplateCustomization;
  colors: any;
}> = ({ resume, customization, colors }) => {
  const showIcons = customization.showIcons;

  return (
    <div className="p-8 max-w-[210mm] min-h-[297mm] mx-auto">
      {/* Header */}
      <header className="text-center border-b-2 pb-6 mb-6" style={{ borderColor: colors.primary }}>
        <h1 className="text-4xl font-bold mb-2" style={{ color: colors.primary }}>
          {resume.personalInfo.fullName}
        </h1>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
          {resume.personalInfo.email && (
            <div className="flex items-center gap-1">
              {showIcons && <Mail className="w-4 h-4" />}
              {resume.personalInfo.email}
            </div>
          )}
          {resume.personalInfo.phone && (
            <div className="flex items-center gap-1">
              {showIcons && <Phone className="w-4 h-4" />}
              {resume.personalInfo.phone}
            </div>
          )}
          {resume.personalInfo.location && (
            <div className="flex items-center gap-1">
              {showIcons && <MapPin className="w-4 h-4" />}
              {resume.personalInfo.location}
            </div>
          )}
        </div>
        {(resume.personalInfo.linkedin || resume.personalInfo.portfolio || resume.personalInfo.website) && (
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mt-2">
            {resume.personalInfo.linkedin && (
              <div className="flex items-center gap-1">
                {showIcons && <Linkedin className="w-4 h-4" />}
                LinkedIn
              </div>
            )}
            {(resume.personalInfo.portfolio || resume.personalInfo.website) && (
              <div className="flex items-center gap-1">
                {showIcons && <Globe className="w-4 h-4" />}
                Portfolio
              </div>
            )}
          </div>
        )}
      </header>

      {/* Summary */}
      {resume.summary && (
        <section className="mb-6" style={{ marginBottom: `${customization.sectionSpacing}px` }}>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide" style={{ color: colors.primary }}>
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">{resume.summary}</p>
        </section>
      )}

      {/* Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <section className="mb-6" style={{ marginBottom: `${customization.sectionSpacing}px` }}>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide" style={{ color: colors.primary }}>
            Work Experience
          </h2>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-lg">{exp.position}</h3>
                  <p className="text-gray-700">{exp.company}</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    {showIcons && <Calendar className="w-4 h-4" />}
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </div>
                  {exp.location && <div>{exp.location}</div>}
                </div>
              </div>
              <p className="text-gray-700 mb-2">{exp.description}</p>
              {exp.highlights && exp.highlights.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {exp.highlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <section className="mb-6" style={{ marginBottom: `${customization.sectionSpacing}px` }}>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide" style={{ color: colors.primary }}>
            Education
          </h2>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{edu.degree} in {edu.field}</h3>
                  <p className="text-gray-700">{edu.institution}</p>
                  {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    {showIcons && <Calendar className="w-4 h-4" />}
                    {edu.startDate} - {edu.endDate || 'Present'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wide" style={{ color: colors.primary }}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <span
                key={skill.id}
                className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: colors.accent, color: colors.primary }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Modern Minimalist Template
const ModernMinimalistTemplate: React.FC<{
  resume: Resume;
  customization: TemplateCustomization;
  colors: any;
}> = ({ resume, customization, colors }) => {
  return (
    <div className="p-12 max-w-[210mm] min-h-[297mm] mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-5xl font-light mb-1" style={{ color: colors.text }}>
          {resume.personalInfo.fullName}
        </h1>
        <div className="h-0.5 w-20 mb-4" style={{ backgroundColor: colors.primary }} />
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          {resume.personalInfo.email && <span>{resume.personalInfo.email}</span>}
          {resume.personalInfo.phone && <span>{resume.personalInfo.phone}</span>}
          {resume.personalInfo.location && <span>{resume.personalInfo.location}</span>}
        </div>
      </header>

      {/* Summary */}
      {resume.summary && (
        <section className="mb-8">
          <p className="text-gray-700 leading-relaxed text-base">{resume.summary}</p>
        </section>
      )}

      {/* Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-light mb-4" style={{ color: colors.primary }}>
            Experience
          </h2>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-6">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-semibold text-lg">{exp.position}</h3>
                <span className="text-sm text-gray-500">
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <p className="text-gray-600 mb-2">{exp.company} • {exp.location}</p>
              <p className="text-gray-700 mb-2">{exp.description}</p>
              {exp.highlights && exp.highlights.length > 0 && (
                <ul className="space-y-1 text-gray-700 ml-0">
                  {exp.highlights.map((highlight, idx) => (
                    <li key={idx} className="pl-4 relative before:content-['—'] before:absolute before:left-0">
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-light mb-4" style={{ color: colors.primary }}>
            Education
          </h2>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold">{edu.degree} in {edu.field}</h3>
                <span className="text-sm text-gray-500">
                  {edu.startDate} - {edu.endDate || 'Present'}
                </span>
              </div>
              <p className="text-gray-600">{edu.institution}</p>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <section>
          <h2 className="text-2xl font-light mb-4" style={{ color: colors.primary }}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-3">
            {resume.skills.map((skill) => (
              <span key={skill.id} className="text-gray-700">
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Creative Designer Template
const CreativeDesignerTemplate: React.FC<{
  resume: Resume;
  customization: TemplateCustomization;
  colors: any;
}> = ({ resume, customization, colors }) => {
  return (
    <div className="flex max-w-[210mm] min-h-[297mm] mx-auto">
      {/* Sidebar */}
      <aside className="w-1/3 p-6" style={{ backgroundColor: colors.primary, color: 'white' }}>
        {customization.showPhoto && (
          <div className="w-32 h-32 rounded-full bg-white/20 mx-auto mb-6" />
        )}

        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 opacity-80">Contact</h2>
          <div className="space-y-2 text-sm">
            {resume.personalInfo.email && <div className="flex items-start gap-2"><Mail className="w-4 h-4 mt-0.5 flex-shrink-0" /><span className="break-all">{resume.personalInfo.email}</span></div>}
            {resume.personalInfo.phone && <div className="flex items-start gap-2"><Phone className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{resume.personalInfo.phone}</span></div>}
            {resume.personalInfo.location && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{resume.personalInfo.location}</span></div>}
          </div>
        </div>

        {/* Skills with progress bars */}
        {resume.skills && resume.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 opacity-80">Skills</h2>
            <div className="space-y-3">
              {resume.skills.slice(0, 8).map((skill) => (
                <div key={skill.id}>
                  <div className="text-sm mb-1">{skill.name}</div>
                  {customization.showProgressBars && (
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full"
                        style={{
                          width: skill.level === 'expert' ? '100%' : skill.level === 'advanced' ? '80%' : skill.level === 'intermediate' ? '60%' : '40%'
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {(resume.personalInfo.linkedin || resume.personalInfo.portfolio) && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 opacity-80">Links</h2>
            <div className="space-y-2 text-sm">
              {resume.personalInfo.linkedin && <div className="flex items-center gap-2"><Linkedin className="w-4 h-4" />LinkedIn</div>}
              {resume.personalInfo.portfolio && <div className="flex items-center gap-2"><Globe className="w-4 h-4" />Portfolio</div>}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-6">
          <h1 className="text-4xl font-bold mb-2" style={{ color: colors.primary }}>
            {resume.personalInfo.fullName}
          </h1>
          <div className="h-1 w-16 mb-4" style={{ backgroundColor: colors.accent }} />
        </header>

        {resume.summary && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2 uppercase" style={{ color: colors.primary }}>About Me</h2>
            <p className="text-gray-700">{resume.summary}</p>
          </section>
        )}

        {resume.experience && resume.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: colors.primary }}>Experience</h2>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <h3 className="font-bold">{exp.position}</h3>
                <p className="text-sm" style={{ color: colors.secondary }}>{exp.company} • {exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
              </div>
            ))}
          </section>
        )}

        {resume.education && resume.education.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: colors.primary }}>Education</h2>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <h3 className="font-bold">{edu.degree} in {edu.field}</h3>
                <p className="text-sm" style={{ color: colors.secondary }}>{edu.institution} • {edu.startDate} - {edu.endDate || 'Present'}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

// Executive Professional Template
const ExecutiveProfessionalTemplate: React.FC<{
  resume: Resume;
  customization: TemplateCustomization;
  colors: any;
}> = ({ resume, customization, colors }) => {
  return (
    <div className="flex max-w-[210mm] min-h-[297mm] mx-auto">
      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-serif mb-3" style={{ color: colors.text }}>
            {resume.personalInfo.fullName}
          </h1>
          <div className="flex justify-center items-center gap-3 text-sm text-gray-600">
            {resume.personalInfo.email && <span>{resume.personalInfo.email}</span>}
            <span>•</span>
            {resume.personalInfo.phone && <span>{resume.personalInfo.phone}</span>}
            <span>•</span>
            {resume.personalInfo.location && <span>{resume.personalInfo.location}</span>}
          </div>
        </header>

        {resume.summary && (
          <section className="mb-8">
            <div className="w-full h-px mb-3" style={{ backgroundColor: colors.primary }} />
            <p className="text-center text-gray-700 italic leading-relaxed">{resume.summary}</p>
            <div className="w-full h-px mt-3" style={{ backgroundColor: colors.primary }} />
          </section>
        )}

        {resume.experience && resume.experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-serif mb-4 text-center" style={{ color: colors.primary }}>
              Professional Experience
            </h2>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-6">
                <div className="text-center mb-2">
                  <h3 className="font-bold text-lg">{exp.position}</h3>
                  <p className="text-gray-600">{exp.company} | {exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                </div>
                <p className="text-gray-700 mb-2">{exp.description}</p>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {exp.highlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="w-1/3 p-6" style={{ backgroundColor: '#f8fafc' }}>
        {resume.education && resume.education.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
              Education
            </h2>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-4">
                <h3 className="font-semibold text-sm">{edu.degree}</h3>
                <p className="text-xs text-gray-600">{edu.field}</p>
                <p className="text-xs text-gray-600">{edu.institution}</p>
                <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate || 'Present'}</p>
              </div>
            ))}
          </section>
        )}

        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
              Core Competencies
            </h2>
            <div className="space-y-1 text-sm">
              {resume.skills.map((skill) => (
                <div key={skill.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
                  <span className="text-gray-700">{skill.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
};

// Tech Developer Template
const TechDeveloperTemplate: React.FC<{
  resume: Resume;
  customization: TemplateCustomization;
  colors: any;
}> = ({ resume, customization, colors }) => {
  return (
    <div className="flex max-w-[210mm] min-h-[297mm] mx-auto">
      {/* Left Sidebar */}
      <aside className="w-1/3 p-6" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Contact</h3>
          <div className="space-y-2 text-sm">
            {resume.personalInfo.email && <div className="break-all">{resume.personalInfo.email}</div>}
            {resume.personalInfo.phone && <div>{resume.personalInfo.phone}</div>}
            {resume.personalInfo.location && <div>{resume.personalInfo.location}</div>}
          </div>
        </div>

        {(resume.personalInfo.linkedin || resume.personalInfo.github || resume.personalInfo.portfolio) && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Links</h3>
            <div className="space-y-2 text-sm">
              {resume.personalInfo.linkedin && <div className="flex items-center gap-2"><Linkedin className="w-3 h-3" />LinkedIn</div>}
              {resume.personalInfo.github && <div className="flex items-center gap-2"><Github className="w-3 h-3" />GitHub</div>}
              {resume.personalInfo.portfolio && <div className="flex items-center gap-2"><Globe className="w-3 h-3" />Portfolio</div>}
            </div>
          </div>
        )}

        {resume.skills && resume.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Technical Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="px-2 py-0.5 text-xs rounded"
                  style={{ backgroundColor: colors.accent, color: colors.primary }}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {resume.education && resume.education.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Education</h3>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-3 text-sm">
                <div className="font-semibold">{edu.degree}</div>
                <div className="text-xs text-gray-600">{edu.field}</div>
                <div className="text-xs text-gray-600">{edu.institution}</div>
                <div className="text-xs text-gray-500">{edu.startDate} - {edu.endDate || 'Present'}</div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-6">
          <h1 className="text-4xl font-bold mb-1" style={{ color: colors.primary }}>
            {resume.personalInfo.fullName}
          </h1>
          <div className="h-1 w-24 mb-3" style={{ backgroundColor: colors.primary }} />
        </header>

        {resume.summary && (
          <section className="mb-6">
            <h2 className="text-base font-bold mb-2 uppercase tracking-wide" style={{ color: colors.secondary }}>
              About
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{resume.summary}</p>
          </section>
        )}

        {resume.experience && resume.experience.length > 0 && (
          <section>
            <h2 className="text-base font-bold mb-3 uppercase tracking-wide" style={{ color: colors.secondary }}>
              Experience
            </h2>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-5">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-base">{exp.position}</h3>
                    <p className="text-sm text-gray-600">{exp.company}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{exp.description}</p>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="space-y-1 text-sm text-gray-700">
                    {exp.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2" style={{ color: colors.primary }}>▸</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

// Simple Elegant Template
const SimpleElegantTemplate: React.FC<{
  resume: Resume;
  customization: TemplateCustomization;
  colors: any;
}> = ({ resume, customization, colors }) => {
  return (
    <div className="p-10 max-w-[210mm] min-h-[297mm] mx-auto">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-4xl font-bold mb-2">{resume.personalInfo.fullName}</h1>
        <div className="text-sm text-gray-600 space-y-1">
          <div>{resume.personalInfo.email} | {resume.personalInfo.phone}</div>
          {resume.personalInfo.location && <div>{resume.personalInfo.location}</div>}
          {(resume.personalInfo.linkedin || resume.personalInfo.portfolio) && (
            <div>
              {resume.personalInfo.linkedin && 'LinkedIn'}
              {resume.personalInfo.linkedin && resume.personalInfo.portfolio && ' | '}
              {resume.personalInfo.portfolio && 'Portfolio'}
            </div>
          )}
        </div>
      </header>

      {resume.summary && (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2 border-b pb-1" style={{ borderColor: colors.primary }}>
            Summary
          </h2>
          <p className="text-gray-700">{resume.summary}</p>
        </section>
      )}

      {resume.experience && resume.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2 border-b pb-1" style={{ borderColor: colors.primary }}>
            Experience
          </h2>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between mb-1">
                <div>
                  <h3 className="font-bold">{exp.position}</h3>
                  <p className="text-gray-600">{exp.company}</p>
                </div>
                <div className="text-sm text-gray-500 text-right">
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">{exp.description}</p>
              {exp.highlights && exp.highlights.length > 0 && (
                <ul className="list-disc list-inside space-y-0.5 text-sm text-gray-700">
                  {exp.highlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resume.education && resume.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2 border-b pb-1" style={{ borderColor: colors.primary }}>
            Education
          </h2>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold">{edu.degree} in {edu.field}</h3>
                  <p className="text-gray-600">{edu.institution}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {edu.startDate} - {edu.endDate || 'Present'}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {resume.skills && resume.skills.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-2 border-b pb-1" style={{ borderColor: colors.primary }}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
            {resume.skills.map((skill, idx) => (
              <span key={skill.id}>
                {skill.name}
                {idx < resume.skills.length - 1 && ' •'}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default TemplateRenderer;

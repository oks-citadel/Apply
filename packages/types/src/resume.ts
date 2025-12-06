export interface Resume {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: ResumeFileType;
  content: ResumeContent;
  atsScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum ResumeFileType {
  PDF = 'pdf',
  DOCX = 'docx',
  DOC = 'doc',
}

export interface ResumeContent {
  personalInfo: PersonalInfo;
  summary?: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkill[];
  certifications?: Certification[];
  projects?: Project[];
  languages?: Language[];
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface ResumeExperience {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  bullets: string[];
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  honors?: string[];
}

export interface ResumeSkill {
  name: string;
  category: SkillCategory;
  proficiency?: SkillProficiency;
}

export enum SkillCategory {
  TECHNICAL = 'technical',
  SOFT = 'soft',
  LANGUAGE = 'language',
  TOOL = 'tool',
}

export enum SkillProficiency {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
}

export interface Language {
  name: string;
  proficiency: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic';
}

export interface ATSAnalysis {
  score: number;
  keywordMatch: KeywordMatch[];
  suggestions: ATSSuggestion[];
  formatting: FormattingIssue[];
}

export interface KeywordMatch {
  keyword: string;
  found: boolean;
  importance: 'high' | 'medium' | 'low';
}

export interface ATSSuggestion {
  section: string;
  issue: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface FormattingIssue {
  type: string;
  description: string;
  location?: string;
}

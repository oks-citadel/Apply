export interface Resume {
  id: string;
  userId: string;
  name: string;
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  certifications?: Certification[];
  languages?: Language[];
  projects?: Project[];
  isDefault: boolean;
  template: string;
  createdAt: string;
  updatedAt: string;
  applications?: number;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  highlights: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'tool' | 'other';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'basic' | 'conversational' | 'professional' | 'native';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  github?: string;
  startDate: string;
  endDate?: string;
  highlights: string[];
}

export interface CreateResumeData {
  name: string;
  personalInfo: PersonalInfo;
  summary?: string;
  template?: string;
}

export interface UpdateResumeData extends Partial<CreateResumeData> {
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  certifications?: Certification[];
  languages?: Language[];
  projects?: Project[];
  isDefault?: boolean;
}

export interface ResumeExportFormat {
  format: 'pdf' | 'docx' | 'txt' | 'json';
}

export interface ResumeImportData {
  file: File;
  parseFormat?: 'auto' | 'linkedin' | 'indeed' | 'pdf';
}

export interface ResumeListResponse {
  resumes: Resume[];
  total: number;
  page: number;
  limit: number;
}

export interface ATSScore {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: {
    category: string;
    score: number;
    suggestions: string[];
  }[];
  missingKeywords: string[];
  matchedKeywords: string[];
}

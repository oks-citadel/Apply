// Type definitions for resume content
export interface PersonalInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  github?: string;
  portfolio?: string;
}

export interface Experience {
  id?: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
  achievements?: string[];
  highlights?: string[];
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  achievements?: string[];
  description?: string;
}

export interface Skill {
  id?: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'tool' | 'other';
  level?: string;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  refreshToken?: string;
  user?: User;
  expiresAt?: number;
}

// Resume Types
export interface Resume {
  id: string;
  name: string;
  userId: string;
  isDefault: boolean;
  personalInfo: PersonalInfo;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications?: Certification[];
  languages?: Language[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  summary?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  achievements?: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expirationDate?: string;
  credentialId?: string;
}

export interface Language {
  name: string;
  proficiency: 'Native' | 'Fluent' | 'Professional' | 'Limited';
}

// Job Types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  platform: JobPlatform;
  postedDate?: string;
  salary?: string;
  jobType?: string;
  remote?: boolean;
  extractedAt: string;
}

export type JobPlatform =
  | 'linkedin'
  | 'indeed'
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'icims'
  | 'taleo'
  | 'smartrecruiters'
  | 'jobvite'
  | 'breezy'
  | 'unknown';

// Application Types
export interface Application {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  status: ApplicationStatus;
  appliedAt: string;
  notes?: string;
  coverLetter?: string;
  customAnswers?: Record<string, string>;
  metadata?: ApplicationMetadata;
}

export type ApplicationStatus =
  | 'draft'
  | 'applying'
  | 'applied'
  | 'viewed'
  | 'screening'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'withdrawn'
  | 'accepted';

export interface ApplicationMetadata {
  platform: JobPlatform;
  applicationMethod: 'extension' | 'manual' | 'direct';
  timeSpent?: number;
  formFieldsFilled?: number;
  totalFormFields?: number;
}

// Message Types for Chrome Extension Communication
export enum MessageType {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CHECK_AUTH = 'CHECK_AUTH',
  REFRESH_TOKEN = 'REFRESH_TOKEN',

  // Resume
  GET_RESUMES = 'GET_RESUMES',
  SELECT_RESUME = 'SELECT_RESUME',
  GET_ACTIVE_RESUME = 'GET_ACTIVE_RESUME',

  // Job Detection
  DETECT_JOB = 'DETECT_JOB',
  SAVE_JOB = 'SAVE_JOB',
  GET_JOB_MATCH = 'GET_JOB_MATCH',

  // Application
  START_APPLICATION = 'START_APPLICATION',
  AUTOFILL_FORM = 'AUTOFILL_FORM',
  SUBMIT_APPLICATION = 'SUBMIT_APPLICATION',
  GET_APPLICATION_STATUS = 'GET_APPLICATION_STATUS',

  // Statistics
  GET_STATS = 'GET_STATS',
  GET_RECENT_APPLICATIONS = 'GET_RECENT_APPLICATIONS',

  // Settings
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',

  // Notifications
  SHOW_NOTIFICATION = 'SHOW_NOTIFICATION',
}

export interface Message<T = any> {
  type: MessageType;
  payload?: T;
  requestId?: string;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

// Settings Types
export interface ExtensionSettings {
  autoDetectJobs: boolean;
  autoFillForms: boolean;
  showNotifications: boolean;
  saveJobsAutomatically: boolean;
  defaultResumeId?: string;
  autofillPreferences: AutofillPreferences;
}

export interface AutofillPreferences {
  fillPersonalInfo: boolean;
  fillWorkExperience: boolean;
  fillEducation: boolean;
  fillSkills: boolean;
  highlightFields: boolean;
  confirmBeforeSubmit: boolean;
}

// Statistics Types
export interface UserStats {
  totalApplications: number;
  applicationsThisWeek: number;
  applicationsThisMonth: number;
  interviewRate: number;
  responseRate: number;
  averageResponseTime?: number;
  statusBreakdown: Record<ApplicationStatus, number>;
}

// Job Match Types
export interface JobMatch {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: boolean;
  educationMatch: boolean;
  locationMatch: boolean;
  insights: string[];
}

// Content Script Types
export interface DetectedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  platform: JobPlatform;
  url: string;
  applyButton?: HTMLElement;
  formFields?: FormField[];
}

export interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  required: boolean;
  value?: string;
  options?: string[];
  element: HTMLElement;
}

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_STATE: 'auth_state',
  ACTIVE_RESUME: 'active_resume',
  SETTINGS: 'settings',
  CACHED_RESUMES: 'cached_resumes',
  RECENT_JOBS: 'recent_jobs',
  STATS: 'stats',
} as const;

// API Endpoints
// Storage Configuration (re-export from constants)
export { STORAGE_CONFIG } from './constants';

// API Endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  RESUMES: {
    LIST: '/resumes',
    GET: (id: string) => `/resumes/${id}`,
    CREATE: '/resumes',
    UPDATE: (id: string) => `/resumes/${id}`,
    DELETE: (id: string) => `/resumes/${id}`,
  },
  JOBS: {
    LIST: '/jobs',
    GET: (id: string) => `/jobs/${id}`,
    SAVE: '/jobs',
    MATCH: (jobId: string) => `/jobs/${jobId}/match`,
  },
  APPLICATIONS: {
    LIST: '/applications',
    GET: (id: string) => `/applications/${id}`,
    CREATE: '/applications',
    UPDATE: (id: string) => `/applications/${id}`,
    STATS: '/applications/stats',
  },
} as const;

// Error Types
export class ExtensionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ExtensionError';
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

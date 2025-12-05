/**
 * Core types for ATS form autofill system
 */

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  address?: Address;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
}

export interface Address {
  street?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  full?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
  honors?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  url?: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  languages?: Language[];
  resumeUrl?: string;
  resumeFile?: File;
}

export interface Language {
  name: string;
  proficiency: 'native' | 'fluent' | 'professional' | 'intermediate' | 'basic';
}

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'url'
  | 'select'
  | 'textarea'
  | 'file'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'number';

export interface FormField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  type: FieldType;
  label: string;
  name: string;
  id: string;
  placeholder?: string;
  required: boolean;
  value?: string;
  options?: string[]; // For select/radio fields
  confidence?: number; // Matching confidence (0-1)
}

export interface FieldMapping {
  fieldType: string;
  selectors: string[];
  getValue: (resume: ResumeData, context?: any) => string | undefined;
  format?: (value: string) => string;
  validate?: (value: string) => boolean;
}

export interface CustomQuestion {
  element: HTMLElement;
  question: string;
  type: 'text' | 'select' | 'radio' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
  answer?: string;
  confidence?: number;
}

export interface AutofillResult {
  success: boolean;
  filledFields: number;
  totalFields: number;
  errors: AutofillError[];
  warnings: string[];
  customQuestions: CustomQuestion[];
  missingRequired: FormField[];
}

export interface AutofillError {
  field: string;
  message: string;
  type: 'validation' | 'missing_data' | 'element_not_found' | 'interaction_failed';
  severity: 'error' | 'warning';
}

export interface AutofillConfig {
  fillDelay?: number; // Delay between filling fields (ms)
  waitForElements?: boolean; // Wait for dynamic elements
  maxWaitTime?: number; // Maximum wait time (ms)
  skipCustomQuestions?: boolean;
  autoSubmit?: boolean;
  highlightFields?: boolean;
  showProgress?: boolean;
  handleFileUploads?: boolean;
}

export interface AutofillProgress {
  status: 'idle' | 'detecting' | 'filling' | 'uploading' | 'validating' | 'submitting' | 'completed' | 'error';
  currentStep: string;
  progress: number; // 0-100
  currentField?: string;
  message?: string;
}

export interface PlatformDetectionResult {
  platform: ATSPlatform;
  confidence: number;
  url: string;
  indicators: string[];
}

export type ATSPlatform =
  | 'workday'
  | 'greenhouse'
  | 'lever'
  | 'icims'
  | 'taleo'
  | 'smartrecruiters'
  | 'linkedin'
  | 'indeed'
  | 'jobvite'
  | 'bamboohr'
  | 'ashby'
  | 'generic';

export interface AdapterMetadata {
  name: string;
  platform: ATSPlatform;
  version: string;
  features: AdapterFeatures;
}

export interface AdapterFeatures {
  multiPage: boolean;
  dynamicForms: boolean;
  fileUpload: boolean;
  customQuestions: boolean;
  profileImport: boolean;
  autoSave: boolean;
}

export interface FormSubmissionResult {
  success: boolean;
  confirmationNumber?: string;
  confirmationUrl?: string;
  screenshot?: string;
  timestamp: Date;
  errors?: string[];
}

export interface FieldValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WaitForElementOptions {
  timeout?: number;
  interval?: number;
  visible?: boolean;
}

export interface SemanticMatchResult {
  field: FormField;
  dataPath: string;
  confidence: number;
  reasoning: string;
}

export interface FieldPattern {
  keywords: string[];
  patterns: RegExp[];
  dataPath: string;
  priority: number;
}

export interface CommonQuestionPattern {
  pattern: RegExp;
  category: 'personal' | 'employment' | 'legal' | 'preferences' | 'qualifications';
  answerStrategy: (resume: ResumeData, question: string) => string;
}

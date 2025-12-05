export interface Application {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: {
      min: number;
      max: number;
      currency: string;
    };
  };
  resume: {
    id: string;
    name: string;
  };
  status: ApplicationStatus;
  appliedAt: string;
  coverLetter?: string;
  notes?: string;
  timeline: ApplicationTimeline[];
  source: 'manual' | 'auto-apply' | 'recommended';
  response?: ApplicationResponse;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'draft'
  | 'applied'
  | 'screening'
  | 'assessment'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationTimeline {
  id: string;
  status: ApplicationStatus;
  timestamp: string;
  note?: string;
}

export interface ApplicationResponse {
  type: 'rejection' | 'interview' | 'offer';
  message?: string;
  interviewDate?: string;
  interviewType?: 'phone' | 'video' | 'onsite' | 'technical';
  offerDetails?: {
    salary: number;
    benefits?: string[];
    startDate?: string;
    deadline?: string;
  };
  receivedAt: string;
}

export interface ApplicationFilters {
  status?: ApplicationStatus[];
  search?: string;
  jobTitle?: string;
  company?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: ('manual' | 'auto-apply' | 'recommended')[];
  page?: number;
  limit?: number;
  sortBy?: 'appliedAt' | 'updatedAt' | 'company' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ApplicationListResponse {
  applications: Application[];
  total: number;
  page: number;
  limit: number;
}

export interface ApplicationAnalytics {
  overview: {
    totalApplications: number;
    activeApplications: number;
    interviews: number;
    offers: number;
    responseRate: number;
    averageResponseTime: number; // in days
  };
  statusBreakdown: {
    status: ApplicationStatus;
    count: number;
    percentage: number;
  }[];
  timelineData: {
    date: string;
    applied: number;
    interviews: number;
    offers: number;
    rejections: number;
  }[];
  topCompanies: {
    company: string;
    applications: number;
    interviews: number;
    offers: number;
  }[];
  sourceBreakdown: {
    source: 'manual' | 'auto-apply' | 'recommended';
    count: number;
    percentage: number;
    successRate: number;
  }[];
}

export interface CreateApplicationData {
  jobId: string;
  resumeId: string;
  coverLetter?: string;
  notes?: string;
  source?: 'manual' | 'auto-apply' | 'recommended';
}

export interface UpdateApplicationData {
  status?: ApplicationStatus;
  notes?: string;
  coverLetter?: string;
  response?: ApplicationResponse;
}

export interface AutoApplySettings {
  enabled: boolean;
  filters: {
    jobTitle?: string[];
    location?: string[];
    experienceLevel?: string[];
    employmentType?: string[];
    salaryMin?: number;
    keywords?: string[];
    excludeKeywords?: string[];
  };
  resumeId: string;
  coverLetterTemplate?: string;
  maxApplicationsPerDay?: number;
  autoResponse?: boolean;
}

export interface AutoApplyStatus {
  isRunning: boolean;
  applicationsToday: number;
  totalApplications: number;
  successRate: number;
  lastRunAt?: string;
  nextRunAt?: string;
}

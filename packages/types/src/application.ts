export interface Application {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  status: ApplicationStatus;
  appliedAt: Date;
  lastUpdatedAt: Date;
  source: ApplicationSource;
  coverLetter?: string;
  notes?: string;
  followUpDate?: Date;
  timeline: ApplicationTimelineEvent[];
}

export enum ApplicationStatus {
  PENDING = 'pending',
  APPLIED = 'applied',
  VIEWED = 'viewed',
  PHONE_SCREEN = 'phone_screen',
  INTERVIEW = 'interview',
  TECHNICAL = 'technical',
  ONSITE = 'onsite',
  OFFER = 'offer',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum ApplicationSource {
  MANUAL = 'manual',
  AUTO_APPLY = 'auto_apply',
  QUICK_APPLY = 'quick_apply',
}

export interface ApplicationTimelineEvent {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  note?: string;
  createdAt: Date;
}

export interface ApplicationWithDetails extends Application {
  job: {
    id: string;
    title: string;
    company: string;
    companyLogo?: string;
    location: string;
  };
  resume: {
    id: string;
    title: string;
  };
}

export interface AutoApplySettings {
  userId: string;
  enabled: boolean;
  dailyLimit: number;
  filters: AutoApplyFilters;
  blacklistedCompanies: string[];
  preferredCompanies: string[];
  minMatchScore: number;
}

export interface AutoApplyFilters {
  keywords: string[];
  locations: string[];
  locationType?: string[];
  employmentType?: string[];
  experienceLevel?: string[];
  salaryMin?: number;
  salaryMax?: number;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  thisWeek: number;
  thisMonth: number;
  responseRate: number;
  interviewRate: number;
  averageTimeToResponse: number; // days
}

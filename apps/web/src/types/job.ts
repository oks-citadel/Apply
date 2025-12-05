export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  salary?: SalaryRange;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits?: string[];
  skills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  industry: string;
  companySize?: string;
  companyLogo?: string;
  companyWebsite?: string;
  applyUrl?: string;
  source: string;
  postedAt: string;
  expiresAt?: string;
  isSaved?: boolean;
  matchScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'hourly' | 'monthly' | 'yearly';
}

export interface JobSearchFilters {
  query?: string;
  location?: string;
  locationType?: ('remote' | 'hybrid' | 'onsite')[];
  experienceLevel?: ('entry' | 'mid' | 'senior' | 'lead' | 'executive')[];
  employmentType?: ('full-time' | 'part-time' | 'contract' | 'internship' | 'temporary')[];
  salaryMin?: number;
  salaryMax?: number;
  industry?: string[];
  skills?: string[];
  postedWithin?: number; // days
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'salary' | 'match';
  sortOrder?: 'asc' | 'desc';
}

export interface JobSearchResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SavedJob {
  id: string;
  jobId: string;
  userId: string;
  job: Job;
  notes?: string;
  tags?: string[];
  savedAt: string;
}

export interface JobMatchScore {
  jobId: string;
  resumeId: string;
  overallScore: number;
  breakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    locationMatch: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

export interface RecommendedJobsResponse {
  jobs: Job[];
  reasons: Record<string, string[]>;
}

export interface InterviewQuestions {
  technical: string[];
  behavioral: string[];
  companySpecific: string[];
}

export interface SalaryPrediction {
  predictedSalary: SalaryRange;
  confidence: number;
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
  marketData: {
    averageSalary: number;
    percentile25: number;
    percentile50: number;
    percentile75: number;
    percentile90: number;
  };
}

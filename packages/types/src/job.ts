export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  locationType: LocationType;
  employmentType: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: SalaryPeriod;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits?: string[];
  skills: string[];
  experienceLevel: ExperienceLevel;
  department?: string;
  postedAt: Date;
  expiresAt?: Date;
  sourceUrl: string;
  source: JobSource;
  isActive: boolean;
}

export enum LocationType {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance',
}

export enum SalaryPeriod {
  HOURLY = 'hourly',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  EXECUTIVE = 'executive',
}

export enum JobSource {
  LINKEDIN = 'linkedin',
  INDEED = 'indeed',
  GLASSDOOR = 'glassdoor',
  COMPANY_WEBSITE = 'company_website',
  REFERRAL = 'referral',
  OTHER = 'other',
}

export interface JobMatch {
  jobId: string;
  userId: string;
  matchScore: number;
  skillsMatch: SkillsMatchResult;
  experienceMatch: number;
  locationMatch: boolean;
  salaryMatch: boolean;
  analysis: JobMatchAnalysis;
  createdAt: Date;
}

export interface SkillsMatchResult {
  matchedSkills: string[];
  missingSkills: string[];
  additionalSkills: string[];
  matchPercentage: number;
}

export interface JobMatchAnalysis {
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export interface JobSearchFilters {
  keywords?: string;
  location?: string;
  locationType?: LocationType[];
  employmentType?: EmploymentType[];
  experienceLevel?: ExperienceLevel[];
  salaryMin?: number;
  salaryMax?: number;
  company?: string;
  skills?: string[];
  postedWithin?: number; // days
  source?: JobSource[];
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  job: Job;
  notes?: string;
  tags?: string[];
  savedAt: Date;
}

// User types
export interface User {
  id: string;
  email: string;
  companyName: string;
  role: string;
  avatar?: string;
}

// Job types
export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  experienceLevel: 'Entry-level' | 'Mid-level' | 'Senior' | 'Lead' | 'Executive';
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  applications: number;
  views: number;
  status: 'active' | 'draft' | 'closed';
  postedDate: string;
  createdAt: string;
  updatedAt: string;
}

// Application types
export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  experience: string;
  education: string;
  appliedDate: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  resumeUrl: string;
  coverLetter?: string;
  createdAt: string;
  updatedAt: string;
}

// Candidate types
export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  workExperience: Array<{
    title: string;
    company: string;
    period: string;
    description: string;
  }>;
  summary: string;
  availableDate: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

// Company types
export interface Company {
  id: string;
  companyName: string;
  industry: string;
  companySize: string;
  website?: string;
  description?: string;
  headquarters?: string;
  foundedYear?: string;
  contactEmail: string;
  contactPhone?: string;
  benefits?: string;
  culture?: string;
  logo?: string;
}

// Analytics types
export interface Analytics {
  totalApplications: number;
  activeJobs: number;
  profileViews: number;
  avgTimeToHire: number;
  applicationTrend: Array<{
    date: string;
    applications: number;
    views: number;
  }>;
  jobPerformance: Array<{
    job: string;
    applications: number;
  }>;
  applicationStatus: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

// Subscription types
export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  downloadUrl?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

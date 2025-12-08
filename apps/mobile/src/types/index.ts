export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: string;
  expiresAt?: string;
  isActive: boolean;
  applicationCount: number;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'reviewing' | 'interview' | 'approved' | 'rejected' | 'withdrawn';
  job: Job;
  resume?: {
    id: string;
    fileName: string;
    fileUrl: string;
  };
  coverLetter?: string;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  interviewScheduled: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export type ApplicationStatus = Application['status'];
export type LocationType = Job['locationType'];
export type EmploymentType = Job['employmentType'];

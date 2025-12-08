export interface JobAlert {
  id: string;
  userId: string;
  name: string;
  keywords?: string[];
  jobTitle?: string;
  location?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: ('full-time' | 'part-time' | 'contract' | 'internship' | 'temporary')[];
  experienceLevel?: ('entry' | 'mid' | 'senior' | 'lead' | 'executive')[];
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobAlertInput {
  name: string;
  keywords?: string[];
  jobTitle?: string;
  location?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: ('full-time' | 'part-time' | 'contract' | 'internship' | 'temporary')[];
  experienceLevel?: ('entry' | 'mid' | 'senior' | 'lead' | 'executive')[];
  notificationFrequency?: 'instant' | 'daily' | 'weekly';
  isActive?: boolean;
}

export interface UpdateJobAlertInput extends Partial<CreateJobAlertInput> {}

export interface JobAlertListResponse {
  alerts: JobAlert[];
  total: number;
}

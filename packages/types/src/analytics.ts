export interface AnalyticsOverview {
  totalApplications: number;
  responseRate: number;
  interviewRate: number;
  offerCount: number;
  applicationsTrend: number;
  responseTrend: number;
  interviewTrend: number;
  offerTrend: number;
}

export interface ApplicationTrendData {
  date: string;
  applications: number;
  interviews: number;
  offers: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface ActivityHeatmapData {
  day: string;
  hour: number;
  value: number;
}

export interface TopCompanyStats {
  company: string;
  applications: number;
  responseRate: number;
  averageMatchScore: number;
}

export interface SkillDemandData {
  skill: string;
  demandCount: number;
  trend: 'up' | 'down' | 'stable';
  growthPercentage: number;
}

export interface SalaryInsight {
  role: string;
  location: string;
  averageSalary: number;
  minSalary: number;
  maxSalary: number;
  sampleSize: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  applicationsSubmitted: number;
  responsesReceived: number;
  interviewsScheduled: number;
  offersReceived: number;
  topMatchedJobs: {
    jobId: string;
    title: string;
    company: string;
    matchScore: number;
  }[];
  suggestedActions: string[];
}

export interface AnalyticsFilters {
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  companies?: string[];
  jobTypes?: string[];
  locations?: string[];
}

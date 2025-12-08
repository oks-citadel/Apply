import { apiClient, handleApiError } from './client';

// Analytics API Types
export interface DashboardSummary {
  totalApplications: number;
  responseRate: number;
  interviewRate: number;
  offerCount: number;
  applicationsTrend?: number;
  responseTrend?: number;
  interviewTrend?: number;
  offerTrend?: number;
  avgResponseTime?: number;
}

export interface ApplicationAnalytics {
  timeline: TimelineData[];
  statusBreakdown: StatusData[];
  conversionRates: ConversionRates;
}

export interface TimelineData {
  date: string;
  applications: number;
  interviews: number;
  offers: number;
  responses: number;
}

export interface StatusData {
  status: string;
  count: number;
  percentage: number;
}

export interface ConversionRates {
  applicationToResponse: number;
  responseToInterview: number;
  interviewToOffer: number;
}

export interface JobAnalytics {
  topCompanies: CompanyData[];
  categoryDistribution: CategoryData[];
  locationDistribution: LocationData[];
  salaryRanges: SalaryRangeData[];
}

export interface CompanyData {
  company: string;
  applications: number;
  responses: number;
  interviews: number;
  offers: number;
  responseRate: number;
}

export interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

export interface LocationData {
  location: string;
  count: number;
  percentage: number;
}

export interface SalaryRangeData {
  range: string;
  count: number;
  avgSalary: number;
}

export interface ActivityMetrics {
  weeklyActivity: ActivityData[];
  peakHours: PeakHourData[];
  productivityScore: number;
}

export interface ActivityData {
  day: string;
  hour: number;
  value: number;
}

export interface PeakHourData {
  hour: number;
  count: number;
}

export interface ResponseTrend {
  period: string;
  responseRate: number;
  avgResponseTime: number;
  totalResponses: number;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  status?: string[];
  companies?: string[];
  categories?: string[];
}

// Analytics API Service
export const analyticsApi = {
  // Get dashboard summary with key metrics
  getDashboardSummary: async (filters?: AnalyticsFilters): Promise<DashboardSummary> => {
    try {
      const response = await apiClient.get('/analytics/dashboard', { params: filters });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get application analytics (timeline and breakdown)
  getApplicationAnalytics: async (filters?: AnalyticsFilters): Promise<ApplicationAnalytics> => {
    try {
      const response = await apiClient.get('/analytics/applications', { params: filters });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get job search analytics (companies, categories, locations)
  getJobAnalytics: async (filters?: AnalyticsFilters): Promise<JobAnalytics> => {
    try {
      const response = await apiClient.get('/analytics/jobs', { params: filters });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get user activity metrics (heatmap data)
  getActivityMetrics: async (filters?: AnalyticsFilters): Promise<ActivityMetrics> => {
    try {
      const response = await apiClient.get('/analytics/activity', { params: filters });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get response rate trends over time
  getResponseTrends: async (filters?: AnalyticsFilters): Promise<ResponseTrend[]> => {
    try {
      const response = await apiClient.get('/analytics/response-trends', { params: filters });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Export analytics data
  exportData: async (
    format: 'csv' | 'pdf',
    filters?: AnalyticsFilters
  ): Promise<Blob> => {
    try {
      const response = await apiClient.get(`/analytics/export/${format}`, {
        params: filters,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

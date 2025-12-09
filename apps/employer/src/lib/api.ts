import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/employer/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post('/auth/employer/register', data);
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Job endpoints
  async getJobs(params?: any) {
    const response = await this.client.get('/employer/jobs', { params });
    return response.data;
  }

  async getJob(id: string) {
    const response = await this.client.get(`/employer/jobs/${id}`);
    return response.data;
  }

  async createJob(data: any) {
    const response = await this.client.post('/employer/jobs', data);
    return response.data;
  }

  async updateJob(id: string, data: any) {
    const response = await this.client.put(`/employer/jobs/${id}`, data);
    return response.data;
  }

  async deleteJob(id: string) {
    const response = await this.client.delete(`/employer/jobs/${id}`);
    return response.data;
  }

  // Application endpoints
  async getApplications(jobId: string, params?: any) {
    const response = await this.client.get(
      `/employer/jobs/${jobId}/applications`,
      { params }
    );
    return response.data;
  }

  async getApplication(jobId: string, applicationId: string) {
    const response = await this.client.get(
      `/employer/jobs/${jobId}/applications/${applicationId}`
    );
    return response.data;
  }

  async updateApplicationStatus(
    jobId: string,
    applicationId: string,
    status: string
  ) {
    const response = await this.client.patch(
      `/employer/jobs/${jobId}/applications/${applicationId}/status`,
      { status }
    );
    return response.data;
  }

  async bulkUpdateApplicationStatus(
    jobId: string,
    applicationIds: string[],
    status: string
  ) {
    const response = await this.client.patch(
      `/employer/jobs/${jobId}/applications/bulk-status`,
      { applicationIds, status }
    );
    return response.data;
  }

  // Candidate endpoints
  async searchCandidates(params?: any) {
    const response = await this.client.get('/employer/candidates', { params });
    return response.data;
  }

  async getCandidate(id: string) {
    const response = await this.client.get(`/employer/candidates/${id}`);
    return response.data;
  }

  // Company endpoints
  async getCompanyProfile() {
    const response = await this.client.get('/employer/company');
    return response.data;
  }

  async updateCompanyProfile(data: any) {
    const response = await this.client.put('/employer/company', data);
    return response.data;
  }

  async uploadCompanyLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await this.client.post('/employer/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Analytics endpoints
  async getAnalytics(params?: any) {
    const response = await this.client.get('/employer/analytics', { params });
    return response.data;
  }

  async getJobAnalytics(jobId: string, params?: any) {
    const response = await this.client.get(
      `/employer/jobs/${jobId}/analytics`,
      { params }
    );
    return response.data;
  }

  // Billing endpoints
  async getSubscription() {
    const response = await this.client.get('/employer/subscription');
    return response.data;
  }

  async updateSubscription(planId: string) {
    const response = await this.client.post('/employer/subscription', {
      planId,
    });
    return response.data;
  }

  async getInvoices() {
    const response = await this.client.get('/employer/invoices');
    return response.data;
  }

  async getInvoice(id: string) {
    const response = await this.client.get(`/employer/invoices/${id}`);
    return response.data;
  }

  async updatePaymentMethod(data: any) {
    const response = await this.client.put('/employer/payment-method', data);
    return response.data;
  }
}

export const apiClient = new APIClient();
export default apiClient;

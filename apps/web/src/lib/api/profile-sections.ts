import { apiClient, handleApiError } from './client';

export const profileSectionsApi = {
  // Work Experience APIs
  getWorkExperiences: async () => {
    try {
      const response = await apiClient.get('/profile/work-experience');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createWorkExperience: async (data: any) => {
    try {
      const response = await apiClient.post('/profile/work-experience', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateWorkExperience: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/profile/work-experience/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteWorkExperience: async (id: string) => {
    try {
      const response = await apiClient.delete(`/profile/work-experience/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Education APIs
  getEducation: async () => {
    try {
      const response = await apiClient.get('/profile/education');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createEducation: async (data: any) => {
    try {
      const response = await apiClient.post('/profile/education', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateEducation: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/profile/education/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteEducation: async (id: string) => {
    try {
      const response = await apiClient.delete(`/profile/education/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Skills APIs
  getSkills: async () => {
    try {
      const response = await apiClient.get('/profile/skills');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createSkill: async (data: any) => {
    try {
      const response = await apiClient.post('/profile/skills', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateSkill: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/profile/skills/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteSkill: async (id: string) => {
    try {
      const response = await apiClient.delete(`/profile/skills/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Certifications APIs
  getCertifications: async () => {
    try {
      const response = await apiClient.get('/profile/certifications');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createCertification: async (data: any) => {
    try {
      const response = await apiClient.post('/profile/certifications', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateCertification: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/profile/certifications/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteCertification: async (id: string) => {
    try {
      const response = await apiClient.delete(`/profile/certifications/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

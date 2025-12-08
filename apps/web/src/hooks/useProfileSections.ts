import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileSectionsApi } from '@/lib/api/profile-sections';
import { useToast } from './useToast';

// Query keys
export const profileSectionsKeys = {
  all: ['profile-sections'] as const,
  workExperiences: () => [...profileSectionsKeys.all, 'work-experiences'] as const,
  education: () => [...profileSectionsKeys.all, 'education'] as const,
  skills: () => [...profileSectionsKeys.all, 'skills'] as const,
  certifications: () => [...profileSectionsKeys.all, 'certifications'] as const,
};

// Work Experience Hooks
export function useWorkExperiences() {
  return useQuery({
    queryKey: profileSectionsKeys.workExperiences(),
    queryFn: () => profileSectionsApi.getWorkExperiences(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateWorkExperience() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => profileSectionsApi.createWorkExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.workExperiences() });
      toast({
        title: 'Work experience added',
        description: 'Your work experience has been added successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add work experience',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

export function useUpdateWorkExperience() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      profileSectionsApi.updateWorkExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.workExperiences() });
      toast({
        title: 'Work experience updated',
        description: 'Your work experience has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update work experience',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

export function useDeleteWorkExperience() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => profileSectionsApi.deleteWorkExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.workExperiences() });
      toast({
        title: 'Work experience deleted',
        description: 'Your work experience has been deleted successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete work experience',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

// Education Hooks
export function useEducation() {
  return useQuery({
    queryKey: profileSectionsKeys.education(),
    queryFn: () => profileSectionsApi.getEducation(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEducation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => profileSectionsApi.createEducation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.education() });
      toast({
        title: 'Education added',
        description: 'Your education has been added successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add education',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      profileSectionsApi.updateEducation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.education() });
      toast({
        title: 'Education updated',
        description: 'Your education has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update education',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

export function useDeleteEducation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => profileSectionsApi.deleteEducation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.education() });
      toast({
        title: 'Education deleted',
        description: 'Your education has been deleted successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete education',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

// Skills Hooks
export function useSkills() {
  return useQuery({
    queryKey: profileSectionsKeys.skills(),
    queryFn: () => profileSectionsApi.getSkills(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => profileSectionsApi.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.skills() });
      toast({
        title: 'Skill added',
        description: 'Your skill has been added successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add skill',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      profileSectionsApi.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.skills() });
      toast({
        title: 'Skill updated',
        description: 'Your skill has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update skill',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => profileSectionsApi.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.skills() });
      toast({
        title: 'Skill deleted',
        description: 'Your skill has been deleted successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete skill',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

// Certifications Hooks
export function useCertifications() {
  return useQuery({
    queryKey: profileSectionsKeys.certifications(),
    queryFn: () => profileSectionsApi.getCertifications(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => profileSectionsApi.createCertification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.certifications() });
      toast({
        title: 'Certification added',
        description: 'Your certification has been added successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add certification',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

export function useUpdateCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      profileSectionsApi.updateCertification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.certifications() });
      toast({
        title: 'Certification updated',
        description: 'Your certification has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update certification',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

export function useDeleteCertification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => profileSectionsApi.deleteCertification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileSectionsKeys.certifications() });
      toast({
        title: 'Certification deleted',
        description: 'Your certification has been deleted successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete certification',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

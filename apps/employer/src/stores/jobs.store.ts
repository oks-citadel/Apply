import { create } from 'zustand';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: 'active' | 'draft' | 'closed';
  applications: number;
  views: number;
  postedDate: string;
}

interface JobsState {
  jobs: Job[];
  selectedJob: Job | null;
  isLoading: boolean;
  error: string | null;
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, job: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  setSelectedJob: (job: Job | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useJobsStore = create<JobsState>((set) => ({
  jobs: [],
  selectedJob: null,
  isLoading: false,
  error: null,

  setJobs: (jobs) => set({ jobs }),

  addJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs],
    })),

  updateJob: (id, jobData) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, ...jobData } : job
      ),
      selectedJob:
        state.selectedJob?.id === id
          ? { ...state.selectedJob, ...jobData }
          : state.selectedJob,
    })),

  deleteJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
      selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
    })),

  setSelectedJob: (job) => set({ selectedJob: job }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));

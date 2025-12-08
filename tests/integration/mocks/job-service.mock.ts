/**
 * Mock Job Service
 * Provides mock responses for job service endpoints
 */

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  skills: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  experienceLevel: string;
  remote: boolean;
  postedAt: Date;
  status: 'active' | 'closed' | 'draft';
}

export class JobServiceMock {
  private jobs: Map<string, Job> = new Map();

  constructor() {
    this.setupDefaultMocks();
  }

  private setupDefaultMocks(): void {
    // Add default test jobs
    const testJob: Job = {
      id: 'job-test-1',
      title: 'Senior Software Engineer',
      company: 'Test Tech Corp',
      location: 'San Francisco, CA',
      type: 'full-time',
      description: 'We are looking for an experienced software engineer.',
      requirements: ['5+ years of experience', 'Strong TypeScript skills'],
      skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL'],
      salary: {
        min: 120000,
        max: 180000,
        currency: 'USD',
      },
      experienceLevel: 'senior',
      remote: true,
      postedAt: new Date(),
      status: 'active',
    };

    this.jobs.set(testJob.id, testJob);
  }

  mockCreateJob(jobData: Partial<Job>): Job {
    const job: Job = {
      id: `job-${Date.now()}`,
      title: jobData.title || 'Test Job',
      company: jobData.company || 'Test Company',
      location: jobData.location || 'Test Location',
      type: jobData.type || 'full-time',
      description: jobData.description || 'Test description',
      requirements: jobData.requirements || [],
      skills: jobData.skills || [],
      salary: jobData.salary,
      experienceLevel: jobData.experienceLevel || 'mid',
      remote: jobData.remote ?? true,
      postedAt: new Date(),
      status: 'active',
    };

    this.jobs.set(job.id, job);
    return job;
  }

  mockGetJob(jobId: string): Job | null {
    return this.jobs.get(jobId) || null;
  }

  mockSearchJobs(query: {
    keywords?: string;
    location?: string;
    type?: string;
    remote?: boolean;
    skills?: string[];
    experienceLevel?: string;
    limit?: number;
  }): Job[] {
    let results = Array.from(this.jobs.values());

    if (query.keywords) {
      const keywords = query.keywords.toLowerCase();
      results = results.filter(job =>
        job.title.toLowerCase().includes(keywords) ||
        job.description.toLowerCase().includes(keywords) ||
        job.company.toLowerCase().includes(keywords)
      );
    }

    if (query.location) {
      results = results.filter(job =>
        job.location.toLowerCase().includes(query.location!.toLowerCase())
      );
    }

    if (query.type) {
      results = results.filter(job => job.type === query.type);
    }

    if (query.remote !== undefined) {
      results = results.filter(job => job.remote === query.remote);
    }

    if (query.skills && query.skills.length > 0) {
      results = results.filter(job =>
        query.skills!.some(skill =>
          job.skills.some(jobSkill =>
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    if (query.experienceLevel) {
      results = results.filter(job => job.experienceLevel === query.experienceLevel);
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  mockUpdateJob(jobId: string, updates: Partial<Job>): Job | null {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    const updatedJob = { ...job, ...updates };
    this.jobs.set(jobId, updatedJob);
    return updatedJob;
  }

  mockDeleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  mockGetJobsByCompany(company: string): Job[] {
    return Array.from(this.jobs.values())
      .filter(job => job.company.toLowerCase() === company.toLowerCase());
  }

  mockGetRecommendedJobs(userProfile: {
    skills: string[];
    experienceLevel: string;
    preferredLocation?: string;
    preferredRemote?: boolean;
  }): Job[] {
    let jobs = Array.from(this.jobs.values()).filter(job => job.status === 'active');

    // Score jobs based on user profile
    const scoredJobs = jobs.map(job => {
      let score = 0;

      // Match skills
      const matchingSkills = job.skills.filter(skill =>
        userProfile.skills.some(userSkill =>
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      score += matchingSkills.length * 10;

      // Match experience level
      if (job.experienceLevel === userProfile.experienceLevel) {
        score += 20;
      }

      // Match location preference
      if (userProfile.preferredLocation &&
          job.location.toLowerCase().includes(userProfile.preferredLocation.toLowerCase())) {
        score += 15;
      }

      // Match remote preference
      if (userProfile.preferredRemote !== undefined &&
          job.remote === userProfile.preferredRemote) {
        score += 10;
      }

      return { job, score };
    });

    // Sort by score and return top matches
    return scoredJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.job);
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  clear(): void {
    this.jobs.clear();
    this.setupDefaultMocks();
  }
}

export const jobServiceMock = new JobServiceMock();

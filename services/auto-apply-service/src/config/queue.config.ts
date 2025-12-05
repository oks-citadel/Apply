import { JobOptions } from 'bull';

export const queueConfig = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  } as JobOptions,

  limiter: {
    max: 10, // Maximum jobs per duration
    duration: 60000, // Duration in milliseconds (1 minute)
  },
};

export const applicationQueueConfig = {
  name: 'application-queue',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000, // Start with 10 second delay
    },
    removeOnComplete: 100,
    removeOnFail: false, // Keep failed jobs for debugging
  } as JobOptions,
};

// Rate limiting per platform to avoid detection
export const platformRateLimits = {
  workday: {
    applicationsPerHour: 20,
    delayBetweenApplications: 180000, // 3 minutes
  },
  greenhouse: {
    applicationsPerHour: 30,
    delayBetweenApplications: 120000, // 2 minutes
  },
  lever: {
    applicationsPerHour: 30,
    delayBetweenApplications: 120000, // 2 minutes
  },
  icims: {
    applicationsPerHour: 25,
    delayBetweenApplications: 144000, // 2.4 minutes
  },
  taleo: {
    applicationsPerHour: 15,
    delayBetweenApplications: 240000, // 4 minutes
  },
  smartrecruiters: {
    applicationsPerHour: 30,
    delayBetweenApplications: 120000, // 2 minutes
  },
  default: {
    applicationsPerHour: 20,
    delayBetweenApplications: 180000, // 3 minutes
  },
};

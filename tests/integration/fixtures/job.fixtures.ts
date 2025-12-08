/**
 * Job test fixtures
 * Provides test data for job-related tests
 */

export interface JobFixture {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  skills: string[];
  experienceLevel: string;
  remote: boolean;
}

export const testJobs: JobFixture[] = [
  {
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    type: 'full-time',
    description: 'We are looking for an experienced software engineer to join our team.',
    requirements: [
      '5+ years of experience in software development',
      'Strong knowledge of TypeScript and Node.js',
      'Experience with microservices architecture',
      'Excellent problem-solving skills',
    ],
    salary: {
      min: 120000,
      max: 180000,
      currency: 'USD',
    },
    skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Docker', 'Kubernetes'],
    experienceLevel: 'senior',
    remote: true,
  },
  {
    title: 'Frontend Developer',
    company: 'Design Studio',
    location: 'New York, NY',
    type: 'full-time',
    description: 'Join our creative team to build beautiful user interfaces.',
    requirements: [
      '3+ years of frontend development experience',
      'Expert knowledge of React and modern CSS',
      'Experience with design systems',
      'Strong attention to detail',
    ],
    salary: {
      min: 90000,
      max: 130000,
      currency: 'USD',
    },
    skills: ['React', 'TypeScript', 'CSS', 'HTML', 'Figma', 'Storybook'],
    experienceLevel: 'mid',
    remote: false,
  },
  {
    title: 'DevOps Engineer',
    company: 'Cloud Solutions Inc',
    location: 'Austin, TX',
    type: 'full-time',
    description: 'Help us build and maintain scalable cloud infrastructure.',
    requirements: [
      '4+ years of DevOps experience',
      'Strong knowledge of AWS or Azure',
      'Experience with Infrastructure as Code',
      'CI/CD pipeline expertise',
    ],
    salary: {
      min: 110000,
      max: 160000,
      currency: 'USD',
    },
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Python'],
    experienceLevel: 'senior',
    remote: true,
  },
  {
    title: 'Junior Full Stack Developer',
    company: 'Startup Innovations',
    location: 'Boston, MA',
    type: 'full-time',
    description: 'Great opportunity for recent graduates to learn and grow.',
    requirements: [
      '0-2 years of experience',
      'Knowledge of JavaScript and React',
      'Basic understanding of backend development',
      'Eager to learn',
    ],
    salary: {
      min: 60000,
      max: 80000,
      currency: 'USD',
    },
    skills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'],
    experienceLevel: 'junior',
    remote: true,
  },
];

export const getJobByTitle = (title: string): JobFixture | undefined => {
  return testJobs.find(j => j.title === title);
};

export const getTestJob = (index: number = 0): JobFixture => {
  return testJobs[index] || testJobs[0];
};

export const createJobPayload = (overrides?: Partial<JobFixture>): JobFixture => {
  const baseJob = {
    title: 'Test Job Position',
    company: 'Test Company',
    location: 'Test Location',
    type: 'full-time',
    description: 'This is a test job description.',
    requirements: ['Test requirement 1', 'Test requirement 2'],
    skills: ['Test Skill 1', 'Test Skill 2'],
    experienceLevel: 'mid',
    remote: true,
  };

  return { ...baseJob, ...overrides };
};

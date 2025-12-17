/**
 * Test data generators and fixtures for E2E tests
 * Provides consistent test data across test suites
 */

import { TestUser } from './auth';

/**
 * Generate a unique email for testing
 * @param prefix - Email prefix
 * @returns Unique email address
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Generate a random string
 * @param length - Length of string
 * @returns Random string
 */
export function generateRandomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Test user credentials
 */
export const TEST_USERS = {
  valid: {
    email: 'testuser@example.com',
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
  } as TestUser & { firstName: string; lastName: string },

  premium: {
    email: 'premium@example.com',
    password: 'Premium123!@#',
    firstName: 'Premium',
    lastName: 'User',
  } as TestUser & { firstName: string; lastName: string },

  withMFA: {
    email: 'mfauser@example.com',
    password: 'MFA123!@#',
    firstName: 'MFA',
    lastName: 'User',
  } as TestUser & { firstName: string; lastName: string },
};

/**
 * Test job data
 */
export const TEST_JOBS = {
  softwareEngineer: {
    title: 'Senior Software Engineer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120,000 - $180,000',
    description: 'We are looking for an experienced software engineer...',
    requirements: ['5+ years experience', 'JavaScript/TypeScript', 'React', 'Node.js'],
  },

  dataScientist: {
    title: 'Data Scientist',
    company: 'DataCo',
    location: 'Remote',
    type: 'Full-time',
    salary: '$130,000 - $200,000',
    description: 'Join our data science team...',
    requirements: ['Python', 'Machine Learning', 'SQL', 'Statistics'],
  },

  productManager: {
    title: 'Product Manager',
    company: 'StartupXYZ',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$110,000 - $160,000',
    description: 'Looking for a PM to lead our product initiatives...',
    requirements: ['Product Management', 'Agile', 'Stakeholder Management'],
  },
};

/**
 * Test resume data
 */
export const TEST_RESUME_DATA = {
  workExperience: {
    title: 'Software Engineer',
    company: 'Previous Company',
    location: 'Boston, MA',
    startDate: '2020-01',
    endDate: '2024-12',
    current: false,
    description: 'Developed and maintained web applications using React and Node.js',
    achievements: [
      'Improved application performance by 40%',
      'Led a team of 3 developers',
      'Implemented CI/CD pipeline',
    ],
  },

  education: {
    degree: 'Bachelor of Science',
    field: 'Computer Science',
    school: 'State University',
    location: 'Boston, MA',
    graduationDate: '2020-05',
    gpa: '3.8',
  },

  skills: {
    technical: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL'],
    soft: ['Leadership', 'Communication', 'Problem Solving', 'Team Collaboration'],
  },

  certifications: [
    {
      name: 'AWS Certified Developer',
      issuer: 'Amazon Web Services',
      date: '2023-06',
      credentialId: 'AWS-123456',
    },
  ],
};

/**
 * Test application data
 */
export const TEST_APPLICATION = {
  status: 'pending' as const,
  appliedDate: new Date().toISOString(),
  notes: 'Very interested in this position',
  coverLetter: 'Dear Hiring Manager,\n\nI am excited to apply...',
};

/**
 * Test credit card data (for billing tests)
 * Note: These are test card numbers from Stripe
 */
export const TEST_PAYMENT_DATA = {
  validCard: {
    number: '4242424242424242',
    expiry: '12/28',
    cvc: '123',
    zipCode: '12345',
  },

  declinedCard: {
    number: '4000000000000002',
    expiry: '12/28',
    cvc: '123',
    zipCode: '12345',
  },

  insufficientFunds: {
    number: '4000000000009995',
    expiry: '12/28',
    cvc: '123',
    zipCode: '12345',
  },
};

/**
 * Subscription plans
 */
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['Basic job search', '10 applications/month'],
  },

  basic: {
    name: 'Basic',
    price: 19,
    features: ['Unlimited applications', 'Resume builder', 'Email support'],
  },

  professional: {
    name: 'Professional',
    price: 49,
    features: ['All Basic features', 'AI tools', 'Priority support', 'Auto-apply'],
  },

  enterprise: {
    name: 'Enterprise',
    price: 199,
    features: ['All Professional features', 'Dedicated support', 'API access'],
  },
};

/**
 * AI prompt examples
 */
export const AI_PROMPTS = {
  coverLetter: 'Generate a cover letter for a Software Engineer position at TechCorp',
  interviewPrep: 'Help me prepare for a technical interview for a Senior Developer role',
  salaryNegotiation: 'What salary should I ask for as a Data Scientist with 5 years of experience in San Francisco?',
  skillsGap: 'Analyze my skills against the job requirements for a Product Manager role',
};

/**
 * Wait times for different operations (in ms)
 */
export const WAIT_TIMES = {
  short: 1000,
  medium: 3000,
  long: 5000,
  apiCall: 10000,
  fileUpload: 15000,
  aiGeneration: 30000,
};

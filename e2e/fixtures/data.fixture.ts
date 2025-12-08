/**
 * Test data fixtures for E2E tests
 */

/**
 * Test resume data
 */
export const TEST_RESUME = {
  basic: {
    title: 'Software Engineer Resume',
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/johndoe',
      website: 'https://johndoe.dev',
    },
    summary:
      'Experienced software engineer with 5+ years of experience in full-stack development. Passionate about building scalable web applications and solving complex problems.',
    experience: [
      {
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        startDate: '2020-01',
        endDate: null,
        current: true,
        description:
          'Lead development of microservices architecture serving 1M+ users',
        highlights: [
          'Reduced API response time by 40% through optimization',
          'Mentored 5 junior developers',
          'Implemented CI/CD pipeline reducing deployment time by 60%',
        ],
      },
      {
        company: 'StartupXYZ',
        position: 'Software Engineer',
        location: 'Remote',
        startDate: '2018-06',
        endDate: '2019-12',
        current: false,
        description: 'Built and maintained full-stack web applications',
        highlights: [
          'Developed RESTful APIs using Node.js and Express',
          'Created responsive frontend using React and TypeScript',
          'Improved test coverage from 40% to 85%',
        ],
      },
    ],
    education: [
      {
        institution: 'University of California',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'Berkeley, CA',
        startDate: '2014-09',
        endDate: '2018-05',
        gpa: '3.8',
      },
    ],
    skills: {
      technical: [
        'JavaScript',
        'TypeScript',
        'React',
        'Node.js',
        'Python',
        'PostgreSQL',
        'MongoDB',
        'AWS',
        'Docker',
        'Kubernetes',
      ],
      soft: [
        'Leadership',
        'Communication',
        'Problem Solving',
        'Team Collaboration',
      ],
    },
    certifications: [
      {
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        date: '2021-06',
        credentialId: 'AWS-12345',
      },
    ],
    projects: [
      {
        name: 'Open Source Contribution',
        description:
          'Regular contributor to popular open-source React libraries',
        url: 'https://github.com/johndoe',
        technologies: ['React', 'TypeScript', 'Jest'],
      },
    ],
  },

  minimal: {
    title: 'Entry Level Developer Resume',
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 987-6543',
      location: 'New York, NY',
    },
    summary: 'Recent computer science graduate seeking entry-level position',
    experience: [],
    education: [
      {
        institution: 'State University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'New York, NY',
        startDate: '2019-09',
        endDate: '2023-05',
        gpa: '3.6',
      },
    ],
    skills: {
      technical: ['JavaScript', 'Python', 'HTML', 'CSS', 'Git'],
      soft: ['Quick Learner', 'Team Player', 'Adaptable'],
    },
  },
};

/**
 * Test job data
 */
export const TEST_JOBS = {
  seniorEngineer: {
    title: 'Senior Software Engineer',
    company: 'Tech Giants Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    remote: true,
    salary: {
      min: 150000,
      max: 200000,
      currency: 'USD',
    },
    description:
      'We are looking for a senior software engineer to join our growing team...',
    requirements: [
      '5+ years of software development experience',
      'Strong knowledge of JavaScript and TypeScript',
      'Experience with React and Node.js',
      'Excellent problem-solving skills',
    ],
    benefits: [
      'Competitive salary',
      'Health insurance',
      '401k matching',
      'Flexible work hours',
      'Remote work options',
    ],
    url: 'https://example.com/jobs/senior-engineer',
  },

  frontendDeveloper: {
    title: 'Frontend Developer',
    company: 'Design Studio',
    location: 'New York, NY',
    type: 'Full-time',
    remote: false,
    salary: {
      min: 90000,
      max: 120000,
      currency: 'USD',
    },
    description: 'Join our creative team as a frontend developer...',
    requirements: [
      '3+ years of frontend development experience',
      'Expert knowledge of React',
      'Strong CSS skills',
      'Experience with design systems',
    ],
    benefits: ['Health insurance', 'Paid time off', 'Professional development'],
    url: 'https://example.com/jobs/frontend-dev',
  },

  remoteBackend: {
    title: 'Backend Engineer (Remote)',
    company: 'RemoteFirst Corp',
    location: 'Remote',
    type: 'Full-time',
    remote: true,
    salary: {
      min: 120000,
      max: 160000,
      currency: 'USD',
    },
    description: 'Work remotely as a backend engineer...',
    requirements: [
      '4+ years of backend development',
      'Experience with Node.js or Python',
      'Database design skills',
      'API design experience',
    ],
    benefits: [
      'Fully remote',
      'Flexible hours',
      'Home office stipend',
      'Learning budget',
    ],
    url: 'https://example.com/jobs/backend-remote',
  },
};

/**
 * Test application data
 */
export const TEST_APPLICATIONS = {
  pending: {
    jobTitle: 'Senior Software Engineer',
    company: 'Tech Giants Inc.',
    status: 'pending',
    appliedDate: new Date('2024-01-15'),
    resumeUsed: 'Software Engineer Resume',
    coverLetter: 'I am excited to apply for this position...',
  },

  interviewing: {
    jobTitle: 'Frontend Developer',
    company: 'Design Studio',
    status: 'interviewing',
    appliedDate: new Date('2024-01-10'),
    resumeUsed: 'Software Engineer Resume',
    interviews: [
      {
        type: 'phone',
        date: new Date('2024-01-20'),
        completed: true,
      },
      {
        type: 'technical',
        date: new Date('2024-01-25'),
        completed: false,
      },
    ],
  },

  offered: {
    jobTitle: 'Backend Engineer',
    company: 'RemoteFirst Corp',
    status: 'offered',
    appliedDate: new Date('2024-01-05'),
    resumeUsed: 'Software Engineer Resume',
    offerDetails: {
      salary: 140000,
      startDate: new Date('2024-02-15'),
      benefits: ['Health', 'Dental', '401k'],
    },
  },

  rejected: {
    jobTitle: 'Full Stack Developer',
    company: 'Startup Inc.',
    status: 'rejected',
    appliedDate: new Date('2024-01-01'),
    resumeUsed: 'Software Engineer Resume',
    rejectionDate: new Date('2024-01-08'),
  },
};

/**
 * Test auto-apply settings
 */
export const TEST_AUTO_APPLY_SETTINGS = {
  basic: {
    enabled: true,
    keywords: ['software engineer', 'developer', 'full stack'],
    locations: ['San Francisco', 'Remote'],
    jobTypes: ['full-time', 'contract'],
    remote: true,
    salaryMin: 100000,
    experienceLevel: ['mid', 'senior'],
    maxApplicationsPerDay: 10,
  },

  aggressive: {
    enabled: true,
    keywords: ['engineer', 'developer', 'programmer'],
    locations: ['Any'],
    jobTypes: ['full-time', 'contract', 'part-time'],
    remote: true,
    salaryMin: 80000,
    experienceLevel: ['entry', 'mid', 'senior'],
    maxApplicationsPerDay: 50,
  },

  conservative: {
    enabled: true,
    keywords: ['senior software engineer'],
    locations: ['San Francisco'],
    jobTypes: ['full-time'],
    remote: false,
    salaryMin: 150000,
    experienceLevel: ['senior'],
    maxApplicationsPerDay: 5,
  },
};

/**
 * Test user profile data
 */
export const TEST_PROFILE = {
  complete: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Passionate software engineer with a love for clean code',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    website: 'https://johndoe.dev',
    preferences: {
      jobTypes: ['full-time'],
      remote: true,
      locations: ['San Francisco', 'Remote'],
      salaryExpectation: {
        min: 150000,
        max: 200000,
        currency: 'USD',
      },
    },
  },

  minimal: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
  },
};

/**
 * Test notification settings
 */
export const TEST_NOTIFICATION_SETTINGS = {
  all: {
    email: {
      applications: true,
      interviews: true,
      offers: true,
      rejections: true,
      weeklyDigest: true,
    },
    push: {
      applications: true,
      interviews: true,
      offers: true,
      rejections: false,
    },
  },

  minimal: {
    email: {
      applications: false,
      interviews: true,
      offers: true,
      rejections: false,
      weeklyDigest: false,
    },
    push: {
      applications: false,
      interviews: true,
      offers: true,
      rejections: false,
    },
  },
};

/**
 * Test email verification codes
 */
export const TEST_VERIFICATION_CODES = {
  valid: '123456',
  invalid: '000000',
  expired: '999999',
  short: '123',
  long: '12345678',
};

/**
 * Test cover letters
 */
export const TEST_COVER_LETTERS = {
  basic: `Dear Hiring Manager,

I am writing to express my strong interest in the software engineer position at your company. With my background in full-stack development and passion for creating innovative solutions, I believe I would be a valuable addition to your team.

My experience includes working with modern web technologies such as React, Node.js, and TypeScript. I have successfully delivered multiple projects from conception to deployment, always focusing on code quality, scalability, and user experience.

I am particularly excited about this opportunity because it aligns perfectly with my career goals and allows me to contribute to meaningful projects. I am confident that my technical skills and collaborative approach would make me a strong fit for your team.

Thank you for considering my application. I look forward to discussing how I can contribute to your company's success.

Best regards,
[Your Name]`,

  customized: `Dear [Hiring Manager],

I am excited to apply for the [Position] role at [Company]. Your company's mission to [Company Mission] deeply resonates with my professional values and career aspirations.

In my current role at [Current Company], I have [Key Achievement]. This experience has equipped me with the skills necessary to excel in this position, particularly in [Specific Skill Area].

I am particularly drawn to this opportunity because [Specific Reason]. I believe my background in [Relevant Experience] would enable me to make immediate contributions to your team.

I would welcome the opportunity to discuss how my skills and experience align with your needs.

Thank you for your consideration.

Sincerely,
[Your Name]`,

  minimal: 'I am very interested in this position and believe my skills are a great fit.',
};

/**
 * Test search queries
 */
export const TEST_SEARCH_QUERIES = {
  popular: [
    'software engineer',
    'frontend developer',
    'backend developer',
    'full stack developer',
    'data scientist',
    'product manager',
    'UX designer',
    'devops engineer',
  ],
  specific: [
    'senior react developer',
    'junior python developer',
    'remote typescript engineer',
    'entry level software engineer',
  ],
  invalid: [
    '',
    ' ',
    '<script>alert("xss")</script>',
    'a'.repeat(1000),
  ],
};

/**
 * Test filter combinations
 */
export const TEST_FILTERS = {
  remote: {
    remote: true,
    jobType: 'full-time',
  },
  location: {
    location: 'San Francisco',
    remote: false,
  },
  salary: {
    salaryMin: 100000,
    salaryMax: 150000,
  },
  experienceLevel: {
    experienceLevel: 'senior',
  },
  combined: {
    remote: true,
    jobType: 'full-time',
    salaryMin: 120000,
    experienceLevel: 'mid',
  },
};

/**
 * Test error messages
 */
export const TEST_ERROR_MESSAGES = {
  auth: {
    invalidCredentials: /invalid credentials|incorrect|wrong password/i,
    accountLocked: /account locked|too many attempts/i,
    emailNotVerified: /email not verified|verify your email/i,
  },
  validation: {
    requiredField: /required|cannot be empty/i,
    invalidEmail: /invalid email|valid email address/i,
    weakPassword: /weak password|password too weak/i,
    passwordMismatch: /passwords do not match|passwords must match/i,
  },
  application: {
    alreadyApplied: /already applied|duplicate application/i,
    noResume: /resume required|select a resume/i,
  },
};

/**
 * Helper function to generate unique email
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}.${timestamp}.${random}@example.com`;
}

/**
 * Helper function to generate test resume
 */
export function generateTestResume(overrides?: Partial<typeof TEST_RESUME.basic>) {
  return {
    ...TEST_RESUME.basic,
    ...overrides,
    title: overrides?.title || `Test Resume ${Date.now()}`,
  };
}

/**
 * Helper function to wait with timeout
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

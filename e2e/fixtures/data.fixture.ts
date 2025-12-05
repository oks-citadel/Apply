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

import { JobPlatform } from './types';

// Job Board URLs and Patterns
export const JOB_BOARD_PATTERNS: Record<JobPlatform, RegExp> = {
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/jobs\//,
  indeed: /^https?:\/\/(www\.)?indeed\.com\//,
  greenhouse: /^https?:\/\/.*\.greenhouse\.io\//,
  lever: /^https?:\/\/.*\.lever\.co\//,
  workday: /^https?:\/\/.*\.myworkdayjobs\.com\//,
  icims: /^https?:\/\/.*\.icims\.com\//,
  taleo: /^https?:\/\/.*\.taleo\.net\//,
  smartrecruiters: /^https?:\/\/.*\.smartrecruiters\.com\//,
  jobvite: /^https?:\/\/.*\.jobvite\.com\//,
  breezy: /^https?:\/\/.*\.breezy\.hr\//,
  unknown: /.*/,
};

// Platform Display Names
export const PLATFORM_NAMES: Record<JobPlatform, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workday: 'Workday',
  icims: 'iCIMS',
  taleo: 'Taleo',
  smartrecruiters: 'SmartRecruiters',
  jobvite: 'Jobvite',
  breezy: 'Breezy HR',
  unknown: 'Unknown',
};

// Application Status Display
export const STATUS_DISPLAY = {
  draft: { label: 'Draft', color: 'gray' },
  applying: { label: 'Applying', color: 'blue' },
  applied: { label: 'Applied', color: 'green' },
  viewed: { label: 'Viewed', color: 'cyan' },
  screening: { label: 'Screening', color: 'yellow' },
  interviewing: { label: 'Interviewing', color: 'purple' },
  offered: { label: 'Offered', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  withdrawn: { label: 'Withdrawn', color: 'gray' },
  accepted: { label: 'Accepted', color: 'green' },
} as const;

// Form Field Common Names
export const COMMON_FIELD_NAMES = {
  firstName: ['firstname', 'first_name', 'fname', 'first-name', 'given-name'],
  lastName: ['lastname', 'last_name', 'lname', 'last-name', 'family-name'],
  fullName: ['fullname', 'full_name', 'name', 'full-name'],
  email: ['email', 'e-mail', 'mail', 'email-address', 'emailaddress'],
  phone: ['phone', 'telephone', 'mobile', 'cell', 'phonenumber', 'phone-number', 'tel'],
  address: ['address', 'street', 'street-address', 'address-line1'],
  city: ['city', 'town', 'locality'],
  state: ['state', 'province', 'region'],
  zip: ['zip', 'zipcode', 'postal', 'postalcode', 'postcode', 'postal-code'],
  country: ['country'],
  linkedin: ['linkedin', 'linkedin-url', 'linkedin_url', 'linkedinurl'],
  github: ['github', 'github-url', 'github_url', 'githuburl'],
  portfolio: ['portfolio', 'website', 'personal-website', 'portfolio-url'],
  resume: ['resume', 'cv', 'resume-upload', 'cv-upload'],
  coverLetter: ['cover-letter', 'coverletter', 'cover_letter', 'motivation-letter'],
} as const;

// Extension UI Constants
export const UI_CONFIG = {
  POPUP_WIDTH: 380,
  POPUP_HEIGHT: 600,
  FLOATING_BUTTON_SIZE: 56,
  FLOATING_BUTTON_POSITION: { bottom: 20, right: 20 },
  SIDE_PANEL_WIDTH: 400,
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
} as const;

// Chrome Extension Colors
export const EXTENSION_COLORS = {
  primary: '#0ea5e9',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  gray: '#6b7280',
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  autoDetectJobs: true,
  autoFillForms: true,
  showNotifications: true,
  saveJobsAutomatically: true,
  autofillPreferences: {
    fillPersonalInfo: true,
    fillWorkExperience: true,
    fillEducation: true,
    fillSkills: true,
    highlightFields: true,
    confirmBeforeSubmit: true,
  },
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Storage Configuration
export const STORAGE_CONFIG = {
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_RECENT_JOBS: 20,
  MAX_CACHED_RESUMES: 5,
} as const;

// Notification Templates
export const NOTIFICATION_TEMPLATES = {
  JOB_DETECTED: (jobTitle: string, company: string) => ({
    title: 'Job Detected',
    message: `${jobTitle} at ${company}`,
  }),
  APPLICATION_STARTED: (jobTitle: string) => ({
    title: 'Application Started',
    message: `Applying to ${jobTitle}`,
  }),
  APPLICATION_SUBMITTED: (jobTitle: string) => ({
    title: 'Application Submitted',
    message: `Successfully applied to ${jobTitle}`,
  }),
  ERROR: (message: string) => ({
    title: 'Error',
    message,
  }),
} as const;

// Regex Patterns for Data Extraction
export const EXTRACTION_PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  PHONE: /(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/,
  LINKEDIN: /linkedin\.com\/in\/[a-zA-Z0-9-]+/,
  GITHUB: /github\.com\/[a-zA-Z0-9-]+/,
  SALARY: /\$?\d{1,3}(,?\d{3})*(\.\d{2})?(\s?-\s?\$?\d{1,3}(,?\d{3})*(\.\d{2})?)?/,
  DATE: /\d{1,2}\/\d{1,2}\/\d{2,4}/,
} as const;

// Common Skills List (for matching)
export const COMMON_SKILLS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
  'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'SQL', 'HTML', 'CSS',

  // Frameworks & Libraries
  'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
  'ASP.NET', 'Laravel', 'Ruby on Rails', 'Next.js', 'Nuxt.js', 'Svelte',

  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB',
  'Oracle', 'SQL Server', 'MariaDB',

  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI',
  'GitHub Actions', 'Terraform', 'Ansible', 'CloudFormation',

  // Tools & Technologies
  'Git', 'Linux', 'Bash', 'REST API', 'GraphQL', 'Microservices', 'CI/CD',
  'Agile', 'Scrum', 'JIRA', 'Webpack', 'Vite', 'npm', 'yarn',

  // Testing
  'Jest', 'Mocha', 'Cypress', 'Selenium', 'Playwright', 'JUnit', 'PyTest',

  // Other
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision',
  'Data Analysis', 'Data Science', 'UI/UX', 'Figma', 'Adobe XD', 'Photoshop',
] as const;

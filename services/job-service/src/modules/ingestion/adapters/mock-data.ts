/**
 * Mock job data for testing adapters without real API calls
 */

export const mockIndeedJobs = [
  {
    jobkey: 'mock_indeed_1',
    jobtitle: 'Senior Software Engineer',
    company: 'TechCorp Inc',
    formattedLocation: 'San Francisco, CA',
    snippet: 'We are seeking an experienced software engineer with 5+ years of experience in Node.js and React. Must have strong problem-solving skills.',
    jobtype: 'fulltime',
    formattedRelativeTime: '2 days ago',
    indeedApply: true,
    sponsored: false,
  },
  {
    jobkey: 'mock_indeed_2',
    jobtitle: 'Full Stack Developer',
    company: 'StartupXYZ',
    formattedLocation: 'Remote',
    snippet: 'Join our growing startup! Looking for a full-stack developer with TypeScript, PostgreSQL, and cloud experience.',
    jobtype: 'fulltime',
    formattedRelativeTime: '1 week ago',
    indeedApply: true,
    sponsored: false,
  },
];

export const mockLinkedInJobs = [
  {
    id: 'mock_linkedin_1',
    title: 'Product Manager',
    companyDetails: { name: 'Innovation Labs' },
    formattedLocation: 'New York, NY',
    description: { text: 'Lead product strategy and roadmap. Requirements: 3+ years PM experience, strong analytical skills.' },
    skills: [{ name: 'Product Management' }, { name: 'Agile' }, { name: 'SQL' }],
    experienceLevel: 'MID_SENIOR',
    employmentType: 'FULL_TIME',
    listedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    applyUrl: 'https://www.linkedin.com/jobs/view/mock_linkedin_1',
    workRemoteAllowed: false,
  },
  {
    id: 'mock_linkedin_2',
    title: 'Data Scientist',
    companyDetails: { name: 'Data Insights Co' },
    formattedLocation: 'Remote',
    description: { text: 'Build ML models for customer analytics. Requirements: Python, TensorFlow, 2+ years experience.' },
    skills: [{ name: 'Python' }, { name: 'Machine Learning' }, { name: 'TensorFlow' }],
    experienceLevel: 'ENTRY_LEVEL',
    employmentType: 'FULL_TIME',
    listedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    applyUrl: 'https://www.linkedin.com/jobs/view/mock_linkedin_2',
    workRemoteAllowed: true,
  },
];

export const mockGlassdoorJobs = [
  {
    jobListingId: 'mock_glassdoor_1',
    jobTitle: 'DevOps Engineer',
    employer: 'CloudTech Solutions',
    location: 'Austin, TX',
    jobDescription: 'Manage cloud infrastructure and CI/CD pipelines. Experience with AWS, Docker, Kubernetes required.',
    employmentType: 'FULL_TIME',
    estimatedSalary: '$120,000 - $150,000 per year',
    discoverDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    jobViewUrl: 'https://www.glassdoor.com/job/mock_glassdoor_1',
    overallRating: 4.2,
  },
  {
    jobListingId: 'mock_glassdoor_2',
    jobTitle: 'Frontend Developer',
    employer: 'Digital Media Corp',
    location: 'Los Angeles, CA',
    jobDescription: 'Build responsive web applications using React, TypeScript, and modern CSS frameworks.',
    employmentType: 'FULL_TIME',
    estimatedSalary: '$90,000 - $120,000 per year',
    discoverDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    jobViewUrl: 'https://www.glassdoor.com/job/mock_glassdoor_2',
    overallRating: 3.8,
  },
];

export const mockGreenhouseJobs = {
  jobs: [
    {
      id: 12345,
      title: 'Backend Engineer',
      departments: [{ name: 'Engineering' }],
      location: { name: 'Seattle, WA' },
      content: 'Join our backend team! We need someone with Go, PostgreSQL, and microservices experience.',
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      absolute_url: 'https://boards.greenhouse.io/example/jobs/12345',
      internal_job_id: 67890,
      requisition_id: 'REQ-2024-001',
    },
    {
      id: 12346,
      title: 'QA Automation Engineer',
      departments: [{ name: 'Quality Assurance' }],
      location: { name: 'Remote' },
      content: 'Build automated test frameworks. Requirements: Selenium, Cypress, CI/CD experience.',
      updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      absolute_url: 'https://boards.greenhouse.io/example/jobs/12346',
      internal_job_id: 67891,
      requisition_id: 'REQ-2024-002',
    },
  ],
};

export const mockJobsByProvider = {
  indeed: mockIndeedJobs,
  linkedin: mockLinkedInJobs,
  glassdoor: mockGlassdoorJobs,
  greenhouse: mockGreenhouseJobs.jobs,
};

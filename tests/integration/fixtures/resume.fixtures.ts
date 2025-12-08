/**
 * Resume test fixtures
 * Provides test data for resume-related tests
 */

export interface ResumeFixture {
  userId: string;
  title: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location: string;
    graduationDate: string;
    gpa?: string;
  }>;
  skills: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

export const testResumes: Partial<ResumeFixture>[] = [
  {
    title: 'Senior Software Engineer Resume',
    summary: 'Experienced software engineer with 8+ years of expertise in building scalable web applications.',
    experience: [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Giants Inc',
        location: 'San Francisco, CA',
        startDate: '2020-01-01',
        current: true,
        description: 'Led development of microservices architecture serving millions of users.',
      },
      {
        title: 'Software Engineer',
        company: 'Startup Labs',
        location: 'Seattle, WA',
        startDate: '2017-06-01',
        endDate: '2019-12-31',
        current: false,
        description: 'Developed full-stack features for SaaS platform.',
      },
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of California, Berkeley',
        location: 'Berkeley, CA',
        graduationDate: '2017-05-15',
        gpa: '3.8',
      },
    ],
    skills: [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'Python',
      'PostgreSQL',
      'MongoDB',
      'Docker',
      'Kubernetes',
      'AWS',
    ],
    certifications: [
      {
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        date: '2021-03-15',
      },
    ],
  },
  {
    title: 'Frontend Developer Resume',
    summary: 'Creative frontend developer passionate about building delightful user experiences.',
    experience: [
      {
        title: 'Frontend Developer',
        company: 'Design First Co',
        location: 'New York, NY',
        startDate: '2019-03-01',
        current: true,
        description: 'Building responsive and accessible web applications.',
      },
    ],
    education: [
      {
        degree: 'Bachelor of Arts in Digital Media',
        institution: 'New York University',
        location: 'New York, NY',
        graduationDate: '2019-01-15',
      },
    ],
    skills: [
      'HTML',
      'CSS',
      'JavaScript',
      'React',
      'Vue.js',
      'TypeScript',
      'Sass',
      'Webpack',
      'Jest',
    ],
  },
];

export const getTestResume = (index: number = 0): Partial<ResumeFixture> => {
  return testResumes[index] || testResumes[0];
};

export const createResumePayload = (
  userId: string,
  overrides?: Partial<ResumeFixture>
): Partial<ResumeFixture> => {
  const baseResume: Partial<ResumeFixture> = {
    userId,
    title: 'Test Resume',
    summary: 'This is a test resume summary.',
    experience: [
      {
        title: 'Software Engineer',
        company: 'Test Company',
        location: 'Test Location',
        startDate: '2020-01-01',
        current: true,
        description: 'Test job description.',
      },
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'Test University',
        location: 'Test Location',
        graduationDate: '2019-05-15',
      },
    ],
    skills: ['JavaScript', 'TypeScript', 'React'],
  };

  return { ...baseResume, ...overrides };
};

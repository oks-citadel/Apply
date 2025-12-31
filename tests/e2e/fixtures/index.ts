/**
 * E2E Test Fixtures
 * Provides consistent mock data for testing
 */

// User fixtures
export const testUsers = {
  validUser: {
    email: "test-user@example.com",
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "User",
  },
  adminUser: {
    email: "admin@example.com",
    password: "AdminPassword123!",
    firstName: "Admin",
    lastName: "User",
  },
  weakPasswordUser: {
    email: "weak-pass@example.com",
    password: "123",
    firstName: "Weak",
    lastName: "Password",
  },
  invalidEmailUser: {
    email: "invalid-email",
    password: "TestPassword123!",
    firstName: "Invalid",
    lastName: "Email",
  },
};

// Job fixtures
export const testJobs = {
  softwareEngineer: {
    id: "job-software-engineer-1",
    title: "Software Engineer",
    company: "Tech Corp",
    description: "We are looking for a talented software engineer to join our team.",
    requirements: [
      "5+ years of experience with TypeScript",
      "Experience with React and Node.js",
      "Strong problem-solving skills",
    ],
    location: "San Francisco, CA",
    salary: { min: 120000, max: 180000, currency: "USD" },
    remote: true,
    type: "full-time",
    skills: ["TypeScript", "React", "Node.js", "AWS"],
    postedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  seniorDeveloper: {
    id: "job-senior-developer-1",
    title: "Senior Full Stack Developer",
    company: "StartUp Inc",
    description: "Join our fast-paced startup and build the future.",
    requirements: [
      "7+ years of software development experience",
      "Experience leading small teams",
      "Full stack development skills",
    ],
    location: "Remote",
    salary: { min: 150000, max: 220000, currency: "USD" },
    remote: true,
    type: "full-time",
    skills: ["Python", "Django", "React", "PostgreSQL"],
    postedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  juniorDeveloper: {
    id: "job-junior-developer-1",
    title: "Junior Developer",
    company: "Growing Agency",
    description: "Great opportunity for entry-level developers.",
    requirements: [
      "Computer Science degree or equivalent",
      "Familiarity with JavaScript",
      "Eagerness to learn",
    ],
    location: "New York, NY",
    salary: { min: 65000, max: 85000, currency: "USD" },
    remote: false,
    type: "full-time",
    skills: ["JavaScript", "HTML", "CSS"],
    postedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

// Resume fixtures
export const testResumes = {
  simpleResume: {
    id: "resume-simple-1",
    name: "My Resume",
    template: "professional",
    sections: {
      personalInfo: {
        name: "Test User",
        email: "test@example.com",
        phone: "+1-555-0123",
        location: "San Francisco, CA",
        linkedin: "https://linkedin.com/in/testuser",
        portfolio: "https://testuser.dev",
      },
      summary: "Experienced software engineer with 5+ years of experience building scalable web applications.",
      experience: [
        {
          id: "exp-1",
          company: "Previous Company",
          title: "Senior Software Engineer",
          startDate: "2020-01",
          endDate: null,
          current: true,
          description: "Lead development of microservices architecture.",
          achievements: [
            "Reduced deployment time by 50%",
            "Mentored 3 junior developers",
          ],
        },
      ],
      education: [
        {
          id: "edu-1",
          institution: "University of Technology",
          degree: "Bachelor of Science",
          field: "Computer Science",
          graduationDate: "2018-05",
          gpa: "3.8",
        },
      ],
      skills: ["TypeScript", "React", "Node.js", "AWS", "PostgreSQL", "Docker"],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  minimalResume: {
    id: "resume-minimal-1",
    name: "Quick Resume",
    template: "modern",
    sections: {
      personalInfo: {
        name: "Jane Doe",
        email: "jane@example.com",
      },
      skills: ["JavaScript"],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// Application fixtures
export const testApplications = {
  pendingApplication: {
    id: "app-pending-1",
    jobId: "job-software-engineer-1",
    resumeId: "resume-simple-1",
    status: "pending",
    appliedAt: new Date().toISOString(),
    coverLetter: "I am excited to apply for this position...",
  },
  submittedApplication: {
    id: "app-submitted-1",
    jobId: "job-senior-developer-1",
    resumeId: "resume-simple-1",
    status: "submitted",
    appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    coverLetter: "I am excited to apply for this position...",
  },
  interviewApplication: {
    id: "app-interview-1",
    jobId: "job-software-engineer-1",
    resumeId: "resume-simple-1",
    status: "interview",
    appliedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    coverLetter: "I am excited to apply for this position...",
  },
};

// Profile fixtures
export const testProfiles = {
  completeProfile: {
    userId: "user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    headline: "Senior Software Engineer",
    summary: "Passionate software engineer with 5+ years of experience.",
    location: "San Francisco, CA",
    phone: "+1-555-0123",
    website: "https://testuser.dev",
    linkedin: "https://linkedin.com/in/testuser",
    github: "https://github.com/testuser",
    openToWork: true,
    preferredJobTypes: ["full-time", "contract"],
    preferredLocations: ["Remote", "San Francisco, CA"],
    salaryExpectation: { min: 120000, max: 180000, currency: "USD" },
  },
  incompleteProfile: {
    userId: "user-456",
    email: "incomplete@example.com",
    firstName: "Incomplete",
    lastName: "User",
    headline: "",
    summary: "",
    location: "",
  },
};

// Notification fixtures
export const testNotifications = {
  applicationUpdate: {
    id: "notif-1",
    type: "application_update",
    title: "Application Status Update",
    message: "Your application to Tech Corp has been viewed.",
    read: false,
    createdAt: new Date().toISOString(),
    metadata: {
      applicationId: "app-pending-1",
      jobId: "job-software-engineer-1",
    },
  },
  newJobMatch: {
    id: "notif-2",
    type: "job_match",
    title: "New Job Match",
    message: "A new job matching your preferences has been posted.",
    read: false,
    createdAt: new Date().toISOString(),
    metadata: {
      jobId: "job-senior-developer-1",
      matchScore: 0.92,
    },
  },
  systemNotification: {
    id: "notif-3",
    type: "system",
    title: "System Maintenance",
    message: "Scheduled maintenance on Sunday at 2 AM PST.",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
};

// Analytics fixtures
export const testAnalytics = {
  dashboardSummary: {
    totalApplications: 25,
    pendingApplications: 5,
    interviewsScheduled: 3,
    offersReceived: 1,
    rejections: 8,
    weeklyChange: {
      applications: 5,
      interviews: 1,
    },
    responseRate: 0.52,
    averageTimeToResponse: 4.5, // days
  },
  applicationTrends: {
    period: "30d",
    data: [
      { date: "2024-01-01", applications: 3, responses: 1 },
      { date: "2024-01-08", applications: 5, responses: 2 },
      { date: "2024-01-15", applications: 7, responses: 4 },
      { date: "2024-01-22", applications: 4, responses: 2 },
      { date: "2024-01-29", applications: 6, responses: 3 },
    ],
  },
};

// Export helper functions
export function generateUniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

export function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export function createTestUser(overrides: Partial<typeof testUsers.validUser> = {}) {
  return {
    ...testUsers.validUser,
    email: generateUniqueEmail(),
    ...overrides,
  };
}

export function createTestJob(overrides: Partial<typeof testJobs.softwareEngineer> = {}) {
  return {
    ...testJobs.softwareEngineer,
    id: generateUniqueId("job"),
    ...overrides,
  };
}

export function createTestResume(overrides: Partial<typeof testResumes.simpleResume> = {}) {
  return {
    ...testResumes.simpleResume,
    id: generateUniqueId("resume"),
    ...overrides,
  };
}

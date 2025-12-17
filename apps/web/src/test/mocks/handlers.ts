import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      });
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/auth/register`, async () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
  }),

  http.post(`${API_URL}/auth/logout`, async () => {
    return HttpResponse.json({ success: true });
  }),

  // User endpoints
  http.get(`${API_URL}/users/me`, async () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      subscriptionTier: 'free',
    });
  }),

  http.patch(`${API_URL}/users/me`, async () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      firstName: 'Updated',
      lastName: 'User',
    });
  }),

  // Jobs endpoints
  http.get(`${API_URL}/jobs`, async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';

    return HttpResponse.json({
      data: [
        {
          id: '1',
          title: 'Senior Developer',
          company: 'TechCorp',
          location: 'Remote',
          salary: '$120,000 - $150,000',
          postedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Full Stack Engineer',
          company: 'StartupXYZ',
          location: 'New York, NY',
          salary: '$100,000 - $130,000',
          postedAt: new Date().toISOString(),
        },
      ],
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: 2,
        totalPages: 1,
      },
    });
  }),

  http.get(`${API_URL}/jobs/:id`, async ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      title: 'Senior Developer',
      company: 'TechCorp',
      location: 'Remote',
      description: 'We are looking for a senior developer...',
      requirements: ['5+ years experience', 'React', 'Node.js'],
      salary: '$120,000 - $150,000',
      postedAt: new Date().toISOString(),
    });
  }),

  // Applications endpoints
  http.get(`${API_URL}/applications`, async () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          jobId: '1',
          status: 'applied',
          appliedAt: new Date().toISOString(),
          job: {
            title: 'Senior Developer',
            company: 'TechCorp',
          },
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      },
    });
  }),

  http.post(`${API_URL}/applications`, async () => {
    return HttpResponse.json({
      id: '2',
      jobId: '2',
      status: 'pending',
      appliedAt: new Date().toISOString(),
    });
  }),

  // Resumes endpoints
  http.get(`${API_URL}/resumes`, async () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          title: 'Software Engineer Resume',
          fileName: 'resume.pdf',
          createdAt: new Date().toISOString(),
          atsScore: 85,
        },
      ],
    });
  }),

  http.post(`${API_URL}/resumes/upload`, async () => {
    return HttpResponse.json({
      id: '2',
      title: 'New Resume',
      fileName: 'new-resume.pdf',
      createdAt: new Date().toISOString(),
    });
  }),

  // Analytics endpoints
  http.get(`${API_URL}/analytics`, async () => {
    return HttpResponse.json({
      totalApplications: 156,
      responseRate: 42,
      interviewRate: 18,
      offerCount: 5,
      applicationsTrend: 12,
      responseTrend: 5,
      interviewTrend: -2,
      offerTrend: 25,
      trendData: [
        { date: 'Week 1', applications: 25, interviews: 4, offers: 1 },
        { date: 'Week 2', applications: 32, interviews: 6, offers: 0 },
        { date: 'Week 3', applications: 28, interviews: 5, offers: 2 },
        { date: 'Week 4', applications: 41, interviews: 8, offers: 1 },
      ],
      statusDistribution: [
        { name: 'Pending', value: 45 },
        { name: 'Reviewed', value: 38 },
        { name: 'Interview', value: 28 },
        { name: 'Offer', value: 5 },
        { name: 'Rejected', value: 40 },
      ],
      topMatches: [
        { id: '1', company: 'TechCorp', position: 'Senior Developer', matchScore: 95, status: 'interview', dateApplied: '2024-01-15' },
        { id: '2', company: 'StartupXYZ', position: 'Full Stack Engineer', matchScore: 88, status: 'applied', dateApplied: '2024-01-14' },
      ],
    });
  }),

  // Health check
  http.get(`${API_URL}/health`, async () => {
    return HttpResponse.json({ status: 'healthy' });
  }),
];

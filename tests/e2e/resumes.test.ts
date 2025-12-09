/**
 * Resume Service E2E Tests
 * Tests resume CRUD operations and AI features
 */

import { authClient, resumeClient, config, testState } from './setup';

describe('Resume Service E2E', () => {
  const testUser = {
    email: `e2e-resume-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Resume',
    lastName: 'Tester',
  };

  beforeAll(async () => {
    // Register and login test user
    const response = await authClient.post('/auth/register', testUser);
    testState.accessToken = response.data.accessToken;
    testState.refreshToken = response.data.refreshToken;
    testState.userId = response.data.user.id;
  });

  afterAll(async () => {
    // Cleanup
    testState.accessToken = '';
    testState.refreshToken = '';
    testState.userId = '';
    testState.testResumeId = '';
  });

  describe('POST /resumes', () => {
    it('should create a new resume', async () => {
      const resumeData = {
        name: 'E2E Test Resume',
        template: 'professional',
        sections: {
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1-555-123-4567',
            location: 'San Francisco, CA',
          },
          experience: [
            {
              company: 'Tech Corp',
              title: 'Software Engineer',
              location: 'San Francisco, CA',
              startDate: '2020-01-01',
              endDate: '2023-12-31',
              current: false,
              description: 'Developed web applications using React and Node.js',
              highlights: [
                'Led team of 5 engineers',
                'Improved performance by 40%',
              ],
            },
          ],
          education: [
            {
              institution: 'University of Technology',
              degree: 'Bachelor of Science',
              field: 'Computer Science',
              startDate: '2016-09-01',
              endDate: '2020-05-15',
              gpa: 3.8,
            },
          ],
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS'],
          certifications: [],
        },
      };

      const response = await resumeClient.post('/resumes', resumeData);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(resumeData.name);
      expect(response.data.template).toBe(resumeData.template);
      expect(response.data.sections.skills).toEqual(resumeData.sections.skills);

      testState.testResumeId = response.data.id;
    });

    it('should reject resume without name', async () => {
      try {
        await resumeClient.post('/resumes', {
          template: 'professional',
          sections: {},
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('GET /resumes', () => {
    it('should list user resumes', async () => {
      const response = await resumeClient.get('/resumes');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      if (testState.testResumeId) {
        const resume = response.data.find((r: any) => r.id === testState.testResumeId);
        expect(resume).toBeDefined();
      }
    });

    it('should reject unauthenticated request', async () => {
      try {
        await resumeClient.get('/resumes', {
          headers: { Authorization: '' },
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('GET /resumes/:id', () => {
    it('should get resume by ID', async () => {
      if (!testState.testResumeId) {
        console.log('Skipping: No test resume ID available');
        return;
      }

      const response = await resumeClient.get(`/resumes/${testState.testResumeId}`);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testState.testResumeId);
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('sections');
    });

    it('should return 404 for non-existent resume', async () => {
      try {
        await resumeClient.get('/resumes/00000000-0000-0000-0000-000000000000');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('PATCH /resumes/:id', () => {
    it('should update resume', async () => {
      if (!testState.testResumeId) {
        console.log('Skipping: No test resume ID available');
        return;
      }

      const updates = {
        name: 'Updated E2E Resume',
        sections: {
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes'],
        },
      };

      const response = await resumeClient.patch(`/resumes/${testState.testResumeId}`, updates);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updates.name);
      expect(response.data.sections.skills).toContain('Docker');
      expect(response.data.sections.skills).toContain('Kubernetes');
    });

    it('should reject update of non-owned resume', async () => {
      // This test assumes there's no resume with this ID owned by the test user
      try {
        await resumeClient.patch('/resumes/00000000-0000-0000-0000-000000000000', {
          name: 'Hack Attempt',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect([403, 404]).toContain(error.response.status);
      }
    });
  });

  describe('POST /resumes/:id/duplicate', () => {
    it('should duplicate a resume', async () => {
      if (!testState.testResumeId) {
        console.log('Skipping: No test resume ID available');
        return;
      }

      const response = await resumeClient.post(`/resumes/${testState.testResumeId}/duplicate`);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.id).not.toBe(testState.testResumeId);
      expect(response.data.name).toContain('Copy');
    });
  });

  describe('PATCH /resumes/:id/default', () => {
    it('should set resume as default', async () => {
      if (!testState.testResumeId) {
        console.log('Skipping: No test resume ID available');
        return;
      }

      const response = await resumeClient.patch(`/resumes/${testState.testResumeId}/default`);

      expect(response.status).toBe(200);
      expect(response.data.isDefault).toBe(true);
    });
  });

  describe('GET /resumes/templates', () => {
    it('should list available templates', async () => {
      const response = await resumeClient.get('/resumes/templates');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      if (response.data.length > 0) {
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('name');
      }
    });
  });

  describe('GET /resumes/:id/preview', () => {
    it('should get resume preview', async () => {
      if (!testState.testResumeId) {
        console.log('Skipping: No test resume ID available');
        return;
      }

      const response = await resumeClient.get(`/resumes/${testState.testResumeId}/preview`);

      expect(response.status).toBe(200);
      // Preview might return HTML or JSON depending on implementation
    });
  });

  describe('GET /resumes/:id/export/pdf', () => {
    it('should export resume as PDF', async () => {
      if (!testState.testResumeId) {
        console.log('Skipping: No test resume ID available');
        return;
      }

      const response = await resumeClient.get(`/resumes/${testState.testResumeId}/export/pdf`, {
        responseType: 'arraybuffer',
      });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
    });
  });

  describe('AI Features', () => {
    describe('POST /resumes/:id/ai/enhance', () => {
      it('should enhance resume using AI', async () => {
        if (!testState.testResumeId) {
          console.log('Skipping: No test resume ID available');
          return;
        }

        const response = await resumeClient.post(`/resumes/${testState.testResumeId}/ai/enhance`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('sections');
      });
    });

    describe('POST /resumes/:id/ai/suggestions', () => {
      it('should get AI suggestions for resume', async () => {
        if (!testState.testResumeId) {
          console.log('Skipping: No test resume ID available');
          return;
        }

        const response = await resumeClient.post(`/resumes/${testState.testResumeId}/ai/suggestions`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.suggestions) || response.data.suggestions === undefined).toBe(true);
      });
    });

    describe('POST /resumes/:id/ai/tailor', () => {
      it('should tailor resume for specific job', async () => {
        if (!testState.testResumeId || !testState.testJobId) {
          console.log('Skipping: Missing resume or job ID');
          return;
        }

        const response = await resumeClient.post(`/resumes/${testState.testResumeId}/ai/tailor`, {
          jobId: testState.testJobId,
        });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('DELETE /resumes/:id', () => {
    it('should delete a resume', async () => {
      if (!testState.testResumeId) {
        console.log('Skipping: No test resume ID available');
        return;
      }

      const response = await resumeClient.delete(`/resumes/${testState.testResumeId}`);

      expect(response.status).toBe(204);
    });

    it('should confirm resume is deleted', async () => {
      if (!testState.testResumeId) {
        console.log('Skipping: No test resume ID available');
        return;
      }

      try {
        await resumeClient.get(`/resumes/${testState.testResumeId}`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});

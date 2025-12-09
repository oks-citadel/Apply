/**
 * User Profile Service E2E Tests
 * Tests user profile management, career history, and preferences
 */

import { authClient, userClient, config, testState } from './setup';

describe('User Profile Service E2E', () => {
  const testUser = {
    email: `e2e-profile-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Profile',
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
    testState.accessToken = '';
    testState.refreshToken = '';
    testState.userId = '';
  });

  describe('Profile', () => {
    describe('GET /profile', () => {
      it('should get user profile', async () => {
        const response = await userClient.get('/profile');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('userId');
      });

      it('should reject unauthenticated request', async () => {
        try {
          await userClient.get('/profile', {
            headers: { Authorization: '' },
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(401);
        }
      });
    });

    describe('PATCH /profile', () => {
      it('should update user profile', async () => {
        const updates = {
          headline: 'Senior Software Engineer | Full Stack Developer',
          summary: 'Experienced software engineer with 8+ years in cloud technologies.',
          location: 'San Francisco, CA',
          linkedinUrl: 'https://linkedin.com/in/testuser',
          githubUrl: 'https://github.com/testuser',
          portfolioUrl: 'https://testuser.dev',
        };

        const response = await userClient.patch('/profile', updates);

        expect(response.status).toBe(200);
        expect(response.data.headline).toBe(updates.headline);
        expect(response.data.summary).toBe(updates.summary);
        expect(response.data.location).toBe(updates.location);
      });

      it('should reject invalid URL format', async () => {
        try {
          await userClient.patch('/profile', {
            linkedinUrl: 'not-a-valid-url',
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(400);
        }
      });
    });

    describe('GET /profile/completion', () => {
      it('should get profile completion percentage', async () => {
        const response = await userClient.get('/profile/completion');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('percentage');
        expect(typeof response.data.percentage).toBe('number');
        expect(response.data.percentage).toBeGreaterThanOrEqual(0);
        expect(response.data.percentage).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Career Experience', () => {
    let experienceId: string;

    describe('POST /career/experience', () => {
      it('should add work experience', async () => {
        const experience = {
          company: 'Tech Corp',
          title: 'Software Engineer',
          location: 'San Francisco, CA',
          startDate: '2020-01-01',
          endDate: '2023-12-31',
          current: false,
          description: 'Developed scalable web applications.',
          highlights: ['Led team of 5', 'Improved performance by 40%'],
        };

        const response = await userClient.post('/career/experience', experience);

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data.company).toBe(experience.company);
        expect(response.data.title).toBe(experience.title);

        experienceId = response.data.id;
      });

      it('should reject experience without company', async () => {
        try {
          await userClient.post('/career/experience', {
            title: 'Engineer',
            startDate: '2020-01-01',
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(400);
        }
      });
    });

    describe('GET /career/experience', () => {
      it('should list work experience', async () => {
        const response = await userClient.get('/career/experience');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);

        if (experienceId) {
          const exp = response.data.find((e: any) => e.id === experienceId);
          expect(exp).toBeDefined();
        }
      });
    });

    describe('PATCH /career/experience/:id', () => {
      it('should update work experience', async () => {
        if (!experienceId) {
          console.log('Skipping: No experience ID available');
          return;
        }

        const response = await userClient.patch(`/career/experience/${experienceId}`, {
          title: 'Senior Software Engineer',
        });

        expect(response.status).toBe(200);
        expect(response.data.title).toBe('Senior Software Engineer');
      });
    });

    describe('DELETE /career/experience/:id', () => {
      it('should delete work experience', async () => {
        if (!experienceId) {
          console.log('Skipping: No experience ID available');
          return;
        }

        const response = await userClient.delete(`/career/experience/${experienceId}`);

        expect(response.status).toBe(204);
      });
    });
  });

  describe('Education', () => {
    let educationId: string;

    describe('POST /career/education', () => {
      it('should add education', async () => {
        const education = {
          institution: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2016-09-01',
          endDate: '2020-05-15',
          gpa: 3.8,
        };

        const response = await userClient.post('/career/education', education);

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data.institution).toBe(education.institution);

        educationId = response.data.id;
      });
    });

    describe('GET /career/education', () => {
      it('should list education', async () => {
        const response = await userClient.get('/career/education');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });

    describe('PATCH /career/education/:id', () => {
      it('should update education', async () => {
        if (!educationId) {
          console.log('Skipping: No education ID available');
          return;
        }

        const response = await userClient.patch(`/career/education/${educationId}`, {
          gpa: 3.9,
        });

        expect(response.status).toBe(200);
        expect(response.data.gpa).toBe(3.9);
      });
    });

    describe('DELETE /career/education/:id', () => {
      it('should delete education', async () => {
        if (!educationId) {
          console.log('Skipping: No education ID available');
          return;
        }

        const response = await userClient.delete(`/career/education/${educationId}`);

        expect(response.status).toBe(204);
      });
    });
  });

  describe('Skills', () => {
    let skillId: string;

    describe('POST /skills', () => {
      it('should add a skill', async () => {
        const response = await userClient.post('/skills', {
          name: 'TypeScript',
          level: 'expert',
          yearsOfExperience: 5,
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data.name).toBe('TypeScript');

        skillId = response.data.id;
      });
    });

    describe('POST /skills/bulk', () => {
      it('should add multiple skills', async () => {
        const response = await userClient.post('/skills/bulk', {
          skills: [
            { name: 'React', level: 'expert' },
            { name: 'Node.js', level: 'advanced' },
            { name: 'Python', level: 'intermediate' },
          ],
        });

        expect(response.status).toBe(201);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBe(3);
      });
    });

    describe('GET /skills', () => {
      it('should list user skills', async () => {
        const response = await userClient.get('/skills');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });

    describe('GET /skills/suggestions', () => {
      it('should get skill suggestions', async () => {
        const response = await userClient.get('/skills/suggestions');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });

    describe('PATCH /skills/:id', () => {
      it('should update a skill', async () => {
        if (!skillId) {
          console.log('Skipping: No skill ID available');
          return;
        }

        const response = await userClient.patch(`/skills/${skillId}`, {
          level: 'expert',
          yearsOfExperience: 6,
        });

        expect(response.status).toBe(200);
        expect(response.data.yearsOfExperience).toBe(6);
      });
    });

    describe('DELETE /skills/:id', () => {
      it('should delete a skill', async () => {
        if (!skillId) {
          console.log('Skipping: No skill ID available');
          return;
        }

        const response = await userClient.delete(`/skills/${skillId}`);

        expect(response.status).toBe(204);
      });
    });
  });

  describe('Preferences', () => {
    describe('GET /preferences', () => {
      it('should get job preferences', async () => {
        const response = await userClient.get('/preferences');

        expect(response.status).toBe(200);
      });
    });

    describe('PATCH /preferences', () => {
      it('should update job preferences', async () => {
        const preferences = {
          remoteOnly: true,
          willingToRelocate: false,
          noticePeriod: '2 weeks',
        };

        const response = await userClient.patch('/preferences', preferences);

        expect(response.status).toBe(200);
        expect(response.data.remoteOnly).toBe(true);
      });
    });

    describe('GET /preferences/job-types', () => {
      it('should get preferred job types', async () => {
        const response = await userClient.get('/preferences/job-types');

        expect(response.status).toBe(200);
      });
    });

    describe('PATCH /preferences/job-types', () => {
      it('should update preferred job types', async () => {
        const response = await userClient.patch('/preferences/job-types', {
          types: ['full-time', 'contract'],
        });

        expect(response.status).toBe(200);
      });
    });

    describe('GET /preferences/salary', () => {
      it('should get salary expectations', async () => {
        const response = await userClient.get('/preferences/salary');

        expect(response.status).toBe(200);
      });
    });

    describe('PATCH /preferences/salary', () => {
      it('should update salary expectations', async () => {
        const response = await userClient.patch('/preferences/salary', {
          minimum: 100000,
          preferred: 150000,
          currency: 'USD',
        });

        expect(response.status).toBe(200);
        expect(response.data.minimum).toBe(100000);
      });
    });

    describe('GET /preferences/locations', () => {
      it('should get preferred locations', async () => {
        const response = await userClient.get('/preferences/locations');

        expect(response.status).toBe(200);
      });
    });

    describe('PATCH /preferences/locations', () => {
      it('should update preferred locations', async () => {
        const response = await userClient.patch('/preferences/locations', {
          locations: ['San Francisco, CA', 'New York, NY', 'Remote'],
        });

        expect(response.status).toBe(200);
      });
    });
  });
});

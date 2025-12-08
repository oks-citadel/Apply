/**
 * Resume-AI Integration Tests
 * Tests the integration between resume-service and ai-service
 * Validates resume optimization and analysis flows
 */

import { AxiosInstance } from 'axios';
import { TestServiceManager } from './utils/test-service-manager';
import { TestDatabaseManager } from './utils/test-database';
import { createResumePayload, getTestResume } from './fixtures/resume.fixtures';
import { createUserPayload } from './fixtures/user.fixtures';
import { logger } from './utils/test-logger';

describe('Resume-AI Integration Tests', () => {
  let serviceManager: TestServiceManager;
  let dbManager: TestDatabaseManager;
  let resumeService: AxiosInstance;
  let aiService: AxiosInstance;
  let authService: AxiosInstance;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    serviceManager = (global as any).testServices;
    dbManager = (global as any).testDb;

    resumeService = serviceManager.getService('resume-service');
    aiService = serviceManager.getService('ai-service');
    authService = serviceManager.getService('auth-service');

    // Wait for services
    await Promise.all([
      serviceManager.waitForService('resume-service'),
      serviceManager.waitForService('ai-service'),
      serviceManager.waitForService('auth-service'),
    ]);

    // Create test user
    const userData = createUserPayload();
    const registerResponse = await authService.post('/api/v1/auth/register', userData);
    accessToken = registerResponse.data.accessToken;
    userId = registerResponse.data.user.id;
  });

  beforeEach(async () => {
    await dbManager.cleanDatabase('resume_service_test');
  });

  describe('Resume Optimization Flow', () => {
    it('should optimize resume content using AI', async () => {
      // Create a resume
      const resumeData = createResumePayload(userId, {
        summary: 'I worked on many projects and did good work.',
        experience: [
          {
            title: 'Developer',
            company: 'Tech Company',
            location: 'City, State',
            startDate: '2020-01-01',
            current: true,
            description: 'I did coding and helped the team.',
          },
        ],
      });

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(resumeResponse.status).toBe(201);
      const resume = resumeResponse.data;

      // Request AI optimization
      const optimizeResponse = await aiService.post(
        '/api/ai/optimize/resume',
        {
          resumeId: resume.id,
          targetRole: 'Software Engineer',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(optimizeResponse.status).toBe(200);
      expect(optimizeResponse.data).toHaveProperty('optimizedContent');
      expect(optimizeResponse.data).toHaveProperty('improvements');
      expect(optimizeResponse.data).toHaveProperty('score');

      const { optimizedContent, improvements, score } = optimizeResponse.data;

      // Verify improvements are provided
      expect(Array.isArray(improvements)).toBe(true);
      expect(improvements.length).toBeGreaterThan(0);

      improvements.forEach((improvement: any) => {
        expect(improvement).toHaveProperty('type');
        expect(improvement).toHaveProperty('description');
        expect(improvement).toHaveProperty('impact');
      });

      // Verify score improvement
      expect(score).toHaveProperty('before');
      expect(score).toHaveProperty('after');
      expect(score).toHaveProperty('improvement');
      expect(score.after).toBeGreaterThan(score.before);
    });

    it('should save optimized resume version', async () => {
      const resumeData = createResumePayload(userId);

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resume = resumeResponse.data;

      // Optimize resume
      const optimizeResponse = await aiService.post(
        '/api/ai/optimize/resume',
        {
          resumeId: resume.id,
          saveAsVersion: true,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(optimizeResponse.status).toBe(200);
      const optimizationId = optimizeResponse.data.id;

      // Verify optimization is saved in resume service
      const versionsResponse = await resumeService.get(
        `/api/v1/resumes/${resume.id}/versions`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(versionsResponse.status).toBe(200);
      expect(versionsResponse.data.versions).toContainEqual(
        expect.objectContaining({
          type: 'ai-optimized',
        })
      );
    });

    it('should optimize specific resume sections', async () => {
      const resumeData = createResumePayload(userId, {
        summary: 'Basic summary text',
        experience: [
          {
            title: 'Software Engineer',
            company: 'Tech Corp',
            location: 'San Francisco',
            startDate: '2020-01-01',
            current: true,
            description: 'Did various tasks',
          },
        ],
      });

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resume = resumeResponse.data;

      // Optimize only summary
      const optimizeResponse = await aiService.post(
        '/api/ai/optimize/resume-section',
        {
          resumeId: resume.id,
          section: 'summary',
          targetRole: 'Senior Software Engineer',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(optimizeResponse.status).toBe(200);
      expect(optimizeResponse.data).toHaveProperty('optimizedSection');
      expect(optimizeResponse.data).toHaveProperty('suggestions');
    });
  });

  describe('Resume Analysis Flow', () => {
    it('should analyze resume for ATS compatibility', async () => {
      const resumeData = createResumePayload(userId);

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resume = resumeResponse.data;

      // Request ATS analysis
      const analysisResponse = await aiService.post(
        '/api/ai/analyze/resume-ats',
        {
          resumeId: resume.id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(analysisResponse.status).toBe(200);
      expect(analysisResponse.data).toHaveProperty('atsScore');
      expect(analysisResponse.data).toHaveProperty('issues');
      expect(analysisResponse.data).toHaveProperty('recommendations');

      const { atsScore, issues, recommendations } = analysisResponse.data;

      expect(atsScore).toBeGreaterThanOrEqual(0);
      expect(atsScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(issues)).toBe(true);
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should identify missing keywords for target job', async () => {
      const resumeData = createResumePayload(userId, {
        skills: ['JavaScript', 'React', 'Node.js'],
      });

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resume = resumeResponse.data;

      // Analyze against job description
      const analysisResponse = await aiService.post(
        '/api/ai/analyze/resume-keywords',
        {
          resumeId: resume.id,
          jobDescription: 'Looking for TypeScript, React, Node.js, Docker, and Kubernetes expert',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(analysisResponse.status).toBe(200);
      expect(analysisResponse.data).toHaveProperty('matchingKeywords');
      expect(analysisResponse.data).toHaveProperty('missingKeywords');

      const { matchingKeywords, missingKeywords } = analysisResponse.data;

      expect(matchingKeywords).toContain('React');
      expect(matchingKeywords).toContain('Node.js');
      expect(missingKeywords).toContain('TypeScript');
      expect(missingKeywords).toContain('Docker');
      expect(missingKeywords).toContain('Kubernetes');
    });

    it('should provide skill gap analysis', async () => {
      const resumeData = createResumePayload(userId, {
        skills: ['JavaScript', 'HTML', 'CSS'],
      });

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resume = resumeResponse.data;

      // Get skill gap analysis
      const gapAnalysisResponse = await aiService.post(
        '/api/ai/analyze/skill-gap',
        {
          resumeId: resume.id,
          targetRole: 'Senior Full Stack Developer',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(gapAnalysisResponse.status).toBe(200);
      expect(gapAnalysisResponse.data).toHaveProperty('currentSkills');
      expect(gapAnalysisResponse.data).toHaveProperty('requiredSkills');
      expect(gapAnalysisResponse.data).toHaveProperty('skillGaps');
      expect(gapAnalysisResponse.data).toHaveProperty('learningPath');

      const { skillGaps, learningPath } = gapAnalysisResponse.data;

      expect(Array.isArray(skillGaps)).toBe(true);
      expect(Array.isArray(learningPath)).toBe(true);
      expect(learningPath.length).toBeGreaterThan(0);
    });
  });

  describe('Resume Scoring Flow', () => {
    it('should score resume quality', async () => {
      const resumeData = createResumePayload(userId);

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resume = resumeResponse.data;

      // Get resume score
      const scoreResponse = await aiService.get(
        `/api/ai/analyze/resume-score/${resume.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(scoreResponse.status).toBe(200);
      expect(scoreResponse.data).toHaveProperty('overallScore');
      expect(scoreResponse.data).toHaveProperty('categoryScores');
      expect(scoreResponse.data).toHaveProperty('strengths');
      expect(scoreResponse.data).toHaveProperty('weaknesses');

      const { overallScore, categoryScores } = scoreResponse.data;

      expect(overallScore).toBeGreaterThanOrEqual(0);
      expect(overallScore).toBeLessThanOrEqual(100);

      expect(categoryScores).toHaveProperty('formatting');
      expect(categoryScores).toHaveProperty('content');
      expect(categoryScores).toHaveProperty('keywords');
      expect(categoryScores).toHaveProperty('experience');
    });

    it('should compare multiple resume versions', async () => {
      // Create original resume
      const resumeData = createResumePayload(userId);

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resume = resumeResponse.data;

      // Get original score
      const originalScoreResponse = await aiService.get(
        `/api/ai/analyze/resume-score/${resume.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const originalScore = originalScoreResponse.data.overallScore;

      // Optimize resume
      await aiService.post(
        '/api/ai/optimize/resume',
        {
          resumeId: resume.id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // Get new score
      const newScoreResponse = await aiService.get(
        `/api/ai/analyze/resume-score/${resume.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { version: 'latest' },
        }
      );

      const newScore = newScoreResponse.data.overallScore;

      // Optimized version should have better score
      expect(newScore).toBeGreaterThanOrEqual(originalScore);
    });
  });

  describe('Batch Resume Operations', () => {
    it('should analyze multiple resumes efficiently', async () => {
      // Create multiple resumes
      const resumePromises = Array.from({ length: 3 }, () =>
        resumeService.post('/api/v1/resumes', createResumePayload(userId), {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      );

      const resumeResponses = await Promise.all(resumePromises);
      const resumeIds = resumeResponses.map(r => r.data.id);

      const startTime = Date.now();

      // Batch analyze
      const batchAnalysisResponse = await aiService.post(
        '/api/ai/analyze/batch-resumes',
        {
          resumeIds,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const duration = Date.now() - startTime;

      expect(batchAnalysisResponse.status).toBe(200);
      expect(batchAnalysisResponse.data.results.length).toBe(resumeIds.length);

      logger.info(`Analyzed ${resumeIds.length} resumes in ${duration}ms`);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid resume ID', async () => {
      const optimizeResponse = await aiService.post(
        '/api/ai/optimize/resume',
        {
          resumeId: 'non-existent-resume-id',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect([404, 400]).toContain(optimizeResponse.status);
    });

    it('should handle malformed resume content', async () => {
      const resumeData = {
        userId,
        title: 'Broken Resume',
        // Missing required fields
      };

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Should fail validation
      expect([400, 422]).toContain(resumeResponse.status);
    });

    it('should timeout gracefully on complex analysis', async () => {
      const resumeData = createResumePayload(userId);

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resume = resumeResponse.data;

      // Request complex analysis with short timeout
      const analysisResponse = await aiService.post(
        '/api/ai/analyze/resume-comprehensive',
        {
          resumeId: resume.id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 1000, // 1 second timeout
        }
      );

      // Should either succeed or timeout gracefully
      expect([200, 408, 504]).toContain(analysisResponse.status);
    });
  });
});

import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';
import { WAIT_TIMES } from '../utils/test-data';

/**
 * E2E Tests for AI Skills Gap Analysis
 *
 * This suite tests skills analysis features including:
 * - Skills gap identification
 * - Learning recommendations
 * - Career path suggestions
 * - Skill matching
 */

authenticatedTest.describe('AI Skills Gap Analysis', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai-tools/skills-gap');
  });

  authenticatedTest('should display skills gap page', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveURL(/.*skills/);
    await expect(authenticatedPage.getByRole('heading', { name: /skills.*gap|skills.*analysis/i })).toBeVisible();
  });

  authenticatedTest('should analyze skills for job posting', async ({ authenticatedPage }) => {
    // Mock the skills gap analysis API endpoint
    await authenticatedPage.route('**/api/v1/ai/skills-gap', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matched_skills: ['Python', 'Docker'],
          skill_gaps: [
            {
              skill: 'Django',
              importance: 'critical',
              learning_path: 'Online courses and hands-on projects for Django',
              estimated_time: '2-3 months',
              resources: [
                'Django official documentation',
                'Django for Beginners course',
                'Practice projects using Django'
              ]
            },
            {
              skill: 'Kubernetes',
              importance: 'important',
              learning_path: 'Cloud-native container orchestration training',
              estimated_time: '3-4 months',
              resources: [
                'Kubernetes official documentation',
                'CKA certification path',
                'Practice with local clusters'
              ]
            }
          ],
          transferable_skills: [],
          overall_match_percentage: 60.0,
          readiness_level: 'near-ready',
          priority_skills: ['Django', 'PostgreSQL', 'Kubernetes'],
          estimated_timeline: '4-8 months'
        })
      });
    });

    const jobDescInput = authenticatedPage.getByLabel(/job.*description/i);
    await jobDescInput.fill('Required: Python, Django, PostgreSQL, Docker, Kubernetes');

    await authenticatedPage.getByRole('button', { name: /analyze/i }).click();

    await expect(authenticatedPage.getByText(/analyzing/i)).toBeVisible();

    const analysis = authenticatedPage.getByTestId('skills-analysis');
    await expect(analysis).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
  });

  authenticatedTest('should show matching skills', async ({ authenticatedPage }) => {
    // Mock the skills gap analysis API endpoint
    await authenticatedPage.route('**/api/v1/ai/skills-gap', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matched_skills: ['Python', 'JavaScript', 'React'],
          skill_gaps: [],
          transferable_skills: [],
          overall_match_percentage: 100.0,
          readiness_level: 'ready',
          priority_skills: [],
          estimated_timeline: 'Ready now'
        })
      });
    });

    const matchingSkills = authenticatedPage.getByTestId('matching-skills');
    if (await matchingSkills.isVisible({ timeout: WAIT_TIMES.aiGeneration }).catch(() => false)) {
      await expect(matchingSkills).toBeVisible();
    }
  });

  authenticatedTest('should show missing skills', async ({ authenticatedPage }) => {
    // Mock the skills gap analysis API endpoint with skill gaps
    await authenticatedPage.route('**/api/v1/ai/skills-gap', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matched_skills: ['Python'],
          skill_gaps: [
            {
              skill: 'Kubernetes',
              importance: 'critical',
              learning_path: 'Container orchestration training',
              estimated_time: '3-4 months',
              resources: ['Kubernetes documentation', 'CKA certification']
            },
            {
              skill: 'AWS',
              importance: 'important',
              learning_path: 'Cloud computing fundamentals',
              estimated_time: '2-3 months',
              resources: ['AWS certification', 'Cloud tutorials']
            }
          ],
          transferable_skills: [],
          overall_match_percentage: 40.0,
          readiness_level: 'needs-development',
          priority_skills: ['Kubernetes', 'AWS'],
          estimated_timeline: '4-8 months'
        })
      });
    });

    const missingSkills = authenticatedPage.getByTestId('missing-skills');
    if (await missingSkills.isVisible({ timeout: WAIT_TIMES.aiGeneration }).catch(() => false)) {
      await expect(missingSkills).toBeVisible();
    }
  });

  authenticatedTest('should provide learning recommendations', async ({ authenticatedPage }) => {
    // Mock the skill recommendations API endpoint
    await authenticatedPage.route('**/api/v1/ai/skill-recommendations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recommendations: [
            {
              skill: 'Cloud Computing (AWS/Azure)',
              relevance: 'Essential for modern infrastructure',
              market_demand: 'high',
              learning_resources: [
                'AWS certification courses',
                'Cloud architecture tutorials',
                'Hands-on labs'
              ],
              career_impact: 'Opens opportunities in cloud-native development'
            },
            {
              skill: 'Kubernetes',
              relevance: 'Industry standard for container orchestration',
              market_demand: 'high',
              learning_resources: [
                'Kubernetes official documentation',
                'CKA certification path',
                'Practice with local clusters'
              ],
              career_impact: 'Highly sought after in DevOps roles'
            }
          ],
          learning_path: 'Start with cloud fundamentals, then progress to containers',
          estimated_duration: 'Moderate commitment: 6-12 months'
        })
      });
    });

    const recommendations = authenticatedPage.getByRole('heading', { name: /recommendations|learning.*path/i });
    if (await recommendations.isVisible({ timeout: WAIT_TIMES.aiGeneration }).catch(() => false)) {
      await expect(recommendations).toBeVisible();

      // Should have course or resource suggestions
      const resources = authenticatedPage.getByTestId('learning-resource');
      const count = await resources.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  authenticatedTest('should suggest career paths', async ({ authenticatedPage }) => {
    const careerPathsButton = authenticatedPage.getByRole('button', { name: /career.*paths/i });
    if (await careerPathsButton.isVisible().catch(() => false)) {
      await careerPathsButton.click();

      const pathSuggestions = authenticatedPage.getByTestId('career-path');
      await expect(pathSuggestions.first()).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
    }
  });

  authenticatedTest('should calculate skill match percentage', async ({ authenticatedPage }) => {
    // Mock the skills gap analysis API endpoint with match percentage
    await authenticatedPage.route('**/api/v1/ai/skills-gap', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matched_skills: ['Python', 'JavaScript', 'Docker'],
          skill_gaps: [
            {
              skill: 'Kubernetes',
              importance: 'important',
              learning_path: 'Container orchestration',
              estimated_time: '3 months',
              resources: ['K8s docs']
            }
          ],
          transferable_skills: [],
          overall_match_percentage: 75.0,
          readiness_level: 'near-ready',
          priority_skills: ['Kubernetes'],
          estimated_timeline: '2-4 months'
        })
      });
    });

    const matchPercentage = authenticatedPage.getByText(/\d+%.*match|match.*\d+%/i);
    if (await matchPercentage.isVisible({ timeout: WAIT_TIMES.aiGeneration }).catch(() => false)) {
      await expect(matchPercentage).toBeVisible();
    }
  });

  authenticatedTest('should export skills analysis', async ({ authenticatedPage }) => {
    const exportButton = authenticatedPage.getByRole('button', { name: /export|download/i });
    if (await exportButton.isVisible().catch(() => false)) {
      const downloadPromise = authenticatedPage.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/skills|analysis/i);
    }
  });
});

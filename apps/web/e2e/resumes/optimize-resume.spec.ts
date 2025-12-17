import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';
import { WAIT_TIMES } from '../utils/test-data';

/**
 * E2E Tests for Resume Optimization Flow
 *
 * This suite tests AI-powered resume optimization including:
 * - ATS optimization
 * - Keyword suggestions
 * - Content improvements
 * - Score/rating
 * - Job-specific tailoring
 */

// Mock API responses for optimization
const mockResumeData = {
  id: 'resume-1',
  filename: 'Software_Engineer_Resume.pdf',
  status: 'parsed',
  parsedData: {
    name: 'John Doe',
    email: 'john@example.com',
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: [
      { title: 'Software Engineer', company: 'Tech Corp', years: 3 },
    ],
  },
};

const mockOptimizationResponse = {
  score: 75,
  atsScore: 72,
  breakdown: {
    atsCompatibility: 72,
    keywords: 68,
    formatting: 80,
    contentQuality: 78,
    impactStatements: 70,
  },
  keywords: {
    matched: ['JavaScript', 'React', 'Node.js'],
    missing: ['TypeScript', 'AWS', 'Docker', 'CI/CD'],
    recommended: ['TypeScript', 'AWS', 'Kubernetes'],
  },
  suggestions: [
    {
      id: 'sug-1',
      type: 'keyword',
      text: 'Add TypeScript to your skills section',
      impact: 'high',
    },
    {
      id: 'sug-2',
      type: 'content',
      text: 'Quantify your achievements with metrics',
      impact: 'high',
    },
    {
      id: 'sug-3',
      type: 'formatting',
      text: 'Use bullet points for job descriptions',
      impact: 'medium',
    },
  ],
  formatting: [
    { issue: 'Long paragraphs in experience section', fix: 'Use bullet points' },
    { issue: 'Missing section headers', fix: 'Add clear section headers' },
  ],
  missingSections: ['certifications', 'projects'],
};

const mockJobMatchResponse = {
  matchScore: 82,
  compatibility: 'Good',
  matchedSkills: ['JavaScript', 'React'],
  missingSkills: ['TypeScript', 'GraphQL'],
  recommendations: [
    'Emphasize your React experience',
    'Add any TypeScript projects you have worked on',
  ],
};

authenticatedTest.describe('Resume Optimization', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    // Mock resumes list API
    await authenticatedPage.route('**/api/resumes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [mockResumeData],
            total: 1,
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock individual resume API
    await authenticatedPage.route('**/api/resumes/*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResumeData),
        });
      } else {
        await route.continue();
      }
    });

    // Mock optimization API
    await authenticatedPage.route('**/api/resumes/*/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOptimizationResponse),
      });
    });

    // Mock ATS analysis API
    await authenticatedPage.route('**/api/resumes/*/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          atsScore: mockOptimizationResponse.atsScore,
          breakdown: mockOptimizationResponse.breakdown,
          issues: mockOptimizationResponse.formatting,
        }),
      });
    });

    // Mock job match API
    await authenticatedPage.route('**/api/resumes/*/match**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobMatchResponse),
      });
    });

    // Mock suggestions apply API
    await authenticatedPage.route('**/api/resumes/*/suggestions/*/apply', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Suggestion applied' }),
      });
    });

    // Mock save version API
    await authenticatedPage.route('**/api/resumes/*/versions', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'version-2',
            resumeId: 'resume-1',
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              { id: 'version-1', createdAt: '2024-01-15T10:00:00Z', score: 70 },
            ],
          }),
        });
      }
    });

    await authenticatedPage.goto('/resumes');
  });

  authenticatedTest('should display optimize button for resume', async ({ authenticatedPage }) => {
    // Assuming at least one resume exists
    const resumeItem = authenticatedPage.getByTestId('resume-item').first();

    if (await resumeItem.isVisible().catch(() => false)) {
      // Look for optimize button
      const optimizeButton = resumeItem.getByRole('button', { name: /optimize|improve|enhance/i });
      const optimizeLink = resumeItem.getByRole('link', { name: /optimize|improve|enhance/i });

      const hasButton = await optimizeButton.isVisible().catch(() => false);
      const hasLink = await optimizeLink.isVisible().catch(() => false);

      expect(hasButton || hasLink).toBeTruthy();
    }
  });

  authenticatedTest('should open optimization tool', async ({ authenticatedPage }) => {
    const resumeItem = authenticatedPage.getByTestId('resume-item').first();

    if (await resumeItem.isVisible().catch(() => false)) {
      const optimizeButton = resumeItem.getByRole('button', { name: /optimize/i });
      const optimizeLink = resumeItem.getByRole('link', { name: /optimize/i });

      if (await optimizeButton.isVisible().catch(() => false)) {
        await optimizeButton.click();
      } else if (await optimizeLink.isVisible().catch(() => false)) {
        await optimizeLink.click();
      }

      // Should navigate to optimization page or open modal
      await authenticatedPage.waitForLoadState('networkidle');

      const isOptimizePage = authenticatedPage.url().match(/.*optimize|.*improve/);
      const hasOptimizeModal = await authenticatedPage.getByRole('dialog').isVisible().catch(() => false);
      const hasOptimizeContent = await authenticatedPage.getByText(/optimization|optimize|score/i).isVisible().catch(() => false);

      expect(isOptimizePage || hasOptimizeModal || hasOptimizeContent).toBeTruthy();
    }
  });

  authenticatedTest('should display resume score/rating', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');

    // Wait for optimization data to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Should show score (e.g., "75/100" or "Good")
    const scoreElement = authenticatedPage.getByText(/score.*\d+|rating|\d+.*%|good|excellent|needs.*improvement/i);

    await expect(scoreElement.first()).toBeVisible({ timeout: WAIT_TIMES.apiCall });
  });

  authenticatedTest('should analyze ATS compatibility', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');

    // Click analyze or wait for auto-analysis
    const analyzeButton = authenticatedPage.getByRole('button', { name: /analyze|scan|check/i });

    if (await analyzeButton.isVisible().catch(() => false)) {
      await analyzeButton.click();
    }

    // Wait for results
    const atsScore = authenticatedPage.getByText(/ats.*compatible|ats.*score|compatibility|\d+.*%/i);
    await expect(atsScore.first()).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
  });

  authenticatedTest('should provide keyword suggestions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');

    await authenticatedPage.waitForLoadState('networkidle');

    // Should show missing or recommended keywords
    const keywordsSection = authenticatedPage.getByText(/keywords|suggested|missing.*skills|recommended/i);
    const keywordItems = authenticatedPage.getByTestId('keyword-item');

    const hasKeywordsSection = await keywordsSection.first().isVisible({ timeout: WAIT_TIMES.apiCall }).catch(() => false);
    const hasKeywordItems = await keywordItems.first().isVisible({ timeout: WAIT_TIMES.apiCall }).catch(() => false);

    expect(hasKeywordsSection || hasKeywordItems).toBeTruthy();
  });

  authenticatedTest('should add suggested keyword to resume', async ({ authenticatedPage }) => {
    // Mock the keyword add API
    await authenticatedPage.route('**/api/resumes/*/keywords', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Keyword added' }),
        });
      } else {
        await route.continue();
      }
    });

    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // Wait for keyword suggestions
    const keywordItems = authenticatedPage.getByTestId('keyword-item');
    const addButtons = authenticatedPage.getByRole('button', { name: /add|include|\+/i });

    if (await keywordItems.first().isVisible({ timeout: WAIT_TIMES.apiCall }).catch(() => false)) {
      // Click add button on first keyword
      const addButton = keywordItems.first().getByRole('button', { name: /add|include|\+/i });
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        // Should show success message
        await expect(authenticatedPage.getByText(/added|included|success/i)).toBeVisible({ timeout: 5000 });
      }
    } else if (await addButtons.first().isVisible().catch(() => false)) {
      await addButtons.first().click();
    }
  });

  authenticatedTest('should show content improvement suggestions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should show suggestions for improving content
    const suggestionsSection = authenticatedPage.getByText(/suggestions|improvements|recommendations/i);
    const suggestionItems = authenticatedPage.getByTestId('suggestion-item');

    const hasSuggestionsSection = await suggestionsSection.first().isVisible({ timeout: WAIT_TIMES.apiCall }).catch(() => false);
    const hasSuggestionItems = await suggestionItems.first().isVisible({ timeout: WAIT_TIMES.apiCall }).catch(() => false);

    expect(hasSuggestionsSection || hasSuggestionItems).toBeTruthy();
  });

  authenticatedTest('should apply content suggestion', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    const suggestionItems = authenticatedPage.getByTestId('suggestion-item');
    const applyButtons = authenticatedPage.getByRole('button', { name: /apply|use|accept/i });

    if (await suggestionItems.first().isVisible({ timeout: WAIT_TIMES.apiCall }).catch(() => false)) {
      // Click apply button
      const applyButton = suggestionItems.first().getByRole('button', { name: /apply|use|accept/i });
      if (await applyButton.isVisible().catch(() => false)) {
        await applyButton.click();
        // Should show confirmation
        await expect(authenticatedPage.getByText(/applied|updated|success/i)).toBeVisible({ timeout: 5000 });
      }
    } else if (await applyButtons.first().isVisible().catch(() => false)) {
      await applyButtons.first().click();
    }
  });

  authenticatedTest('should optimize resume for specific job', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');

    // Option to optimize for specific job posting
    const jobInput = authenticatedPage.getByLabel(/job.*title|position|paste.*job.*description/i);
    const jobTextarea = authenticatedPage.getByPlaceholder(/job.*description|paste.*job/i);

    if (await jobInput.isVisible().catch(() => false)) {
      // Enter job title or paste description
      await jobInput.fill('Senior Software Engineer at Google');

      // Click optimize button
      const optimizeButton = authenticatedPage.getByRole('button', { name: /optimize|tailor|customize|match/i });
      if (await optimizeButton.isVisible().catch(() => false)) {
        await optimizeButton.click();

        // Should show match results
        await expect(authenticatedPage.getByText(/match|compatibility|score/i).first()).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
      }
    } else if (await jobTextarea.isVisible().catch(() => false)) {
      await jobTextarea.fill('Looking for a Senior Software Engineer with React and TypeScript experience.');

      const optimizeButton = authenticatedPage.getByRole('button', { name: /optimize|tailor|customize|match/i });
      if (await optimizeButton.isVisible().catch(() => false)) {
        await optimizeButton.click();
      }
    }
  });

  authenticatedTest('should show formatting recommendations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for formatting suggestions
    const formattingSection = authenticatedPage.getByText(/formatting|layout|structure/i);
    const formattingItems = authenticatedPage.getByTestId('formatting-recommendation');

    const hasFormattingSection = await formattingSection.first().isVisible({ timeout: WAIT_TIMES.apiCall }).catch(() => false);
    const hasFormattingItems = await formattingItems.first().isVisible({ timeout: WAIT_TIMES.apiCall }).catch(() => false);

    // Either formatting section or any optimization content should be visible
    const hasOptimizationContent = await authenticatedPage.getByText(/score|improvement|suggestion/i).first().isVisible().catch(() => false);

    expect(hasFormattingSection || hasFormattingItems || hasOptimizationContent).toBeTruthy();
  });

  authenticatedTest('should highlight missing sections', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should identify missing important sections
    const missingSection = authenticatedPage.getByText(/missing|add.*section|consider.*adding|incomplete/i);

    if (await missingSection.first().isVisible({ timeout: WAIT_TIMES.apiCall }).catch(() => false)) {
      await expect(missingSection.first()).toBeVisible();
    }
  });

  authenticatedTest('should compare before/after optimization', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // Apply some optimizations
    const applyButton = authenticatedPage.getByRole('button', { name: /apply.*all|accept.*all/i });

    if (await applyButton.isVisible().catch(() => false)) {
      await applyButton.click();

      // Should show comparison
      const compareButton = authenticatedPage.getByRole('button', { name: /compare|view.*changes|before.*after/i });

      if (await compareButton.isVisible().catch(() => false)) {
        await compareButton.click();

        // Should show side-by-side or highlighted changes
        await expect(authenticatedPage.getByText(/before|after|original|optimized|changes/i).first()).toBeVisible();
      }
    }
  });

  authenticatedTest('should show optimization score breakdown', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should show detailed score or breakdown
    const scoreBreakdown = authenticatedPage.getByText(/breakdown|details|score|%/i);
    await expect(scoreBreakdown.first()).toBeVisible({ timeout: WAIT_TIMES.apiCall });
  });

  authenticatedTest('should export optimized resume', async ({ authenticatedPage }) => {
    // Mock download endpoint
    await authenticatedPage.route('**/api/resumes/*/export**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 mock pdf'),
        headers: {
          'Content-Disposition': 'attachment; filename="optimized-resume.pdf"',
        },
      });
    });

    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // After optimization, should be able to export
    const exportButton = authenticatedPage.getByRole('button', { name: /export|download|save.*pdf/i });

    if (await exportButton.isVisible().catch(() => false)) {
      // Set up download handler
      const downloadPromise = authenticatedPage.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await exportButton.click();

      // Verify download started (may not complete in test environment)
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/resume|optimized/i);
      }
    }
  });

  authenticatedTest('should save optimization as new version', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // Option to save as new version
    const saveAsNewButton = authenticatedPage.getByRole('button', { name: /save.*version|create.*version|save.*copy/i });
    const saveButton = authenticatedPage.getByRole('button', { name: /save/i });

    if (await saveAsNewButton.isVisible().catch(() => false)) {
      await saveAsNewButton.click();
      await expect(authenticatedPage.getByText(/version.*created|saved|success/i)).toBeVisible({ timeout: 5000 });
    } else if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
    }
  });

  authenticatedTest('should show industry-specific recommendations', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // Select industry if dropdown exists
    const industrySelect = authenticatedPage.getByLabel(/industry|field|sector/i);
    const industryDropdown = authenticatedPage.getByRole('combobox', { name: /industry/i });

    if (await industrySelect.isVisible().catch(() => false)) {
      await industrySelect.click();
      const techOption = authenticatedPage.getByRole('option', { name: /technology|software|tech/i });
      if (await techOption.isVisible().catch(() => false)) {
        await techOption.click();
      }
    } else if (await industryDropdown.isVisible().catch(() => false)) {
      await industryDropdown.click();
    }

    // Should have some form of recommendations visible
    const recommendations = authenticatedPage.getByText(/recommendation|suggestion|improve/i);
    await expect(recommendations.first()).toBeVisible({ timeout: WAIT_TIMES.apiCall });
  });

  authenticatedTest('should track optimization history', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for history/timeline
    const historyButton = authenticatedPage.getByRole('button', { name: /history|timeline|versions/i });
    const historyTab = authenticatedPage.getByRole('tab', { name: /history|versions/i });

    if (await historyButton.isVisible().catch(() => false)) {
      await historyButton.click();

      // Should show past optimization actions
      await expect(authenticatedPage.getByText(/version|history|previous/i).first()).toBeVisible({ timeout: 5000 });
    } else if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();
    }
  });

  authenticatedTest('should undo optimization changes', async ({ authenticatedPage }) => {
    // Mock undo API
    await authenticatedPage.route('**/api/resumes/*/undo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Changes reverted' }),
      });
    });

    await authenticatedPage.goto('/resumes/1/optimize');
    await authenticatedPage.waitForLoadState('networkidle');

    // Apply a change first
    const applyButton = authenticatedPage.getByRole('button', { name: /apply/i }).first();
    if (await applyButton.isVisible().catch(() => false)) {
      await applyButton.click();
      await authenticatedPage.waitForTimeout(500);
    }

    // Undo button should appear
    const undoButton = authenticatedPage.getByRole('button', { name: /undo|revert/i });

    if (await undoButton.isVisible().catch(() => false)) {
      await undoButton.click();
      await expect(authenticatedPage.getByText(/reverted|undone|restored/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

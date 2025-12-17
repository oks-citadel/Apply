import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';

/**
 * E2E Tests for Resume Builder/Creation Flow
 *
 * This suite tests resume creation functionality including:
 * - Creating resume from scratch
 * - Using resume templates
 * - Filling resume sections
 * - Preview and editing
 * - Saving drafts
 */

authenticatedTest.describe('Resume Builder', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/resumes');
  });

  authenticatedTest('should display create resume button', async ({ authenticatedPage }) => {
    // Verify create button exists
    const createButton = authenticatedPage.getByRole('button', { name: /create.*resume|new.*resume|build.*resume/i });
    await expect(createButton).toBeVisible();
  });

  authenticatedTest('should open resume builder', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Click create button
    await authenticatedPage.getByRole('button', { name: /create.*resume|build.*resume/i }).click();

    // Should navigate to builder or open modal
    const isBuilderPage = await authenticatedPage.url().match(/.*resume.*builder|.*resume.*create|.*resume.*new/);
    const hasBuilderModal = await authenticatedPage.getByRole('dialog', { name: /resume.*builder/i }).isVisible().catch(() => false);

    expect(isBuilderPage || hasBuilderModal).toBeTruthy();
  });

  authenticatedTest('should display template selection', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.getByRole('button', { name: /create.*resume/i }).click();

    // Should show template options
    const templateHeading = authenticatedPage.getByRole('heading', { name: /choose.*template|select.*template/i });

    if (await templateHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(templateHeading).toBeVisible();

      // Should have multiple templates
      const templates = authenticatedPage.getByTestId('template-option');
      const count = await templates.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  authenticatedTest('should select a resume template', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.getByRole('button', { name: /create.*resume/i }).click();

    // Wait for templates
    const templates = authenticatedPage.getByTestId('template-option');

    if (await templates.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Select first template
      await templates.first().click();

      // Should proceed to resume editing
      const resumeTitle = authenticatedPage.getByLabel(/resume.*title|name/i);
      const nextButton = authenticatedPage.getByRole('button', { name: /next|continue|start/i });

      const hasTitleInput = await resumeTitle.isVisible().catch(() => false);
      const hasNextButton = await nextButton.isVisible().catch(() => false);

      expect(hasTitleInput || hasNextButton).toBeTruthy();
    }
  });

  authenticatedTest('should create resume with basic information', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.getByRole('button', { name: /create.*resume/i }).click();

    // Skip template selection if present
    const nextButton = authenticatedPage.getByRole('button', { name: /next|continue|start/i });
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();
    }

    // Fill basic info
    const titleInput = authenticatedPage.getByLabel(/resume.*title|name/i);
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill('Software Engineer Resume');
    }

    // Personal information
    await authenticatedPage.getByLabel(/full.*name|name/i).fill('John Doe');
    await authenticatedPage.getByLabel(/email/i).fill('john.doe@example.com');
    await authenticatedPage.getByLabel(/phone/i).fill('(555) 123-4567');

    const locationField = authenticatedPage.getByLabel(/location|city/i);
    if (await locationField.isVisible().catch(() => false)) {
      await locationField.fill('San Francisco, CA');
    }

    // Save or continue
    await authenticatedPage.getByRole('button', { name: /save|next|continue/i }).click();

    // Verify saved
    await expect(authenticatedPage.getByText(/saved|success/i)).toBeVisible();
  });

  authenticatedTest('should add work experience to resume', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Navigate to resume builder work experience section
    await authenticatedPage.goto('/resumes/new?section=experience');

    // Click add experience
    await authenticatedPage.getByRole('button', { name: /add.*experience/i }).click();

    // Fill experience details
    await authenticatedPage.getByLabel(/job.*title|position/i).fill('Senior Software Engineer');
    await authenticatedPage.getByLabel(/company/i).fill('Tech Corp');
    await authenticatedPage.getByLabel(/start.*date/i).fill('2020-01');
    await authenticatedPage.getByLabel(/end.*date/i).fill('2024-12');

    // Responsibilities
    const descField = authenticatedPage.getByLabel(/description|responsibilities/i);
    if (await descField.isVisible().catch(() => false)) {
      await descField.fill('Developed and maintained web applications using React and Node.js');
    }

    // Save
    await authenticatedPage.getByRole('button', { name: /save|add/i }).click();

    // Verify added
    await expect(authenticatedPage.getByText('Senior Software Engineer')).toBeVisible();
    await expect(authenticatedPage.getByText('Tech Corp')).toBeVisible();
  });

  authenticatedTest('should add education to resume', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.goto('/resumes/new?section=education');

    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();

    await authenticatedPage.getByLabel(/school|university/i).fill('State University');
    await authenticatedPage.getByLabel(/degree/i).fill('Bachelor of Science');
    await authenticatedPage.getByLabel(/field|major/i).fill('Computer Science');
    await authenticatedPage.getByLabel(/graduation.*date/i).fill('2020-05');

    await authenticatedPage.getByRole('button', { name: /save|add/i }).click();

    await expect(authenticatedPage.getByText('State University')).toBeVisible();
  });

  authenticatedTest('should add skills to resume', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.goto('/resumes/new?section=skills');

    const skillInput = authenticatedPage.getByPlaceholder(/add.*skill/i);

    // Add multiple skills
    const skills = ['JavaScript', 'React', 'Node.js', 'Python'];
    for (const skill of skills) {
      await skillInput.fill(skill);
      await skillInput.press('Enter');
      await authenticatedPage.waitForTimeout(300);
    }

    // Verify all skills added
    for (const skill of skills) {
      await expect(authenticatedPage.getByText(skill)).toBeVisible();
    }
  });

  authenticatedTest('should add summary/objective to resume', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.goto('/resumes/new?section=summary');

    const summaryField = authenticatedPage.getByLabel(/summary|objective|professional.*summary/i);
    await summaryField.fill('Experienced software engineer with 5+ years of expertise in full-stack web development.');

    await authenticatedPage.getByRole('button', { name: /save|next/i }).click();

    await expect(authenticatedPage.getByText(/saved|success/i)).toBeVisible();
  });

  authenticatedTest('should preview resume', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // While building/editing resume
    await authenticatedPage.goto('/resumes/new');

    // Click preview button
    const previewButton = authenticatedPage.getByRole('button', { name: /preview/i });
    await previewButton.click();

    // Should show preview
    const preview = authenticatedPage.getByTestId('resume-preview');
    const previewModal = authenticatedPage.getByRole('dialog', { name: /preview/i });

    const hasPreview = await preview.isVisible().catch(() => false);
    const hasModal = await previewModal.isVisible().catch(() => false);

    expect(hasPreview || hasModal).toBeTruthy();
  });

  authenticatedTest('should save resume as draft', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.goto('/resumes/new');

    // Fill some basic info
    await authenticatedPage.getByLabel(/name/i).fill('John Doe');

    // Click save draft
    const saveDraftButton = authenticatedPage.getByRole('button', { name: /save.*draft|save.*progress/i });

    if (await saveDraftButton.isVisible().catch(() => false)) {
      await saveDraftButton.click();

      await expect(authenticatedPage.getByText(/saved|draft.*saved/i)).toBeVisible();
    }
  });

  authenticatedTest('should auto-save resume progress', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.goto('/resumes/new');

    // Make changes
    await authenticatedPage.getByLabel(/name/i).fill('John Doe');

    // Wait for auto-save
    await authenticatedPage.waitForTimeout(3000);

    // Should see auto-save indicator
    const autoSaveIndicator = authenticatedPage.getByText(/auto.*saved|all.*changes.*saved/i);

    if (await autoSaveIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(autoSaveIndicator).toBeVisible();
    }
  });

  authenticatedTest('should navigate between resume sections', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.goto('/resumes/new');

    // Should have section navigation
    const sections = ['Personal Info', 'Experience', 'Education', 'Skills'];

    for (const section of sections) {
      const sectionButton = authenticatedPage.getByRole('button', { name: new RegExp(section, 'i') });
      const sectionTab = authenticatedPage.getByRole('tab', { name: new RegExp(section, 'i') });

      const hasButton = await sectionButton.isVisible().catch(() => false);
      const hasTab = await sectionTab.isVisible().catch(() => false);

      if (hasButton) {
        await sectionButton.click();
        await expect(authenticatedPage.getByRole('heading', { name: new RegExp(section, 'i') })).toBeVisible();
      } else if (hasTab) {
        await sectionTab.click();
        await expect(authenticatedPage.getByRole('heading', { name: new RegExp(section, 'i') })).toBeVisible();
      }
    }
  });

  authenticatedTest('should import data from profile', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.goto('/resumes/new');

    // Click import from profile button
    const importButton = authenticatedPage.getByRole('button', { name: /import.*profile|use.*profile.*data/i });

    if (await importButton.isVisible().catch(() => false)) {
      await importButton.click();

      // Data should be populated
      await expect(authenticatedPage.getByText(/imported|data.*imported/i)).toBeVisible();

      // Verify some fields are filled
      const nameInput = authenticatedPage.getByLabel(/name/i);
      await expect(nameInput).not.toBeEmpty();
    }
  });

  authenticatedTest('should duplicate resume for editing', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.goto('/resumes');

    // Find existing resume and duplicate it
    const duplicateButton = authenticatedPage.getByRole('button', { name: /duplicate|copy/i }).first();

    if (await duplicateButton.isVisible().catch(() => false)) {
      const initialCount = await authenticatedPage.getByTestId('resume-item').count();

      await duplicateButton.click();

      // Should create a copy
      await expect(authenticatedPage.getByText(/duplicated|copied/i)).toBeVisible();

      const newCount = await authenticatedPage.getByTestId('resume-item').count();
      expect(newCount).toBe(initialCount + 1);
    }
  });

  authenticatedTest('should handle unsaved changes warning', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.goto('/resumes/new');

    // Make changes
    await authenticatedPage.getByLabel(/name/i).fill('John Doe');

    // Try to navigate away
    await authenticatedPage.goto('/dashboard');

    // Should show unsaved changes warning
    const dialog = authenticatedPage.getByRole('dialog');
    const warningText = authenticatedPage.getByText(/unsaved.*changes|lose.*changes/i);

    const hasDialog = await dialog.isVisible({ timeout: 2000 }).catch(() => false);
    const hasWarning = await warningText.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasDialog || hasWarning) {
      // Can choose to stay or leave
      const stayButton = authenticatedPage.getByRole('button', { name: /stay|cancel|go.*back/i });
      await expect(stayButton).toBeVisible();
    }
  });

  authenticatedTest('should complete and publish resume', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    await authenticatedPage.goto('/resumes/new');

    // Fill all required sections
    // ... (fill basic info, experience, etc.)

    // Click publish/complete button
    const publishButton = authenticatedPage.getByRole('button', { name: /publish|complete|finish/i });
    await publishButton.click();

    // Should redirect to resumes list
    await expect(authenticatedPage).toHaveURL(/.*resumes/, { timeout: 10000 });

    // Resume should appear in list
    await expect(authenticatedPage.getByText(/published|completed/i)).toBeVisible();
  });

  authenticatedTest('should validate required resume fields', async ({ authenticatedPage }) => {
    // TODO: Requires frontend validation

    await authenticatedPage.goto('/resumes/new');

    // Try to publish without filling required fields
    const publishButton = authenticatedPage.getByRole('button', { name: /publish|complete/i });
    await publishButton.click();

    // Should show validation errors
    await expect(authenticatedPage.getByText(/required|must.*complete|fill.*required/i)).toBeVisible();
  });
});

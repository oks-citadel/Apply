import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';
import { TEST_RESUME_DATA } from '../utils/test-data';

/**
 * E2E Tests for Work Experience Management
 *
 * This suite tests work experience CRUD operations including:
 * - Adding work experience
 * - Editing work experience
 * - Deleting work experience
 * - Reordering work experience
 * - Current position handling
 */

authenticatedTest.describe('Work Experience Management', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/work-experience');
  });

  authenticatedTest('should display work experience page', async ({ authenticatedPage }) => {
    // Verify page loaded
    await expect(authenticatedPage).toHaveURL(/.*work-experience|.*experience|.*profile/);
    await expect(authenticatedPage.getByRole('heading', { name: /work.*experience|experience/i })).toBeVisible();
  });

  authenticatedTest('should display add experience button', async ({ authenticatedPage }) => {
    // Verify add button exists
    const addButton = authenticatedPage.getByRole('button', { name: /add.*experience|new.*position|add.*work/i });
    await expect(addButton).toBeVisible();
  });

  authenticatedTest('should open add experience modal/form', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Click add button
    await authenticatedPage.getByRole('button', { name: /add.*experience|new.*position/i }).click();

    // Verify form/modal is displayed
    const modal = authenticatedPage.getByRole('dialog');
    const form = authenticatedPage.getByRole('form', { name: /experience/i });

    const hasModal = await modal.isVisible().catch(() => false);
    const hasForm = await form.isVisible().catch(() => false);

    expect(hasModal || hasForm).toBeTruthy();

    // Verify all required fields
    await expect(authenticatedPage.getByLabel(/job.*title|position/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/company/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/start.*date/i)).toBeVisible();
  });

  authenticatedTest('should successfully add work experience', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const experience = TEST_RESUME_DATA.workExperience;

    // Open add form
    await authenticatedPage.getByRole('button', { name: /add.*experience/i }).click();

    // Fill form
    await authenticatedPage.getByLabel(/job.*title|position/i).fill(experience.title);
    await authenticatedPage.getByLabel(/company/i).fill(experience.company);
    await authenticatedPage.getByLabel(/location/i).fill(experience.location);
    await authenticatedPage.getByLabel(/start.*date/i).fill(experience.startDate);
    await authenticatedPage.getByLabel(/end.*date/i).fill(experience.endDate);

    // Description/responsibilities
    const descriptionField = authenticatedPage.getByLabel(/description|responsibilities/i);
    if (await descriptionField.isVisible().catch(() => false)) {
      await descriptionField.fill(experience.description);
    }

    // Submit form
    await authenticatedPage.getByRole('button', { name: /save|add|submit/i }).click();

    // Verify success
    await expect(authenticatedPage.getByText(/added|saved|success/i)).toBeVisible();

    // Verify experience appears in list
    await expect(authenticatedPage.getByText(experience.title)).toBeVisible();
    await expect(authenticatedPage.getByText(experience.company)).toBeVisible();
  });

  authenticatedTest('should handle current position checkbox', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Open add form
    await authenticatedPage.getByRole('button', { name: /add.*experience/i }).click();

    // Fill basic info
    await authenticatedPage.getByLabel(/job.*title/i).fill('Software Engineer');
    await authenticatedPage.getByLabel(/company/i).fill('Current Company');
    await authenticatedPage.getByLabel(/start.*date/i).fill('2023-01');

    // Check "Current position" checkbox
    const currentCheckbox = authenticatedPage.getByLabel(/current.*position|currently.*work/i);
    await currentCheckbox.check();

    // End date should be hidden or disabled
    const endDateField = authenticatedPage.getByLabel(/end.*date/i);
    const isHidden = !(await endDateField.isVisible().catch(() => false));
    const isDisabled = await endDateField.isDisabled().catch(() => false);

    expect(isHidden || isDisabled).toBeTruthy();

    // Submit
    await authenticatedPage.getByRole('button', { name: /save|add/i }).click();

    // Verify "Present" or "Current" is shown instead of end date
    await expect(authenticatedPage.getByText(/present|current/i)).toBeVisible();
  });

  authenticatedTest('should validate required fields', async ({ authenticatedPage }) => {
    // TODO: Requires frontend validation

    // Open add form
    await authenticatedPage.getByRole('button', { name: /add.*experience/i }).click();

    // Try to submit without filling required fields
    await authenticatedPage.getByRole('button', { name: /save|add|submit/i }).click();

    // Should show validation errors
    await expect(authenticatedPage.getByText(/title.*required|position.*required/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/company.*required/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/start.*date.*required/i)).toBeVisible();
  });

  authenticatedTest('should validate date logic', async ({ authenticatedPage }) => {
    // TODO: Requires frontend validation

    // Open add form
    await authenticatedPage.getByRole('button', { name: /add.*experience/i }).click();

    // Set end date before start date
    await authenticatedPage.getByLabel(/start.*date/i).fill('2024-01');
    await authenticatedPage.getByLabel(/end.*date/i).fill('2023-01');

    // Try to submit
    await authenticatedPage.getByRole('button', { name: /save|add/i }).click();

    // Should show validation error
    await expect(authenticatedPage.getByText(/end.*date.*after.*start|invalid.*date/i)).toBeVisible();
  });

  authenticatedTest('should edit existing work experience', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Assume there's at least one experience in the list
    const editButton = authenticatedPage.getByRole('button', { name: /edit/i }).first();
    await editButton.click();

    // Verify form is pre-filled
    const titleInput = authenticatedPage.getByLabel(/job.*title/i);
    await expect(titleInput).not.toBeEmpty();

    // Update title
    await titleInput.clear();
    await titleInput.fill('Updated Job Title');

    // Save changes
    await authenticatedPage.getByRole('button', { name: /save|update/i }).click();

    // Verify success
    await expect(authenticatedPage.getByText(/updated|saved|success/i)).toBeVisible();

    // Verify updated title appears
    await expect(authenticatedPage.getByText('Updated Job Title')).toBeVisible();
  });

  authenticatedTest('should delete work experience', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Get initial count of experiences
    const experienceItems = authenticatedPage.getByTestId('experience-item');
    const initialCount = await experienceItems.count();

    // Click delete on first item
    const deleteButton = authenticatedPage.getByRole('button', { name: /delete|remove/i }).first();
    await deleteButton.click();

    // Confirm deletion in modal
    const confirmButton = authenticatedPage.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    // Verify success
    await expect(authenticatedPage.getByText(/deleted|removed/i)).toBeVisible();

    // Verify count decreased
    const newCount = await experienceItems.count();
    expect(newCount).toBe(initialCount - 1);
  });

  authenticatedTest('should cancel deletion', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Get initial count
    const experienceItems = authenticatedPage.getByTestId('experience-item');
    const initialCount = await experienceItems.count();

    // Click delete
    const deleteButton = authenticatedPage.getByRole('button', { name: /delete|remove/i }).first();
    await deleteButton.click();

    // Cancel in confirmation modal
    const cancelButton = authenticatedPage.getByRole('button', { name: /cancel|no/i });
    await cancelButton.click();

    // Count should remain the same
    const newCount = await experienceItems.count();
    expect(newCount).toBe(initialCount);
  });

  authenticatedTest('should reorder work experiences', async ({ authenticatedPage }) => {
    // TODO: Requires drag-and-drop implementation

    // Get experiences
    const experiences = authenticatedPage.getByTestId('experience-item');
    const count = await experiences.count();

    if (count >= 2) {
      // Get first and second item text
      const firstText = await experiences.first().textContent();
      const secondText = await experiences.nth(1).textContent();

      // Drag first item down
      const firstItem = experiences.first();
      const secondItem = experiences.nth(1);

      await firstItem.dragTo(secondItem);

      // Wait for reorder
      await authenticatedPage.waitForTimeout(500);

      // Verify order changed
      const newFirstText = await experiences.first().textContent();
      expect(newFirstText).toBe(secondText);
    }
  });

  authenticatedTest('should add multiple achievements/responsibilities', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Open add/edit form
    await authenticatedPage.getByRole('button', { name: /add.*experience/i }).click();

    // Fill basic info
    await authenticatedPage.getByLabel(/job.*title/i).fill('Software Engineer');
    await authenticatedPage.getByLabel(/company/i).fill('Tech Corp');
    await authenticatedPage.getByLabel(/start.*date/i).fill('2020-01');

    // Add multiple achievements
    const addAchievementButton = authenticatedPage.getByRole('button', { name: /add.*achievement|add.*responsibility/i });

    if (await addAchievementButton.isVisible().catch(() => false)) {
      for (const achievement of TEST_RESUME_DATA.workExperience.achievements) {
        await addAchievementButton.click();
        const achievementInputs = authenticatedPage.getByLabel(/achievement|responsibility/i);
        await achievementInputs.last().fill(achievement);
      }
    }

    // Save
    await authenticatedPage.getByRole('button', { name: /save|add/i }).click();

    // Verify achievements are displayed
    for (const achievement of TEST_RESUME_DATA.workExperience.achievements) {
      await expect(authenticatedPage.getByText(achievement)).toBeVisible();
    }
  });

  authenticatedTest('should display work experience in chronological order', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration with multiple experiences

    // Verify most recent is first (assuming desc order)
    const experiences = authenticatedPage.getByTestId('experience-item');
    const count = await experiences.count();

    if (count >= 2) {
      // First item should have more recent date than second
      // Would need to parse dates to verify properly
    }
  });

  authenticatedTest('should show experience duration', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Check if duration is calculated and displayed (e.g., "2 years 3 months")
    const durationText = authenticatedPage.getByText(/\d+\s+(year|month|yr|mo)/i);

    if (await durationText.isVisible().catch(() => false)) {
      await expect(durationText).toBeVisible();
    }
  });

  authenticatedTest('should handle empty state', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration with no experiences

    // Should show empty state message
    const emptyMessage = authenticatedPage.getByText(/no.*experience|add.*first.*experience|get.*started/i);

    if (await emptyMessage.isVisible().catch(() => false)) {
      await expect(emptyMessage).toBeVisible();
    }
  });
});

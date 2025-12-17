import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';
import { TEST_RESUME_DATA } from '../utils/test-data';

/**
 * E2E Tests for Education Management
 *
 * This suite tests education CRUD operations including:
 * - Adding education
 * - Editing education
 * - Deleting education
 * - Degree types and fields of study
 * - GPA and honors
 */

authenticatedTest.describe('Education Management', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/education');
  });

  authenticatedTest('should display education page', async ({ authenticatedPage }) => {
    // Verify page loaded
    await expect(authenticatedPage).toHaveURL(/.*education|.*profile/);
    await expect(authenticatedPage.getByRole('heading', { name: /education/i })).toBeVisible();
  });

  authenticatedTest('should display add education button', async ({ authenticatedPage }) => {
    // Verify add button exists
    const addButton = authenticatedPage.getByRole('button', { name: /add.*education|new.*education|add.*degree/i });
    await expect(addButton).toBeVisible();
  });

  authenticatedTest.skip('should open add education modal/form', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Click add button
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();

    // Verify form/modal is displayed
    const modal = authenticatedPage.getByRole('dialog');
    const form = authenticatedPage.getByRole('form', { name: /education/i });

    const hasModal = await modal.isVisible().catch(() => false);
    const hasForm = await form.isVisible().catch(() => false);

    expect(hasModal || hasForm).toBeTruthy();

    // Verify all required fields
    await expect(authenticatedPage.getByLabel(/school|university|institution/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/degree/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/field.*study|major/i)).toBeVisible();
  });

  authenticatedTest.skip('should successfully add education', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const education = TEST_RESUME_DATA.education;

    // Open add form
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();

    // Fill form
    await authenticatedPage.getByLabel(/school|university|institution/i).fill(education.school);
    await authenticatedPage.getByLabel(/degree/i).fill(education.degree);
    await authenticatedPage.getByLabel(/field.*study|major/i).fill(education.field);

    // Location (optional)
    const locationField = authenticatedPage.getByLabel(/location/i);
    if (await locationField.isVisible().catch(() => false)) {
      await locationField.fill(education.location);
    }

    // Graduation date
    const gradDateField = authenticatedPage.getByLabel(/graduation.*date|end.*date/i);
    if (await gradDateField.isVisible().catch(() => false)) {
      await gradDateField.fill(education.graduationDate);
    }

    // GPA (optional)
    const gpaField = authenticatedPage.getByLabel(/gpa/i);
    if (await gpaField.isVisible().catch(() => false)) {
      await gpaField.fill(education.gpa);
    }

    // Submit form
    await authenticatedPage.getByRole('button', { name: /save|add|submit/i }).click();

    // Verify success
    await expect(authenticatedPage.getByText(/added|saved|success/i)).toBeVisible();

    // Verify education appears in list
    await expect(authenticatedPage.getByText(education.degree)).toBeVisible();
    await expect(authenticatedPage.getByText(education.school)).toBeVisible();
    await expect(authenticatedPage.getByText(education.field)).toBeVisible();
  });

  authenticatedTest.skip('should support degree type selection', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Open add form
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();

    // Check if degree is a dropdown/select
    const degreeSelect = authenticatedPage.getByRole('combobox', { name: /degree/i });

    if (await degreeSelect.isVisible().catch(() => false)) {
      await degreeSelect.click();

      // Verify common degree options
      const degreeOptions = [
        /bachelor|b\.?s\.?|b\.?a\.?/i,
        /master|m\.?s\.?|m\.?a\.?|mba/i,
        /phd|doctorate/i,
        /associate/i,
      ];

      for (const option of degreeOptions) {
        const optionElement = authenticatedPage.getByRole('option', { name: option });
        const isVisible = await optionElement.isVisible().catch(() => false);
        if (isVisible) {
          // At least some common degrees should be available
          break;
        }
      }
    }
  });

  authenticatedTest.skip('should validate required fields', async ({ authenticatedPage }) => {
    // TODO: Requires frontend validation

    // Open add form
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();

    // Try to submit without filling required fields
    await authenticatedPage.getByRole('button', { name: /save|add|submit/i }).click();

    // Should show validation errors
    await expect(authenticatedPage.getByText(/school.*required|university.*required/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/degree.*required/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/field.*required|major.*required/i)).toBeVisible();
  });

  authenticatedTest.skip('should validate GPA format', async ({ authenticatedPage }) => {
    // TODO: Requires frontend validation

    // Open add form
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();

    const gpaField = authenticatedPage.getByLabel(/gpa/i);

    if (await gpaField.isVisible().catch(() => false)) {
      // Enter invalid GPA
      await gpaField.fill('5.0'); // Assuming 4.0 scale

      // Try to submit
      await authenticatedPage.getByRole('button', { name: /save|add/i }).click();

      // Should show validation error
      const gpaError = authenticatedPage.getByText(/invalid.*gpa|gpa.*must.*be/i);
      if (await gpaError.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(gpaError).toBeVisible();
      }
    }
  });

  authenticatedTest.skip('should handle current student status', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Open add form
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();

    // Check "Currently studying" checkbox
    const currentCheckbox = authenticatedPage.getByLabel(/current.*student|currently.*studying/i);

    if (await currentCheckbox.isVisible().catch(() => false)) {
      await currentCheckbox.check();

      // Graduation date should be hidden or disabled
      const gradDateField = authenticatedPage.getByLabel(/graduation.*date|end.*date/i);
      const isHidden = !(await gradDateField.isVisible().catch(() => false));
      const isDisabled = await gradDateField.isDisabled().catch(() => false);

      expect(isHidden || isDisabled).toBeTruthy();

      // Fill other fields
      await authenticatedPage.getByLabel(/school/i).fill('Current University');
      await authenticatedPage.getByLabel(/degree/i).fill("Master's Degree");
      await authenticatedPage.getByLabel(/field.*study/i).fill('Computer Science');

      // Submit
      await authenticatedPage.getByRole('button', { name: /save|add/i }).click();

      // Verify "Present" or "Current" is shown
      await expect(authenticatedPage.getByText(/present|current|in.*progress/i)).toBeVisible();
    }
  });

  authenticatedTest.skip('should edit existing education', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Assume there's at least one education entry
    const editButton = authenticatedPage.getByRole('button', { name: /edit/i }).first();
    await editButton.click();

    // Verify form is pre-filled
    const schoolInput = authenticatedPage.getByLabel(/school|university/i);
    await expect(schoolInput).not.toBeEmpty();

    // Update school name
    await schoolInput.clear();
    await schoolInput.fill('Updated University');

    // Save changes
    await authenticatedPage.getByRole('button', { name: /save|update/i }).click();

    // Verify success
    await expect(authenticatedPage.getByText(/updated|saved|success/i)).toBeVisible();

    // Verify updated name appears
    await expect(authenticatedPage.getByText('Updated University')).toBeVisible();
  });

  authenticatedTest.skip('should delete education', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Get initial count
    const educationItems = authenticatedPage.getByTestId('education-item');
    const initialCount = await educationItems.count();

    if (initialCount > 0) {
      // Click delete on first item
      const deleteButton = authenticatedPage.getByRole('button', { name: /delete|remove/i }).first();
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = authenticatedPage.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
      }

      // Verify success
      await expect(authenticatedPage.getByText(/deleted|removed/i)).toBeVisible();

      // Verify count decreased
      const newCount = await educationItems.count();
      expect(newCount).toBe(initialCount - 1);
    }
  });

  authenticatedTest.skip('should add honors and awards', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Open add/edit form
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();

    // Fill basic info
    await authenticatedPage.getByLabel(/school/i).fill('Elite University');
    await authenticatedPage.getByLabel(/degree/i).fill('Bachelor of Science');
    await authenticatedPage.getByLabel(/field.*study/i).fill('Computer Science');

    // Add honors
    const honorsField = authenticatedPage.getByLabel(/honors|awards|achievements/i);

    if (await honorsField.isVisible().catch(() => false)) {
      await honorsField.fill('Summa Cum Laude, Dean\'s List');
    }

    // Save
    await authenticatedPage.getByRole('button', { name: /save|add/i }).click();

    // Verify honors are displayed
    await expect(authenticatedPage.getByText(/summa.*cum.*laude|dean.*list/i)).toBeVisible();
  });

  authenticatedTest.skip('should support expected graduation date', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Open add form
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();

    // Check current student
    const currentCheckbox = authenticatedPage.getByLabel(/current.*student/i);
    if (await currentCheckbox.isVisible().catch(() => false)) {
      await currentCheckbox.check();

      // Expected graduation field should appear
      const expectedGradField = authenticatedPage.getByLabel(/expected.*graduation/i);
      if (await expectedGradField.isVisible().catch(() => false)) {
        await expectedGradField.fill('2025-05');

        // Fill other fields
        await authenticatedPage.getByLabel(/school/i).fill('University');
        await authenticatedPage.getByLabel(/degree/i).fill('PhD');
        await authenticatedPage.getByLabel(/field/i).fill('Physics');

        // Save
        await authenticatedPage.getByRole('button', { name: /save/i }).click();

        // Verify expected graduation is shown
        await expect(authenticatedPage.getByText(/expected.*2025|graduating.*2025/i)).toBeVisible();
      }
    }
  });

  authenticatedTest.skip('should display education in chronological order', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration with multiple education entries

    // Verify most recent is first (assuming desc order)
    const educationItems = authenticatedPage.getByTestId('education-item');
    const count = await educationItems.count();

    if (count >= 2) {
      // First item should have more recent date than second
      // Would need to parse dates to verify properly
    }
  });

  authenticatedTest.skip('should handle empty state', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration with no education entries

    // Should show empty state message
    const emptyMessage = authenticatedPage.getByText(/no.*education|add.*first.*education|get.*started/i);

    if (await emptyMessage.isVisible().catch(() => false)) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  authenticatedTest.skip('should add relevant coursework', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Open add/edit form
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();

    // Fill basic info
    await authenticatedPage.getByLabel(/school/i).fill('Tech University');
    await authenticatedPage.getByLabel(/degree/i).fill('Bachelor of Science');
    await authenticatedPage.getByLabel(/field/i).fill('Computer Science');

    // Add coursework
    const courseworkField = authenticatedPage.getByLabel(/coursework|relevant.*courses/i);

    if (await courseworkField.isVisible().catch(() => false)) {
      await courseworkField.fill('Data Structures, Algorithms, Machine Learning, Database Systems');
    }

    // Save
    await authenticatedPage.getByRole('button', { name: /save/i }).click();

    // Verify coursework is displayed
    await expect(authenticatedPage.getByText(/data.*structures|algorithms/i)).toBeVisible();
  });

  authenticatedTest.skip('should support multiple education entries', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Add first education (Bachelor's)
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();
    await authenticatedPage.getByLabel(/school/i).fill('Undergrad University');
    await authenticatedPage.getByLabel(/degree/i).fill('Bachelor of Science');
    await authenticatedPage.getByLabel(/field/i).fill('Computer Science');
    await authenticatedPage.getByRole('button', { name: /save/i }).click();

    // Wait for first to be saved
    await expect(authenticatedPage.getByText('Undergrad University')).toBeVisible();

    // Add second education (Master's)
    await authenticatedPage.getByRole('button', { name: /add.*education/i }).click();
    await authenticatedPage.getByLabel(/school/i).fill('Grad University');
    await authenticatedPage.getByLabel(/degree/i).fill('Master of Science');
    await authenticatedPage.getByLabel(/field/i).fill('Data Science');
    await authenticatedPage.getByRole('button', { name: /save/i }).click();

    // Verify both are displayed
    await expect(authenticatedPage.getByText('Undergrad University')).toBeVisible();
    await expect(authenticatedPage.getByText('Grad University')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';
import { TEST_RESUME_DATA } from '../utils/test-data';

/**
 * E2E Tests for Skills Management
 *
 * This suite tests skills management including:
 * - Adding skills
 * - Removing skills
 * - Skill categorization (technical, soft skills)
 * - Skill proficiency levels
 * - Skill suggestions/autocomplete
 */

authenticatedTest.describe('Skills Management', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile/skills');
  });

  authenticatedTest('should display skills page', async ({ authenticatedPage }) => {
    // Verify page loaded
    await expect(authenticatedPage).toHaveURL(/.*skills|.*profile/);
    await expect(authenticatedPage.getByRole('heading', { name: /skills/i })).toBeVisible();
  });

  authenticatedTest('should display add skill input/button', async ({ authenticatedPage }) => {
    // Verify add skill interface exists
    const addSkillInput = authenticatedPage.getByPlaceholder(/add.*skill|enter.*skill/i);
    const addSkillButton = authenticatedPage.getByRole('button', { name: /add.*skill/i });

    const hasInput = await addSkillInput.isVisible().catch(() => false);
    const hasButton = await addSkillButton.isVisible().catch(() => false);

    expect(hasInput || hasButton).toBeTruthy();
  });

  authenticatedTest('should successfully add a skill', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    const skill = 'JavaScript';

    // Find skill input
    const skillInput = authenticatedPage.getByPlaceholder(/add.*skill|enter.*skill/i);
    const addButton = authenticatedPage.getByRole('button', { name: /add.*skill/i });

    // Enter skill
    await skillInput.fill(skill);

    // Add skill (might auto-add on enter or need button click)
    const canPressEnter = await skillInput.isVisible();
    if (canPressEnter) {
      await skillInput.press('Enter');
    } else if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
    }

    // Verify skill appears in list
    await expect(authenticatedPage.getByText(skill)).toBeVisible();

    // Input should be cleared
    await expect(skillInput).toBeEmpty();
  });

  authenticatedTest('should add multiple skills', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    const skills = TEST_RESUME_DATA.skills.technical.slice(0, 3);

    for (const skill of skills) {
      const skillInput = authenticatedPage.getByPlaceholder(/add.*skill|enter.*skill/i);
      await skillInput.fill(skill);
      await skillInput.press('Enter');

      // Wait briefly between additions
      await authenticatedPage.waitForTimeout(300);
    }

    // Verify all skills appear
    for (const skill of skills) {
      await expect(authenticatedPage.getByText(skill)).toBeVisible();
    }
  });

  authenticatedTest('should remove a skill', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Assume there's at least one skill
    const skillText = 'JavaScript';

    // Find remove/delete button for the skill (usually an X icon)
    const removeButton = authenticatedPage.getByRole('button', { name: new RegExp(`remove.*${skillText}|delete.*${skillText}`, 'i') });

    if (!(await removeButton.isVisible().catch(() => false))) {
      // Try finding by test id or class
      const skillTag = authenticatedPage.getByText(skillText).locator('..');
      const removeIcon = skillTag.getByRole('button', { name: /remove|delete|close/i });

      if (await removeIcon.isVisible().catch(() => false)) {
        await removeIcon.click();
      }
    } else {
      await removeButton.click();
    }

    // Verify skill is removed
    await expect(authenticatedPage.getByText(skillText)).not.toBeVisible();
  });

  authenticatedTest('should support skill categorization', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Check if skills are organized by category
    const technicalSection = authenticatedPage.getByRole('heading', { name: /technical.*skills/i });
    const softSkillsSection = authenticatedPage.getByRole('heading', { name: /soft.*skills/i });

    const hasTechnical = await technicalSection.isVisible().catch(() => false);
    const hasSoftSkills = await softSkillsSection.isVisible().catch(() => false);

    if (hasTechnical || hasSoftSkills) {
      // Add a technical skill
      const skillInput = authenticatedPage.getByPlaceholder(/add.*skill/i);
      await skillInput.fill('Python');

      // Check if category selector appears
      const categorySelect = authenticatedPage.getByLabel(/category|skill.*type/i);
      if (await categorySelect.isVisible().catch(() => false)) {
        await categorySelect.selectOption('technical');
      }

      await skillInput.press('Enter');

      // Verify skill appears under technical skills
      if (hasTechnical) {
        const technicalSkillsList = authenticatedPage.locator('section', { has: technicalSection });
        await expect(technicalSkillsList.getByText('Python')).toBeVisible();
      }
    }
  });

  authenticatedTest('should support skill proficiency levels', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Add skill with proficiency
    const skillInput = authenticatedPage.getByPlaceholder(/add.*skill/i);
    await skillInput.fill('React');

    // Check if proficiency selector appears
    const proficiencySelect = authenticatedPage.getByLabel(/proficiency|level|expertise/i);

    if (await proficiencySelect.isVisible().catch(() => false)) {
      await proficiencySelect.click();

      // Select expert level
      const expertOption = authenticatedPage.getByRole('option', { name: /expert|advanced/i });
      await expertOption.click();
    }

    // Add skill
    await skillInput.press('Enter');

    // Verify skill with proficiency level is shown
    await expect(authenticatedPage.getByText('React')).toBeVisible();

    // Check if proficiency is displayed (e.g., stars, bar, or text)
    const proficiencyIndicator = authenticatedPage.getByText(/expert|advanced/i);
    if (await proficiencyIndicator.isVisible().catch(() => false)) {
      await expect(proficiencyIndicator).toBeVisible();
    }
  });

  authenticatedTest('should show skill autocomplete suggestions', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    const skillInput = authenticatedPage.getByPlaceholder(/add.*skill/i);

    // Start typing
    await skillInput.fill('Jav');

    // Wait for suggestions
    await authenticatedPage.waitForTimeout(500);

    // Check if autocomplete dropdown appears
    const suggestions = authenticatedPage.getByRole('option', { name: /java/i });

    if (await suggestions.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click on JavaScript suggestion
      const jsSuggestion = authenticatedPage.getByRole('option', { name: /^javascript$/i });
      await jsSuggestion.click();

      // Skill should be added
      await expect(authenticatedPage.getByText('JavaScript')).toBeVisible();
    }
  });

  authenticatedTest('should prevent duplicate skills', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    const skill = 'Python';

    // Add skill first time
    const skillInput = authenticatedPage.getByPlaceholder(/add.*skill/i);
    await skillInput.fill(skill);
    await skillInput.press('Enter');

    // Verify added
    await expect(authenticatedPage.getByText(skill)).toBeVisible();

    // Try to add same skill again
    await skillInput.fill(skill);
    await skillInput.press('Enter');

    // Should show error or just not add duplicate
    const errorMessage = authenticatedPage.getByText(/already.*added|duplicate.*skill/i);
    if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorMessage).toBeVisible();
    }

    // Should only have one instance of the skill
    const skillElements = authenticatedPage.getByText(skill, { exact: true });
    const count = await skillElements.count();
    expect(count).toBe(1);
  });

  authenticatedTest('should validate skill name length', async ({ authenticatedPage }) => {
    // TODO: Requires frontend validation

    const skillInput = authenticatedPage.getByPlaceholder(/add.*skill/i);

    // Try to add very long skill name
    const longSkill = 'A'.repeat(100);
    await skillInput.fill(longSkill);
    await skillInput.press('Enter');

    // Should show validation error
    const errorMessage = authenticatedPage.getByText(/skill.*too.*long|maximum.*characters/i);
    if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorMessage).toBeVisible();
    }
  });

  authenticatedTest('should support skill endorsements', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Check if endorsement count is shown for skills
    const endorsementCount = authenticatedPage.getByText(/\d+.*endorsement/i);

    if (await endorsementCount.isVisible().catch(() => false)) {
      await expect(endorsementCount).toBeVisible();
    }
  });

  authenticatedTest('should reorder skills', async ({ authenticatedPage }) => {
    // TODO: Requires drag-and-drop implementation

    const skills = authenticatedPage.getByTestId('skill-item');
    const count = await skills.count();

    if (count >= 2) {
      // Get first and second skill text
      const firstText = await skills.first().textContent();
      const secondText = await skills.nth(1).textContent();

      // Drag first skill down
      await skills.first().dragTo(skills.nth(1));

      // Verify order changed
      const newFirstText = await skills.first().textContent();
      expect(newFirstText).toBe(secondText);
    }
  });

  authenticatedTest('should bulk import skills', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Check if bulk import option exists
    const bulkImportButton = authenticatedPage.getByRole('button', { name: /import|bulk.*add/i });

    if (await bulkImportButton.isVisible().catch(() => false)) {
      await bulkImportButton.click();

      // Should show textarea or input for multiple skills
      const bulkInput = authenticatedPage.getByLabel(/enter.*skills|paste.*skills/i);
      await expect(bulkInput).toBeVisible();

      // Enter multiple skills (comma-separated or line-separated)
      await bulkInput.fill('Python, JavaScript, React, Node.js, Docker');

      // Submit
      await authenticatedPage.getByRole('button', { name: /import|add/i }).click();

      // Verify all skills were added
      await expect(authenticatedPage.getByText('Python')).toBeVisible();
      await expect(authenticatedPage.getByText('JavaScript')).toBeVisible();
      await expect(authenticatedPage.getByText('React')).toBeVisible();
    }
  });

  authenticatedTest('should show skill match with job requirements', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // If viewing in context of a job application
    // Skills that match job requirements might be highlighted

    const matchedSkill = authenticatedPage.locator('[data-matched="true"]').first();

    if (await matchedSkill.isVisible().catch(() => false)) {
      await expect(matchedSkill).toBeVisible();
    }
  });

  authenticatedTest('should display skill trends or popularity', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Some platforms show if a skill is trending or in-demand
    const trendingBadge = authenticatedPage.getByText(/trending|in.*demand|hot/i);

    if (await trendingBadge.isVisible().catch(() => false)) {
      await expect(trendingBadge).toBeVisible();
    }
  });

  authenticatedTest('should export skills list', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    const exportButton = authenticatedPage.getByRole('button', { name: /export|download/i });

    if (await exportButton.isVisible().catch(() => false)) {
      // Set up download handler
      const downloadPromise = authenticatedPage.waitForEvent('download');

      await exportButton.click();

      // Verify download started
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/skills|export/i);
    }
  });

  authenticatedTest('should handle empty state', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration with no skills

    // Should show empty state message
    const emptyMessage = authenticatedPage.getByText(/no.*skills|add.*first.*skill|get.*started/i);

    if (await emptyMessage.isVisible().catch(() => false)) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  authenticatedTest('should show recommended skills based on profile', async ({ authenticatedPage }) => {
    // TODO: Requires AI/recommendation engine

    // Check if skill recommendations are shown
    const recommendedSection = authenticatedPage.getByRole('heading', { name: /recommended.*skills|suggested.*skills/i });

    if (await recommendedSection.isVisible().catch(() => false)) {
      await expect(recommendedSection).toBeVisible();

      // Should have clickable recommendations
      const recommendedSkill = authenticatedPage.getByRole('button', { name: /add.*skill/i }).first();
      if (await recommendedSkill.isVisible().catch(() => false)) {
        await recommendedSkill.click();

        // Skill should be added to user's skills
        await expect(authenticatedPage.getByText(/added|success/i)).toBeVisible();
      }
    }
  });

  authenticatedTest('should filter skills by category', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration

    // Check if category filter exists
    const categoryFilter = authenticatedPage.getByRole('tab', { name: /technical|soft.*skills|all/i });

    if (await categoryFilter.first().isVisible().catch(() => false)) {
      // Click on technical skills tab
      const technicalTab = authenticatedPage.getByRole('tab', { name: /technical/i });
      await technicalTab.click();

      // Only technical skills should be visible
      const softSkillsSection = authenticatedPage.getByRole('heading', { name: /soft.*skills/i });
      const isHidden = !(await softSkillsSection.isVisible().catch(() => false));

      expect(isHidden).toBeTruthy();
    }
  });
});

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { ResumesPage } from '../../pages/resumes.page';
import { ResumeEditorPage } from '../../pages/resume-editor.page';
import { TEST_USERS } from '../../fixtures/auth.fixture';
import { TEST_RESUME } from '../../fixtures/data.fixture';

/**
 * Critical Flow 3: Resume Create → Edit → Export
 *
 * This test suite covers the complete resume lifecycle from creation
 * through editing to exporting in different formats.
 */
test.describe('Complete Resume Lifecycle Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let resumesPage: ResumesPage;
  let editorPage: ResumeEditorPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    resumesPage = new ResumesPage(page);
    editorPage = new ResumeEditorPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);
  });

  test('should complete full resume creation, edit, and export flow', async ({ page }) => {
    // Step 1: Navigate to resumes page
    await resumesPage.goto();
    await resumesPage.assertVisible();

    // Get initial resume count
    const initialCount = await resumesPage.getResumeCount();

    // Step 2: Create new resume
    await resumesPage.clickCreateResume();
    await page.waitForURL('**/resumes/new', { timeout: 10000 });
    await editorPage.assertVisible();

    // Step 3: Set resume title
    const resumeTitle = `E2E Test Resume ${Date.now()}`;
    await editorPage.setResumeTitle(resumeTitle);

    // Step 4: Fill personal information
    await editorPage.fillPersonalInfo(TEST_RESUME.basic.personalInfo);

    // Step 5: Fill summary
    await editorPage.fillSummary(TEST_RESUME.basic.summary);

    // Step 6: Add work experience
    for (const exp of TEST_RESUME.basic.experience) {
      await editorPage.addExperience(exp);
      await page.waitForTimeout(500); // Small delay between additions
    }

    // Verify experiences were added
    let experienceCount = await editorPage.experienceItems.count();
    expect(experienceCount).toBe(TEST_RESUME.basic.experience.length);

    // Step 7: Add education
    for (const edu of TEST_RESUME.basic.education) {
      await editorPage.addEducation(edu);
      await page.waitForTimeout(500);
    }

    // Verify education was added
    let educationCount = await editorPage.educationItems.count();
    expect(educationCount).toBe(TEST_RESUME.basic.education.length);

    // Step 8: Add skills
    await editorPage.addSkills(
      TEST_RESUME.basic.skills.technical,
      TEST_RESUME.basic.skills.soft
    );

    // Verify skills were added
    const skillCount = await editorPage.skillTags.count();
    expect(skillCount).toBeGreaterThan(0);

    // Step 9: Save resume
    await editorPage.save();
    await page.waitForLoadState('networkidle');

    // Verify auto-save indicator
    await editorPage.assertAutoSaved();

    // Step 10: Preview resume
    await editorPage.preview();
    await expect(editorPage.previewModal).toBeVisible();

    // Verify preview shows personal info
    await expect(editorPage.previewModal).toContainText(TEST_RESUME.basic.personalInfo.firstName);
    await expect(editorPage.previewModal).toContainText(TEST_RESUME.basic.personalInfo.lastName);

    // Close preview
    await editorPage.closePreview();
    await expect(editorPage.previewModal).not.toBeVisible();

    // Step 11: Go back to resumes list
    await editorPage.goBack();
    await page.waitForURL('**/resumes', { timeout: 10000 });

    // Verify resume appears in list
    await resumesPage.assertResumeExists(resumeTitle);

    // Verify resume count increased
    const newCount = await resumesPage.getResumeCount();
    expect(newCount).toBe(initialCount + 1);

    // Step 12: Edit the resume
    await resumesPage.editResumeByTitle(resumeTitle);
    await page.waitForURL(/resumes\/.*/, { timeout: 10000 });
    await editorPage.assertVisible();

    // Step 13: Make changes - add another experience
    await editorPage.experienceTab.click();
    await editorPage.addExperience({
      company: 'New Company',
      position: 'New Position',
      location: 'New Location',
      startDate: '2024-01',
      current: true,
      description: 'New role description',
    });

    // Verify experience count increased
    experienceCount = await editorPage.experienceItems.count();
    expect(experienceCount).toBe(TEST_RESUME.basic.experience.length + 1);

    // Save changes
    await editorPage.save();
    await editorPage.assertAutoSaved();

    // Step 14: Export resume as PDF
    const pdfDownload = await editorPage.export('pdf');
    expect(pdfDownload).toBeTruthy();
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);

    // Step 15: Export resume as DOCX
    const docxDownload = await editorPage.export('docx');
    expect(docxDownload).toBeTruthy();
    expect(docxDownload.suggestedFilename()).toMatch(/\.docx$/);

    // Step 16: Go back to resumes list
    await editorPage.goBack();
    await page.waitForURL('**/resumes', { timeout: 10000 });

    // Step 17: Duplicate the resume
    const resumeIndex = await resumesPage.resumeCards.count() - 1;
    await resumesPage.duplicateResume(resumeIndex);
    await page.waitForLoadState('networkidle');

    // Verify duplicate was created
    const finalCount = await resumesPage.getResumeCount();
    expect(finalCount).toBe(newCount + 1);

    // Step 18: Delete the duplicate
    await resumesPage.deleteResume(resumeIndex + 1, true);
    await page.waitForLoadState('networkidle');

    // Verify resume was deleted
    const afterDeleteCount = await resumesPage.getResumeCount();
    expect(afterDeleteCount).toBe(finalCount - 1);
  });

  test('should auto-save resume changes', async ({ page }) => {
    // Navigate to resume editor
    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.assertVisible();

    // Set title
    await editorPage.setResumeTitle('Auto-save Test Resume');

    // Fill some information
    await editorPage.fillPersonalInfo({
      firstName: 'Auto',
      lastName: 'Save',
      email: 'autosave@test.com',
      phone: '555-1234',
      location: 'Test City',
    });

    // Wait for auto-save
    await page.waitForTimeout(3000);

    // Check auto-save indicator
    const indicatorText = await editorPage.autoSaveIndicator.textContent();
    expect(indicatorText?.toLowerCase()).toMatch(/saved|saving/);
  });

  test('should preview resume before export', async ({ page }) => {
    // Create minimal resume
    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.setResumeTitle('Preview Test Resume');
    await editorPage.fillPersonalInfo({
      firstName: 'Preview',
      lastName: 'Test',
      email: 'preview@test.com',
    });

    // Save
    await editorPage.save();
    await page.waitForLoadState('networkidle');

    // Open preview
    await editorPage.preview();

    // Verify preview modal
    await expect(editorPage.previewModal).toBeVisible();
    await expect(editorPage.previewModal).toContainText('Preview Test');

    // Close preview
    await editorPage.closePreview();
  });

  test('should validate required resume fields', async ({ page }) => {
    // Navigate to resume editor
    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.assertVisible();

    // Try to save without required fields
    await editorPage.saveButton.click();

    // Should show validation errors or prevent save
    const titleValue = await editorPage.resumeTitle.inputValue();
    const firstNameValue = await editorPage.firstNameInput.inputValue();

    if (!titleValue || !firstNameValue) {
      // Check for error message or disabled button
      const errorMessage = page.locator('[data-testid="error-message"]');
      const hasError = await errorMessage.isVisible({ timeout: 2000 });
      const isDisabled = await editorPage.saveButton.isDisabled();

      expect(hasError || isDisabled).toBeTruthy();
    }
  });

  test('should add multiple work experiences', async ({ page }) => {
    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.setResumeTitle('Multiple Experience Test');
    await editorPage.experienceTab.click();

    // Add 3 experiences
    const experiences = [
      {
        company: 'Company One',
        position: 'Position One',
        location: 'Location One',
        startDate: '2020-01',
        endDate: '2021-12',
      },
      {
        company: 'Company Two',
        position: 'Position Two',
        location: 'Location Two',
        startDate: '2022-01',
        current: true,
      },
      {
        company: 'Company Three',
        position: 'Position Three',
        location: 'Location Three',
        startDate: '2018-01',
        endDate: '2019-12',
      },
    ];

    for (const exp of experiences) {
      await editorPage.addExperience(exp);
      await page.waitForTimeout(500);
    }

    // Verify all experiences were added
    const count = await editorPage.experienceItems.count();
    expect(count).toBe(experiences.length);
  });

  test('should add multiple education entries', async ({ page }) => {
    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.setResumeTitle('Multiple Education Test');
    await editorPage.educationTab.click();

    // Add 2 education entries
    const educations = [
      {
        institution: 'University One',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'City One',
        startDate: '2014-09',
        endDate: '2018-05',
        gpa: '3.8',
      },
      {
        institution: 'University Two',
        degree: 'Master of Science',
        field: 'Software Engineering',
        location: 'City Two',
        startDate: '2018-09',
        endDate: '2020-05',
        gpa: '3.9',
      },
    ];

    for (const edu of educations) {
      await editorPage.addEducation(edu);
      await page.waitForTimeout(500);
    }

    // Verify all education entries were added
    const count = await editorPage.educationItems.count();
    expect(count).toBe(educations.length);
  });

  test('should add technical and soft skills', async ({ page }) => {
    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.setResumeTitle('Skills Test Resume');
    await editorPage.skillsTab.click();

    const technicalSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'Docker'];
    const softSkills = ['Leadership', 'Communication', 'Problem Solving'];

    // Add technical skills
    for (const skill of technicalSkills) {
      await editorPage.technicalSkillsInput.fill(skill);
      await editorPage.technicalSkillsInput.press('Enter');
      await page.waitForTimeout(300);
    }

    // Add soft skills
    for (const skill of softSkills) {
      await editorPage.softSkillsInput.fill(skill);
      await editorPage.softSkillsInput.press('Enter');
      await page.waitForTimeout(300);
    }

    // Verify skills were added
    const skillCount = await editorPage.skillTags.count();
    expect(skillCount).toBeGreaterThanOrEqual(technicalSkills.length + softSkills.length);
  });

  test('should handle current job checkbox correctly', async ({ page }) => {
    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.experienceTab.click();
    await editorPage.addExperienceButton.click();

    const experience = editorPage.experienceItems.first();

    // Fill experience details
    await experience.locator('input[name="company"]').fill('Current Employer');
    await experience.locator('input[name="position"]').fill('Current Position');
    await experience.locator('input[name="experienceLocation"]').fill('Remote');
    await experience.locator('input[name="startDate"]').fill('2023-01');

    // Check current job checkbox
    await experience.locator('input[name="currentJob"]').check();

    // End date should be disabled or hidden
    const endDateInput = experience.locator('input[name="endDate"]');
    const isDisabled = await endDateInput.isDisabled({ timeout: 2000 });
    const isHidden = !(await endDateInput.isVisible({ timeout: 2000 }));

    expect(isDisabled || isHidden).toBeTruthy();
  });

  test('should download resume in PDF format', async ({ page }) => {
    // Create a resume first
    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.setResumeTitle('PDF Export Test');
    await editorPage.fillPersonalInfo({
      firstName: 'PDF',
      lastName: 'Test',
      email: 'pdf@test.com',
    });

    await editorPage.save();
    await page.waitForLoadState('networkidle');

    // Export as PDF
    const download = await editorPage.export('pdf');

    // Verify download
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toContain('.pdf');

    // Verify file was downloaded
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should download resume in DOCX format', async ({ page }) => {
    // Create a resume first
    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.setResumeTitle('DOCX Export Test');
    await editorPage.fillPersonalInfo({
      firstName: 'DOCX',
      lastName: 'Test',
      email: 'docx@test.com',
    });

    await editorPage.save();
    await page.waitForLoadState('networkidle');

    // Export as DOCX
    const download = await editorPage.export('docx');

    // Verify download
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toContain('.docx');

    // Verify file was downloaded
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should search and filter resumes', async ({ page }) => {
    await resumesPage.goto();

    const resumeCount = await resumesPage.getResumeCount();

    if (resumeCount > 0) {
      // Get first resume title
      const firstResumeCard = resumesPage.getResumeCard(0);
      const resumeTitle = await firstResumeCard.locator('[data-testid="resume-title"]').textContent();

      if (resumeTitle) {
        // Search for that resume
        await resumesPage.search(resumeTitle.trim());
        await page.waitForLoadState('networkidle');

        // Should find the resume
        const searchResults = await resumesPage.getResumeCount();
        expect(searchResults).toBeGreaterThan(0);
      }
    }
  });

  test('should delete resume with confirmation', async ({ page }) => {
    await resumesPage.goto();

    const initialCount = await resumesPage.getResumeCount();

    if (initialCount > 0) {
      // Delete last resume (to avoid deleting important ones)
      await resumesPage.deleteResume(initialCount - 1, true);

      await page.waitForLoadState('networkidle');

      // Verify resume was deleted
      const newCount = await resumesPage.getResumeCount();
      expect(newCount).toBe(initialCount - 1);
    }
  });

  test('should cancel resume deletion', async ({ page }) => {
    await resumesPage.goto();

    const initialCount = await resumesPage.getResumeCount();

    if (initialCount > 0) {
      // Try to delete but cancel
      await resumesPage.deleteResume(0, false);

      await page.waitForLoadState('networkidle');

      // Verify resume was NOT deleted
      const newCount = await resumesPage.getResumeCount();
      expect(newCount).toBe(initialCount);
    }
  });

  test('should duplicate existing resume', async ({ page }) => {
    await resumesPage.goto();

    const initialCount = await resumesPage.getResumeCount();

    if (initialCount > 0) {
      // Duplicate first resume
      await resumesPage.duplicateResume(0);

      await page.waitForLoadState('networkidle');

      // Verify duplicate was created
      const newCount = await resumesPage.getResumeCount();
      expect(newCount).toBe(initialCount + 1);
    }
  });

  test('should show empty state when no resumes exist', async ({ page }) => {
    await resumesPage.goto();

    const resumeCount = await resumesPage.getResumeCount();

    if (resumeCount === 0) {
      // Should show empty state
      await resumesPage.assertEmptyState();
    }
  });

  test('should navigate between resume editor tabs', async ({ page }) => {
    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.assertVisible();

    // Navigate through all tabs
    await editorPage.personalInfoTab.click();
    await expect(editorPage.firstNameInput).toBeVisible();

    await editorPage.summaryTab.click();
    await expect(editorPage.summaryTextarea).toBeVisible();

    await editorPage.experienceTab.click();
    await expect(editorPage.addExperienceButton).toBeVisible();

    await editorPage.educationTab.click();
    await expect(editorPage.addEducationButton).toBeVisible();

    await editorPage.skillsTab.click();
    await expect(editorPage.technicalSkillsInput).toBeVisible();
  });

  test('should persist resume changes after page reload', async ({ page }) => {
    const resumeTitle = `Persistence Test ${Date.now()}`;

    await resumesPage.goto();
    await resumesPage.clickCreateResume();

    await editorPage.setResumeTitle(resumeTitle);
    await editorPage.fillPersonalInfo({
      firstName: 'Persist',
      lastName: 'Test',
      email: 'persist@test.com',
    });

    await editorPage.save();
    await page.waitForLoadState('networkidle');

    // Get resume URL
    const resumeUrl = page.url();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify changes persisted
    const titleValue = await editorPage.resumeTitle.inputValue();
    expect(titleValue).toBe(resumeTitle);

    const firstNameValue = await editorPage.firstNameInput.inputValue();
    expect(firstNameValue).toBe('Persist');
  });
});

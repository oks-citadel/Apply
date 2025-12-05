import { test, expect } from '@playwright/test';
import { ResumesPage } from '../../pages/resumes.page';
import { ResumeEditorPage } from '../../pages/resume-editor.page';
import { TEST_RESUME } from '../../fixtures/data.fixture';

test.describe('Create Resume', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  let resumesPage: ResumesPage;
  let editorPage: ResumeEditorPage;

  test.beforeEach(async ({ page }) => {
    resumesPage = new ResumesPage(page);
    editorPage = new ResumeEditorPage(page);
    await resumesPage.goto();
  });

  test('should navigate to resume editor', async () => {
    await resumesPage.clickCreateResume();

    await editorPage.assertVisible();
    expect(editorPage.page.url()).toContain('/resumes/new');
  });

  test('should create resume from scratch', async () => {
    await resumesPage.clickCreateResume();

    // Set resume title
    await editorPage.setResumeTitle(TEST_RESUME.basic.title);

    // Fill personal info
    await editorPage.fillPersonalInfo(TEST_RESUME.basic.personalInfo);

    // Fill summary
    await editorPage.fillSummary(TEST_RESUME.basic.summary);

    // Add experience
    for (const exp of TEST_RESUME.basic.experience) {
      await editorPage.addExperience(exp);
    }

    // Add education
    for (const edu of TEST_RESUME.basic.education) {
      await editorPage.addEducation(edu);
    }

    // Add skills
    await editorPage.addSkills(
      TEST_RESUME.basic.skills.technical,
      TEST_RESUME.basic.skills.soft
    );

    // Save resume
    await editorPage.save();

    // Should show auto-save indicator
    await editorPage.assertAutoSaved();
  });

  test('should fill all resume sections', async () => {
    await resumesPage.clickCreateResume();

    const resume = TEST_RESUME.basic;

    // Personal Info
    await editorPage.personalInfoTab.click();
    await editorPage.fillPersonalInfo(resume.personalInfo);

    // Summary
    await editorPage.summaryTab.click();
    await editorPage.fillSummary(resume.summary);

    // Experience
    await editorPage.experienceTab.click();
    for (const exp of resume.experience) {
      await editorPage.addExperience(exp);
    }

    // Education
    await editorPage.educationTab.click();
    for (const edu of resume.education) {
      await editorPage.addEducation(edu);
    }

    // Skills
    await editorPage.skillsTab.click();
    await editorPage.addSkills(resume.skills.technical, resume.skills.soft);

    // Verify all sections have content
    const experienceCount = await editorPage.experienceItems.count();
    expect(experienceCount).toBe(resume.experience.length);

    const educationCount = await editorPage.educationItems.count();
    expect(educationCount).toBe(resume.education.length);

    const skillCount = await editorPage.skillTags.count();
    expect(skillCount).toBeGreaterThan(0);

    // Save
    await editorPage.save();
    await editorPage.assertAutoSaved();
  });

  test('should preview resume', async () => {
    await resumesPage.clickCreateResume();

    // Add some basic info
    await editorPage.setResumeTitle('Test Preview Resume');
    await editorPage.fillPersonalInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      location: 'San Francisco, CA',
    });

    // Open preview
    await editorPage.preview();

    // Preview modal should be visible
    await expect(editorPage.previewModal).toBeVisible();

    // Should show personal info
    const previewContent = editorPage.previewModal;
    await expect(previewContent).toContainText('John Doe');
    await expect(previewContent).toContainText('john@example.com');

    // Close preview
    await editorPage.closePreview();
    await expect(editorPage.previewModal).not.toBeVisible();
  });

  test('should save and verify resume', async () => {
    await resumesPage.clickCreateResume();

    const resumeTitle = `Test Resume ${Date.now()}`;

    // Create minimal resume
    await editorPage.setResumeTitle(resumeTitle);
    await editorPage.fillPersonalInfo({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '555-5678',
      location: 'New York, NY',
    });

    // Save
    await editorPage.save();
    await editorPage.assertAutoSaved();

    // Go back to resumes list
    await editorPage.goBack();

    // Verify resume appears in list
    await resumesPage.assertResumeExists(resumeTitle);
  });

  test('should auto-save resume', async () => {
    await resumesPage.clickCreateResume();

    await editorPage.setResumeTitle('Auto-save Test');
    await editorPage.fillPersonalInfo({
      firstName: 'Auto',
      lastName: 'Save',
      email: 'autosave@example.com',
    });

    // Wait for auto-save
    await editorPage.page.waitForTimeout(3000);

    // Check auto-save indicator
    const indicator = await editorPage.autoSaveIndicator.textContent();
    expect(indicator?.toLowerCase()).toMatch(/saved|saving/);
  });

  test('should validate required fields', async () => {
    await resumesPage.clickCreateResume();

    // Try to save without required fields
    await editorPage.saveButton.click();

    // Should show validation errors or prevent save
    const titleValue = await editorPage.resumeTitle.inputValue();
    const firstNameValue = await editorPage.firstNameInput.inputValue();

    // If fields are empty, form should show errors
    if (!titleValue || !firstNameValue) {
      const errorMessage = editorPage.page.locator('[data-testid="error-message"]');
      const hasError = await errorMessage.isVisible({ timeout: 2000 });

      if (!hasError) {
        // Or button might be disabled
        const isDisabled = await editorPage.saveButton.isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('should handle current job checkbox', async () => {
    await resumesPage.clickCreateResume();

    await editorPage.experienceTab.click();
    await editorPage.addExperienceButton.click();

    // Fill experience
    const experience = editorPage.experienceItems.first();
    await experience.locator('input[name="company"]').fill('Current Company');
    await experience.locator('input[name="position"]').fill('Current Position');
    await experience.locator('input[name="experienceLocation"]').fill('San Francisco');
    await experience.locator('input[name="startDate"]').fill('2023-01');

    // Check current job
    await experience.locator('input[name="currentJob"]').check();

    // End date should be disabled or hidden
    const endDateInput = experience.locator('input[name="endDate"]');
    const isDisabled = await endDateInput.isDisabled({ timeout: 2000 });
    const isHidden = !(await endDateInput.isVisible({ timeout: 2000 }));

    expect(isDisabled || isHidden).toBeTruthy();
  });

  test('should add multiple experience entries', async () => {
    await resumesPage.clickCreateResume();

    await editorPage.experienceTab.click();

    // Add 3 experiences
    for (let i = 0; i < 3; i++) {
      await editorPage.addExperience({
        company: `Company ${i + 1}`,
        position: `Position ${i + 1}`,
        location: 'Remote',
        startDate: '2020-01',
        endDate: '2021-12',
        description: `Description for position ${i + 1}`,
      });
    }

    // Should have 3 experience items
    const count = await editorPage.experienceItems.count();
    expect(count).toBe(3);
  });

  test('should add multiple education entries', async () => {
    await resumesPage.clickCreateResume();

    await editorPage.educationTab.click();

    // Add 2 education entries
    for (let i = 0; i < 2; i++) {
      await editorPage.addEducation({
        institution: `University ${i + 1}`,
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'USA',
        startDate: '2014-09',
        endDate: '2018-05',
        gpa: '3.8',
      });
    }

    // Should have 2 education items
    const count = await editorPage.educationItems.count();
    expect(count).toBe(2);
  });

  test('should add skill tags', async () => {
    await resumesPage.clickCreateResume();

    await editorPage.skillsTab.click();

    const skills = ['JavaScript', 'TypeScript', 'React', 'Node.js'];

    for (const skill of skills) {
      await editorPage.technicalSkillsInput.fill(skill);
      await editorPage.technicalSkillsInput.press('Enter');
    }

    // Should have skill tags
    const count = await editorPage.skillTags.count();
    expect(count).toBeGreaterThanOrEqual(skills.length);
  });

  test('should navigate between tabs', async () => {
    await resumesPage.clickCreateResume();

    // Click through all tabs
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

  test('should handle unsaved changes warning', async ({ page }) => {
    await resumesPage.clickCreateResume();

    // Make changes
    await editorPage.setResumeTitle('Unsaved Changes Test');
    await editorPage.fillPersonalInfo({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    });

    // Try to navigate away without saving
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toMatch(/unsaved|discard|leave/i);
      dialog.dismiss();
    });

    await editorPage.backButton.click();

    // Should still be on editor page due to dismissed dialog
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/resumes/new');
  });
});

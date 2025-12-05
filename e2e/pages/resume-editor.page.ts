import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Resume Editor Page
 */
export class ResumeEditorPage {
  readonly page: Page;

  // Header
  readonly resumeTitle: Locator;
  readonly saveButton: Locator;
  readonly previewButton: Locator;
  readonly exportButton: Locator;
  readonly backButton: Locator;
  readonly autoSaveIndicator: Locator;

  // Tabs
  readonly personalInfoTab: Locator;
  readonly experienceTab: Locator;
  readonly educationTab: Locator;
  readonly skillsTab: Locator;
  readonly summaryTab: Locator;

  // Personal Info
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly locationInput: Locator;
  readonly linkedinInput: Locator;
  readonly websiteInput: Locator;

  // Summary
  readonly summaryTextarea: Locator;
  readonly generateSummaryButton: Locator;

  // Experience
  readonly addExperienceButton: Locator;
  readonly experienceItems: Locator;
  readonly companyInput: Locator;
  readonly positionInput: Locator;
  readonly experienceLocationInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly currentJobCheckbox: Locator;
  readonly descriptionTextarea: Locator;
  readonly generateDescriptionButton: Locator;
  readonly addHighlightButton: Locator;

  // Education
  readonly addEducationButton: Locator;
  readonly educationItems: Locator;
  readonly institutionInput: Locator;
  readonly degreeInput: Locator;
  readonly fieldInput: Locator;
  readonly educationStartDate: Locator;
  readonly educationEndDate: Locator;
  readonly gpaInput: Locator;

  // Skills
  readonly technicalSkillsInput: Locator;
  readonly softSkillsInput: Locator;
  readonly addSkillButton: Locator;
  readonly skillTags: Locator;

  // AI Features
  readonly aiPanel: Locator;
  readonly atsScoreButton: Locator;
  readonly atsScoreDisplay: Locator;
  readonly optimizeForJobButton: Locator;
  readonly jobDescriptionInput: Locator;

  // Preview
  readonly previewModal: Locator;
  readonly closePreviewButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.resumeTitle = page.locator('input[name="resumeTitle"]');
    this.saveButton = page.locator('button:has-text("Save")');
    this.previewButton = page.locator('button:has-text("Preview")');
    this.exportButton = page.locator('button:has-text("Export")');
    this.backButton = page.locator('button:has-text("Back")');
    this.autoSaveIndicator = page.locator('[data-testid="autosave-indicator"]');

    // Tabs
    this.personalInfoTab = page.locator('[data-tab="personal-info"]');
    this.experienceTab = page.locator('[data-tab="experience"]');
    this.educationTab = page.locator('[data-tab="education"]');
    this.skillsTab = page.locator('[data-tab="skills"]');
    this.summaryTab = page.locator('[data-tab="summary"]');

    // Personal Info
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.emailInput = page.locator('input[name="email"]');
    this.phoneInput = page.locator('input[name="phone"]');
    this.locationInput = page.locator('input[name="location"]');
    this.linkedinInput = page.locator('input[name="linkedin"]');
    this.websiteInput = page.locator('input[name="website"]');

    // Summary
    this.summaryTextarea = page.locator('textarea[name="summary"]');
    this.generateSummaryButton = page.locator('button:has-text("Generate Summary")');

    // Experience
    this.addExperienceButton = page.locator('button:has-text("Add Experience")');
    this.experienceItems = page.locator('[data-testid="experience-item"]');
    this.companyInput = page.locator('input[name="company"]');
    this.positionInput = page.locator('input[name="position"]');
    this.experienceLocationInput = page.locator('input[name="experienceLocation"]');
    this.startDateInput = page.locator('input[name="startDate"]');
    this.endDateInput = page.locator('input[name="endDate"]');
    this.currentJobCheckbox = page.locator('input[name="currentJob"]');
    this.descriptionTextarea = page.locator('textarea[name="description"]');
    this.generateDescriptionButton = page.locator('button:has-text("Generate Description")');
    this.addHighlightButton = page.locator('button:has-text("Add Highlight")');

    // Education
    this.addEducationButton = page.locator('button:has-text("Add Education")');
    this.educationItems = page.locator('[data-testid="education-item"]');
    this.institutionInput = page.locator('input[name="institution"]');
    this.degreeInput = page.locator('input[name="degree"]');
    this.fieldInput = page.locator('input[name="field"]');
    this.educationStartDate = page.locator('input[name="educationStartDate"]');
    this.educationEndDate = page.locator('input[name="educationEndDate"]');
    this.gpaInput = page.locator('input[name="gpa"]');

    // Skills
    this.technicalSkillsInput = page.locator('input[name="technicalSkills"]');
    this.softSkillsInput = page.locator('input[name="softSkills"]');
    this.addSkillButton = page.locator('button:has-text("Add Skill")');
    this.skillTags = page.locator('[data-testid="skill-tag"]');

    // AI Features
    this.aiPanel = page.locator('[data-testid="ai-panel"]');
    this.atsScoreButton = page.locator('button:has-text("Get ATS Score")');
    this.atsScoreDisplay = page.locator('[data-testid="ats-score"]');
    this.optimizeForJobButton = page.locator('button:has-text("Optimize for Job")');
    this.jobDescriptionInput = page.locator('textarea[name="jobDescription"]');

    // Preview
    this.previewModal = page.locator('[data-testid="preview-modal"]');
    this.closePreviewButton = page.locator('[data-testid="close-preview"]');
  }

  /**
   * Navigate to resume editor page
   */
  async goto(resumeId?: string) {
    const url = resumeId ? `/resumes/${resumeId}` : '/resumes/new';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Set resume title
   */
  async setResumeTitle(title: string) {
    await this.resumeTitle.fill(title);
  }

  /**
   * Fill personal information
   */
  async fillPersonalInfo(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  }) {
    await this.personalInfoTab.click();
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);

    if (data.phone) await this.phoneInput.fill(data.phone);
    if (data.location) await this.locationInput.fill(data.location);
    if (data.linkedin) await this.linkedinInput.fill(data.linkedin);
    if (data.website) await this.websiteInput.fill(data.website);
  }

  /**
   * Fill summary
   */
  async fillSummary(summary: string) {
    await this.summaryTab.click();
    await this.summaryTextarea.fill(summary);
  }

  /**
   * Generate AI summary
   */
  async generateSummary() {
    await this.summaryTab.click();
    await this.generateSummaryButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add experience
   */
  async addExperience(data: {
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    highlights?: string[];
  }) {
    await this.experienceTab.click();
    await this.addExperienceButton.click();

    // Fill experience details
    const experienceCount = await this.experienceItems.count();
    const experienceItem = this.experienceItems.nth(experienceCount - 1);

    await experienceItem.locator('input[name="company"]').fill(data.company);
    await experienceItem.locator('input[name="position"]').fill(data.position);
    await experienceItem.locator('input[name="experienceLocation"]').fill(data.location);
    await experienceItem.locator('input[name="startDate"]').fill(data.startDate);

    if (data.current) {
      await experienceItem.locator('input[name="currentJob"]').check();
    } else if (data.endDate) {
      await experienceItem.locator('input[name="endDate"]').fill(data.endDate);
    }

    if (data.description) {
      await experienceItem.locator('textarea[name="description"]').fill(data.description);
    }

    if (data.highlights) {
      for (const highlight of data.highlights) {
        await experienceItem.locator('button:has-text("Add Highlight")').click();
        const highlightInputs = experienceItem.locator('input[name="highlight"]');
        const count = await highlightInputs.count();
        await highlightInputs.nth(count - 1).fill(highlight);
      }
    }
  }

  /**
   * Add education
   */
  async addEducation(data: {
    institution: string;
    degree: string;
    field: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }) {
    await this.educationTab.click();
    await this.addEducationButton.click();

    const educationCount = await this.educationItems.count();
    const educationItem = this.educationItems.nth(educationCount - 1);

    await educationItem.locator('input[name="institution"]').fill(data.institution);
    await educationItem.locator('input[name="degree"]').fill(data.degree);
    await educationItem.locator('input[name="field"]').fill(data.field);
    await educationItem.locator('input[name="educationStartDate"]').fill(data.startDate);
    await educationItem.locator('input[name="educationEndDate"]').fill(data.endDate);

    if (data.gpa) {
      await educationItem.locator('input[name="gpa"]').fill(data.gpa);
    }
  }

  /**
   * Add skills
   */
  async addSkills(technical: string[], soft: string[]) {
    await this.skillsTab.click();

    for (const skill of technical) {
      await this.technicalSkillsInput.fill(skill);
      await this.technicalSkillsInput.press('Enter');
    }

    for (const skill of soft) {
      await this.softSkillsInput.fill(skill);
      await this.softSkillsInput.press('Enter');
    }
  }

  /**
   * Get ATS score
   */
  async getATSScore(): Promise<number> {
    await this.atsScoreButton.click();
    await this.atsScoreDisplay.waitFor({ state: 'visible' });
    const scoreText = await this.atsScoreDisplay.textContent();
    const match = scoreText?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Optimize resume for job
   */
  async optimizeForJob(jobDescription: string) {
    await this.jobDescriptionInput.fill(jobDescription);
    await this.optimizeForJobButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Save resume
   */
  async save() {
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Preview resume
   */
  async preview() {
    await this.previewButton.click();
    await this.previewModal.waitFor({ state: 'visible' });
  }

  /**
   * Close preview
   */
  async closePreview() {
    await this.closePreviewButton.click();
    await this.previewModal.waitFor({ state: 'hidden' });
  }

  /**
   * Export resume
   */
  async export(format: 'pdf' | 'docx') {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();

    const formatButton = this.page.locator(`button:has-text("${format.toUpperCase()}")`);
    await formatButton.click();

    const download = await downloadPromise;
    return download;
  }

  /**
   * Go back to resumes list
   */
  async goBack() {
    await this.backButton.click();
    await this.page.waitForURL('**/resumes');
  }

  /**
   * Assert editor is displayed
   */
  async assertVisible() {
    await expect(this.resumeTitle).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  /**
   * Assert auto-save indicator shows saved
   */
  async assertAutoSaved() {
    await expect(this.autoSaveIndicator).toContainText('Saved', {
      ignoreCase: true,
    });
  }

  /**
   * Assert ATS score is displayed
   */
  async assertATSScore(minScore: number) {
    const score = await this.getATSScore();
    expect(score).toBeGreaterThanOrEqual(minScore);
  }
}

import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Profile Page
 */
export class ProfilePage {
  readonly page: Page;

  // Profile header
  readonly profileHeader: Locator;
  readonly profilePhoto: Locator;
  readonly uploadPhotoButton: Locator;
  readonly profileName: Locator;
  readonly profileTitle: Locator;

  // Edit mode toggle
  readonly editButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Basic Information
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly locationInput: Locator;
  readonly bioTextarea: Locator;

  // Social Links
  readonly linkedinInput: Locator;
  readonly githubInput: Locator;
  readonly websiteInput: Locator;
  readonly portfolioInput: Locator;

  // Work Experience Section
  readonly experienceSection: Locator;
  readonly addExperienceButton: Locator;
  readonly experienceCards: Locator;
  readonly editExperienceButtons: Locator;
  readonly deleteExperienceButtons: Locator;

  // Experience Modal
  readonly experienceModal: Locator;
  readonly experienceCompanyInput: Locator;
  readonly experiencePositionInput: Locator;
  readonly experienceLocationInput: Locator;
  readonly experienceStartDateInput: Locator;
  readonly experienceEndDateInput: Locator;
  readonly experienceCurrentCheckbox: Locator;
  readonly experienceDescriptionTextarea: Locator;
  readonly saveExperienceButton: Locator;
  readonly closeExperienceModalButton: Locator;

  // Education Section
  readonly educationSection: Locator;
  readonly addEducationButton: Locator;
  readonly educationCards: Locator;
  readonly editEducationButtons: Locator;
  readonly deleteEducationButtons: Locator;

  // Education Modal
  readonly educationModal: Locator;
  readonly educationInstitutionInput: Locator;
  readonly educationDegreeInput: Locator;
  readonly educationFieldInput: Locator;
  readonly educationStartDateInput: Locator;
  readonly educationEndDateInput: Locator;
  readonly educationGpaInput: Locator;
  readonly saveEducationButton: Locator;
  readonly closeEducationModalButton: Locator;

  // Skills Section
  readonly skillsSection: Locator;
  readonly addSkillButton: Locator;
  readonly skillInput: Locator;
  readonly skillTags: Locator;
  readonly removeSkillButtons: Locator;

  // Skills by category
  readonly technicalSkillsSection: Locator;
  readonly softSkillsSection: Locator;
  readonly languagesSection: Locator;

  // Certifications Section
  readonly certificationsSection: Locator;
  readonly addCertificationButton: Locator;
  readonly certificationCards: Locator;

  // Certification Modal
  readonly certificationModal: Locator;
  readonly certificationNameInput: Locator;
  readonly certificationIssuerInput: Locator;
  readonly certificationDateInput: Locator;
  readonly certificationIdInput: Locator;
  readonly certificationUrlInput: Locator;
  readonly saveCertificationButton: Locator;

  // Projects Section
  readonly projectsSection: Locator;
  readonly addProjectButton: Locator;
  readonly projectCards: Locator;

  // Project Modal
  readonly projectModal: Locator;
  readonly projectNameInput: Locator;
  readonly projectDescriptionTextarea: Locator;
  readonly projectUrlInput: Locator;
  readonly projectTechnologiesInput: Locator;
  readonly saveProjectButton: Locator;

  // Profile Completeness
  readonly completenessIndicator: Locator;
  readonly completenessPercentage: Locator;
  readonly completenessProgressBar: Locator;

  // Messages
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Profile header
    this.profileHeader = page.locator('[data-testid="profile-header"]');
    this.profilePhoto = page.locator('[data-testid="profile-photo"]');
    this.uploadPhotoButton = page.locator('[data-testid="upload-photo"]');
    this.profileName = page.locator('[data-testid="profile-name"]');
    this.profileTitle = page.locator('[data-testid="profile-title"]');

    // Edit mode
    this.editButton = page.locator('button:has-text("Edit")');
    this.saveButton = page.locator('button:has-text("Save")');
    this.cancelButton = page.locator('button:has-text("Cancel")');

    // Basic Information
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.emailInput = page.locator('input[name="email"]');
    this.phoneInput = page.locator('input[name="phone"]');
    this.locationInput = page.locator('input[name="location"]');
    this.bioTextarea = page.locator('textarea[name="bio"]');

    // Social Links
    this.linkedinInput = page.locator('input[name="linkedin"]');
    this.githubInput = page.locator('input[name="github"]');
    this.websiteInput = page.locator('input[name="website"]');
    this.portfolioInput = page.locator('input[name="portfolio"]');

    // Work Experience
    this.experienceSection = page.locator('[data-testid="experience-section"]');
    this.addExperienceButton = page.locator('button:has-text("Add Experience")');
    this.experienceCards = page.locator('[data-testid="experience-card"]');
    this.editExperienceButtons = page.locator('[data-testid="edit-experience"]');
    this.deleteExperienceButtons = page.locator('[data-testid="delete-experience"]');

    // Experience Modal
    this.experienceModal = page.locator('[data-testid="experience-modal"]');
    this.experienceCompanyInput = page.locator('input[name="company"]');
    this.experiencePositionInput = page.locator('input[name="position"]');
    this.experienceLocationInput = page.locator('input[name="experienceLocation"]');
    this.experienceStartDateInput = page.locator('input[name="startDate"]');
    this.experienceEndDateInput = page.locator('input[name="endDate"]');
    this.experienceCurrentCheckbox = page.locator('input[name="current"]');
    this.experienceDescriptionTextarea = page.locator('textarea[name="description"]');
    this.saveExperienceButton = page.locator('button:has-text("Save Experience")');
    this.closeExperienceModalButton = page.locator('[data-testid="close-experience-modal"]');

    // Education
    this.educationSection = page.locator('[data-testid="education-section"]');
    this.addEducationButton = page.locator('button:has-text("Add Education")');
    this.educationCards = page.locator('[data-testid="education-card"]');
    this.editEducationButtons = page.locator('[data-testid="edit-education"]');
    this.deleteEducationButtons = page.locator('[data-testid="delete-education"]');

    // Education Modal
    this.educationModal = page.locator('[data-testid="education-modal"]');
    this.educationInstitutionInput = page.locator('input[name="institution"]');
    this.educationDegreeInput = page.locator('input[name="degree"]');
    this.educationFieldInput = page.locator('input[name="field"]');
    this.educationStartDateInput = page.locator('input[name="educationStartDate"]');
    this.educationEndDateInput = page.locator('input[name="educationEndDate"]');
    this.educationGpaInput = page.locator('input[name="gpa"]');
    this.saveEducationButton = page.locator('button:has-text("Save Education")');
    this.closeEducationModalButton = page.locator('[data-testid="close-education-modal"]');

    // Skills
    this.skillsSection = page.locator('[data-testid="skills-section"]');
    this.addSkillButton = page.locator('button:has-text("Add Skill")');
    this.skillInput = page.locator('input[name="skill"]');
    this.skillTags = page.locator('[data-testid="skill-tag"]');
    this.removeSkillButtons = page.locator('[data-testid="remove-skill"]');

    // Skills by category
    this.technicalSkillsSection = page.locator('[data-testid="technical-skills"]');
    this.softSkillsSection = page.locator('[data-testid="soft-skills"]');
    this.languagesSection = page.locator('[data-testid="languages"]');

    // Certifications
    this.certificationsSection = page.locator('[data-testid="certifications-section"]');
    this.addCertificationButton = page.locator('button:has-text("Add Certification")');
    this.certificationCards = page.locator('[data-testid="certification-card"]');

    // Certification Modal
    this.certificationModal = page.locator('[data-testid="certification-modal"]');
    this.certificationNameInput = page.locator('input[name="certificationName"]');
    this.certificationIssuerInput = page.locator('input[name="issuer"]');
    this.certificationDateInput = page.locator('input[name="certificationDate"]');
    this.certificationIdInput = page.locator('input[name="credentialId"]');
    this.certificationUrlInput = page.locator('input[name="certificationUrl"]');
    this.saveCertificationButton = page.locator('button:has-text("Save Certification")');

    // Projects
    this.projectsSection = page.locator('[data-testid="projects-section"]');
    this.addProjectButton = page.locator('button:has-text("Add Project")');
    this.projectCards = page.locator('[data-testid="project-card"]');

    // Project Modal
    this.projectModal = page.locator('[data-testid="project-modal"]');
    this.projectNameInput = page.locator('input[name="projectName"]');
    this.projectDescriptionTextarea = page.locator('textarea[name="projectDescription"]');
    this.projectUrlInput = page.locator('input[name="projectUrl"]');
    this.projectTechnologiesInput = page.locator('input[name="technologies"]');
    this.saveProjectButton = page.locator('button:has-text("Save Project")');

    // Profile Completeness
    this.completenessIndicator = page.locator('[data-testid="completeness-indicator"]');
    this.completenessPercentage = page.locator('[data-testid="completeness-percentage"]');
    this.completenessProgressBar = page.locator('[data-testid="completeness-progress"]');

    // Messages
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  /**
   * Navigate to profile page
   */
  async goto() {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Enter edit mode
   */
  async enterEditMode() {
    const editVisible = await this.editButton.isVisible({ timeout: 3000 });
    if (editVisible) {
      await this.editButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Save profile changes
   */
  async saveChanges() {
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Cancel profile changes
   */
  async cancelChanges() {
    await this.cancelButton.click();
  }

  /**
   * Update basic information
   */
  async updateBasicInfo(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
    bio?: string;
  }) {
    await this.enterEditMode();

    if (data.firstName) await this.firstNameInput.fill(data.firstName);
    if (data.lastName) await this.lastNameInput.fill(data.lastName);
    if (data.phone) await this.phoneInput.fill(data.phone);
    if (data.location) await this.locationInput.fill(data.location);
    if (data.bio) await this.bioTextarea.fill(data.bio);

    await this.saveChanges();
  }

  /**
   * Update social links
   */
  async updateSocialLinks(data: {
    linkedin?: string;
    github?: string;
    website?: string;
  }) {
    await this.enterEditMode();

    if (data.linkedin) await this.linkedinInput.fill(data.linkedin);
    if (data.github) await this.githubInput.fill(data.github);
    if (data.website) await this.websiteInput.fill(data.website);

    await this.saveChanges();
  }

  /**
   * Upload profile photo
   */
  async uploadPhoto(filePath: string) {
    const fileInput = this.page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add work experience
   */
  async addExperience(data: {
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }) {
    await this.addExperienceButton.click();
    await this.experienceModal.waitFor({ state: 'visible' });

    await this.experienceCompanyInput.fill(data.company);
    await this.experiencePositionInput.fill(data.position);
    if (data.location) await this.experienceLocationInput.fill(data.location);
    await this.experienceStartDateInput.fill(data.startDate);

    if (data.current) {
      await this.experienceCurrentCheckbox.check();
    } else if (data.endDate) {
      await this.experienceEndDateInput.fill(data.endDate);
    }

    if (data.description) {
      await this.experienceDescriptionTextarea.fill(data.description);
    }

    await this.saveExperienceButton.click();
    await this.experienceModal.waitFor({ state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Edit work experience
   */
  async editExperience(index: number) {
    await this.editExperienceButtons.nth(index).click();
    await this.experienceModal.waitFor({ state: 'visible' });
  }

  /**
   * Delete work experience
   */
  async deleteExperience(index: number) {
    await this.deleteExperienceButtons.nth(index).click();

    // Handle confirmation if present
    const confirmButton = this.page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add education
   */
  async addEducation(data: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }) {
    await this.addEducationButton.click();
    await this.educationModal.waitFor({ state: 'visible' });

    await this.educationInstitutionInput.fill(data.institution);
    await this.educationDegreeInput.fill(data.degree);
    await this.educationFieldInput.fill(data.field);
    await this.educationStartDateInput.fill(data.startDate);
    await this.educationEndDateInput.fill(data.endDate);

    if (data.gpa) {
      await this.educationGpaInput.fill(data.gpa);
    }

    await this.saveEducationButton.click();
    await this.educationModal.waitFor({ state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Edit education
   */
  async editEducation(index: number) {
    await this.editEducationButtons.nth(index).click();
    await this.educationModal.waitFor({ state: 'visible' });
  }

  /**
   * Delete education
   */
  async deleteEducation(index: number) {
    await this.deleteEducationButtons.nth(index).click();

    // Handle confirmation if present
    const confirmButton = this.page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add skill
   */
  async addSkill(skillName: string, category?: string) {
    // If there's a skill input visible, use it
    const skillInputVisible = await this.skillInput.isVisible({ timeout: 3000 });

    if (skillInputVisible) {
      await this.skillInput.fill(skillName);
      await this.skillInput.press('Enter');
      await this.page.waitForLoadState('networkidle');
    } else {
      // Otherwise, click add button first
      await this.addSkillButton.click();
      await this.skillInput.fill(skillName);
      await this.skillInput.press('Enter');
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Remove skill
   */
  async removeSkill(index: number) {
    await this.removeSkillButtons.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get skill count
   */
  async getSkillCount(): Promise<number> {
    return await this.skillTags.count();
  }

  /**
   * Add certification
   */
  async addCertification(data: {
    name: string;
    issuer: string;
    date: string;
    credentialId?: string;
    url?: string;
  }) {
    await this.addCertificationButton.click();
    await this.certificationModal.waitFor({ state: 'visible' });

    await this.certificationNameInput.fill(data.name);
    await this.certificationIssuerInput.fill(data.issuer);
    await this.certificationDateInput.fill(data.date);

    if (data.credentialId) {
      await this.certificationIdInput.fill(data.credentialId);
    }

    if (data.url) {
      await this.certificationUrlInput.fill(data.url);
    }

    await this.saveCertificationButton.click();
    await this.certificationModal.waitFor({ state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add project
   */
  async addProject(data: {
    name: string;
    description: string;
    url?: string;
    technologies?: string[];
  }) {
    await this.addProjectButton.click();
    await this.projectModal.waitFor({ state: 'visible' });

    await this.projectNameInput.fill(data.name);
    await this.projectDescriptionTextarea.fill(data.description);

    if (data.url) {
      await this.projectUrlInput.fill(data.url);
    }

    if (data.technologies && data.technologies.length > 0) {
      await this.projectTechnologiesInput.fill(data.technologies.join(', '));
    }

    await this.saveProjectButton.click();
    await this.projectModal.waitFor({ state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get profile completeness percentage
   */
  async getCompletenessPercentage(): Promise<number> {
    const completenessVisible = await this.completenessPercentage.isVisible({ timeout: 3000 });

    if (completenessVisible) {
      const text = await this.completenessPercentage.textContent();
      const match = text?.match(/(\d+)%/);
      return match ? parseInt(match[1]) : 0;
    }

    return 0;
  }

  /**
   * Assert profile page is displayed
   */
  async assertVisible() {
    await expect(this.profileHeader).toBeVisible();
  }

  /**
   * Assert profile name
   */
  async assertProfileName(expectedName: string) {
    await expect(this.profileName).toContainText(expectedName);
  }

  /**
   * Assert success message
   */
  async assertSuccess(message?: string) {
    await expect(this.successMessage).toBeVisible();
    if (message) {
      await expect(this.successMessage).toContainText(message);
    }
  }

  /**
   * Assert error message
   */
  async assertError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  /**
   * Assert experience count
   */
  async assertExperienceCount(expectedCount: number) {
    await expect(this.experienceCards).toHaveCount(expectedCount);
  }

  /**
   * Assert education count
   */
  async assertEducationCount(expectedCount: number) {
    await expect(this.educationCards).toHaveCount(expectedCount);
  }

  /**
   * Assert completeness percentage
   */
  async assertCompleteness(minPercentage: number) {
    const percentage = await this.getCompletenessPercentage();
    expect(percentage).toBeGreaterThanOrEqual(minPercentage);
  }
}

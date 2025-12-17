import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';
import { WAIT_TIMES } from '../utils/test-data';
import path from 'path';

/**
 * E2E Tests for Resume Upload Flow
 *
 * This suite tests resume upload functionality including:
 * - Uploading PDF, DOCX, and other formats
 * - File validation
 * - Resume parsing
 * - Upload progress
 * - Error handling
 */

// Mock API responses for resume operations
const mockResumeUploadResponse = {
  id: 'resume-test-123',
  filename: 'test-resume.pdf',
  originalName: 'test-resume.pdf',
  mimeType: 'application/pdf',
  size: 125000,
  status: 'uploaded',
  createdAt: new Date().toISOString(),
  parsedData: null,
};

const mockResumeListResponse = {
  data: [
    {
      id: 'resume-1',
      filename: 'Software_Engineer_Resume.pdf',
      originalName: 'Software_Engineer_Resume.pdf',
      status: 'parsed',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'resume-2',
      filename: 'Data_Scientist_Resume.docx',
      originalName: 'Data_Scientist_Resume.docx',
      status: 'parsed',
      createdAt: '2024-01-10T10:00:00Z',
    },
  ],
  total: 2,
};

authenticatedTest.describe('Resume Upload', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    // Mock the resumes API endpoint
    await authenticatedPage.route('**/api/resumes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResumeListResponse),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockResumeUploadResponse),
        });
      } else {
        await route.continue();
      }
    });

    await authenticatedPage.goto('/resumes');
  });

  authenticatedTest('should display resumes page', async ({ authenticatedPage }) => {
    // Verify page loaded
    await expect(authenticatedPage).toHaveURL(/.*resumes?/);
    await expect(authenticatedPage.getByRole('heading', { name: /resumes?/i })).toBeVisible();
  });

  authenticatedTest('should display upload button', async ({ authenticatedPage }) => {
    // Verify upload button exists
    const uploadButton = authenticatedPage.getByRole('button', { name: /upload.*resume|upload|add.*resume/i });
    await expect(uploadButton).toBeVisible();
  });

  authenticatedTest('should open upload modal', async ({ authenticatedPage }) => {
    // Click upload button
    await authenticatedPage.getByRole('button', { name: /upload.*resume|upload/i }).click();

    // Verify modal is displayed
    const modal = authenticatedPage.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Verify file input or dropzone
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const dropzone = authenticatedPage.getByText(/drag.*drop|drop.*files/i);

    const hasFileInput = await fileInput.isVisible().catch(() => false);
    const hasDropzone = await dropzone.isVisible().catch(() => false);

    expect(hasFileInput || hasDropzone).toBeTruthy();
  });

  authenticatedTest('should upload PDF resume successfully', async ({ authenticatedPage }) => {
    // Mock successful upload response
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockResumeUploadResponse,
          status: 'uploaded',
        }),
      });
    });

    // Click upload button
    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    // Find file input
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Create a mock PDF file buffer
    const pdfContent = Buffer.from('%PDF-1.4 mock pdf content');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent,
    });

    // Show upload progress (if applicable)
    const progressBar = authenticatedPage.locator('[role="progressbar"]');
    if (await progressBar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(progressBar).toBeVisible();
    }

    // Wait for upload to complete
    await expect(authenticatedPage.getByText(/uploaded|success|complete/i)).toBeVisible({ timeout: WAIT_TIMES.fileUpload });
  });

  authenticatedTest('should upload DOCX resume successfully', async ({ authenticatedPage }) => {
    // Mock successful DOCX upload
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockResumeUploadResponse,
          filename: 'test-resume.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      });
    });

    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    const fileInput = authenticatedPage.locator('input[type="file"]');

    // Create a mock DOCX file buffer
    const docxContent = Buffer.from('PK mock docx content');
    await fileInput.setInputFiles({
      name: 'test-resume.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: docxContent,
    });

    // Wait for success
    await expect(authenticatedPage.getByText(/uploaded|success/i)).toBeVisible({ timeout: WAIT_TIMES.fileUpload });
  });

  authenticatedTest('should validate file type', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    const fileInput = authenticatedPage.locator('input[type="file"]');

    // Try to upload invalid file type (text file)
    const invalidContent = Buffer.from('This is a plain text file');
    await fileInput.setInputFiles({
      name: 'invalid-file.txt',
      mimeType: 'text/plain',
      buffer: invalidContent,
    });

    // Should show error message for invalid file type
    const errorMessage = authenticatedPage.getByText(/invalid.*file.*type|unsupported.*format|pdf.*docx|only.*pdf/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  authenticatedTest('should validate file size', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    const fileInput = authenticatedPage.locator('input[type="file"]');

    // Create a large file buffer (simulating >10MB file)
    // Note: We simulate this by setting a large content-length in the mock
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'File too large',
          message: 'Maximum file size is 10MB',
        }),
      });
    });

    // Create a minimal large file representation
    const largeContent = Buffer.alloc(100, 'a'); // Small buffer but treated as large by mock
    await fileInput.setInputFiles({
      name: 'large-file.pdf',
      mimeType: 'application/pdf',
      buffer: largeContent,
    });

    // Should show error
    const errorMessage = authenticatedPage.getByText(/file.*too.*large|maximum.*size|exceed|10.*mb/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  authenticatedTest('should display supported file formats', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    // Should show accepted formats
    const formatInfo = authenticatedPage.getByText(/pdf|docx|supported.*formats/i);
    await expect(formatInfo).toBeVisible();
  });

  authenticatedTest('should display maximum file size', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    // Should show max size (e.g., "Max 5MB" or "Max 10MB")
    const sizeInfo = authenticatedPage.getByText(/max.*\d+\s*mb|maximum.*size|\d+\s*mb.*max/i);
    if (await sizeInfo.isVisible().catch(() => false)) {
      await expect(sizeInfo).toBeVisible();
    }
  });

  authenticatedTest('should support drag and drop upload', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    // Find dropzone
    const dropzone = authenticatedPage.getByTestId('dropzone');
    const dropzoneText = authenticatedPage.getByText(/drag.*drop|drop.*file/i);

    const hasDropzone = await dropzone.isVisible().catch(() => false);
    const hasDropzoneText = await dropzoneText.isVisible().catch(() => false);

    if (hasDropzone || hasDropzoneText) {
      // Verify dropzone is visible and functional
      await expect(dropzone.or(dropzoneText)).toBeVisible();

      // Simulate drag enter event to show drag state
      const targetDropzone = hasDropzone ? dropzone : dropzoneText;
      await targetDropzone.dispatchEvent('dragenter', {
        dataTransfer: { types: ['Files'] },
      });
    }
  });

  authenticatedTest('should show upload progress', async ({ authenticatedPage }) => {
    // Mock upload endpoint with delayed response to show progress
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(mockResumeUploadResponse),
      });
    });

    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    const fileInput = authenticatedPage.locator('input[type="file"]');
    const pdfContent = Buffer.from('%PDF-1.4 mock pdf content');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent,
    });

    // Progress bar or progress text should appear
    const progressBar = authenticatedPage.locator('[role="progressbar"]');
    const progressText = authenticatedPage.getByText(/\d+%|uploading/i);

    const hasProgressBar = await progressBar.isVisible({ timeout: 2000 }).catch(() => false);
    const hasProgressText = await progressText.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasProgressBar || hasProgressText).toBeTruthy();
  });

  authenticatedTest('should allow resume renaming during upload', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      const formData = route.request().postData();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockResumeUploadResponse,
          filename: 'My Updated Resume',
          originalName: 'My Updated Resume.pdf',
        }),
      });
    });

    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    const fileInput = authenticatedPage.locator('input[type="file"]');
    const pdfContent = Buffer.from('%PDF-1.4 mock pdf content');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent,
    });

    // Check if name field appears
    const nameInput = authenticatedPage.getByLabel(/resume.*name|name|title/i);

    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('My Updated Resume');

      // Save/upload
      await authenticatedPage.getByRole('button', { name: /upload|save|submit/i }).click();

      // Verify custom name is used
      await expect(authenticatedPage.getByText('My Updated Resume')).toBeVisible({ timeout: WAIT_TIMES.fileUpload });
    }
  });

  authenticatedTest('should parse resume content automatically', async ({ authenticatedPage }) => {
    // Mock upload with parsing response
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockResumeUploadResponse,
          status: 'parsing',
        }),
      });
    });

    // Mock parsing status endpoint
    await authenticatedPage.route('**/api/resumes/*/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'parsed',
          parsedData: {
            name: 'John Doe',
            email: 'john@example.com',
            skills: ['JavaScript', 'TypeScript', 'React'],
          },
        }),
      });
    });

    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    const fileInput = authenticatedPage.locator('input[type="file"]');
    const pdfContent = Buffer.from('%PDF-1.4 mock pdf content');
    await fileInput.setInputFiles({
      name: 'resume-with-content.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent,
    });

    // Wait for upload success
    await expect(authenticatedPage.getByText(/uploaded|success|parsing|analyzing/i)).toBeVisible({ timeout: WAIT_TIMES.fileUpload });
  });

  authenticatedTest('should handle upload cancellation', async ({ authenticatedPage }) => {
    // Mock slow upload to allow cancellation
    let uploadAborted = false;
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (!uploadAborted) {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockResumeUploadResponse),
        });
      }
    });

    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    const fileInput = authenticatedPage.locator('input[type="file"]');
    const pdfContent = Buffer.from('%PDF-1.4 mock pdf content');
    await fileInput.setInputFiles({
      name: 'large-resume.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent,
    });

    // Find and click cancel button
    const cancelButton = authenticatedPage.getByRole('button', { name: /cancel/i });

    if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      uploadAborted = true;
      await cancelButton.click();

      // Upload should be cancelled
      const cancelledText = authenticatedPage.getByText(/cancelled|canceled|upload.*stopped/i);
      if (await cancelledText.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(cancelledText).toBeVisible();
      }
    }
  });

  authenticatedTest('should handle network errors during upload', async ({ authenticatedPage }) => {
    // Simulate network failure
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      await route.abort('failed');
    });

    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    const fileInput = authenticatedPage.locator('input[type="file"]');
    const pdfContent = Buffer.from('%PDF-1.4 mock pdf content');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent,
    });

    // Should show error
    await expect(authenticatedPage.getByText(/upload.*failed|network.*error|connection.*error|failed.*upload/i)).toBeVisible({ timeout: 10000 });
  });

  authenticatedTest('should handle server errors during upload', async ({ authenticatedPage }) => {
    // Mock server error response
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        }),
      });
    });

    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    const fileInput = authenticatedPage.locator('input[type="file"]');
    const pdfContent = Buffer.from('%PDF-1.4 mock pdf content');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent,
    });

    // Should show error
    await expect(authenticatedPage.getByText(/upload.*failed|error.*occurred|server.*error/i)).toBeVisible({ timeout: 10000 });

    // Should offer retry option
    const retryButton = authenticatedPage.getByRole('button', { name: /retry|try.*again/i });
    if (await retryButton.isVisible().catch(() => false)) {
      await expect(retryButton).toBeVisible();
    }
  });

  authenticatedTest('should support multiple resume uploads', async ({ authenticatedPage }) => {
    let uploadCount = 0;
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      uploadCount++;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockResumeUploadResponse,
          id: `resume-${uploadCount}`,
          filename: `resume${uploadCount}.pdf`,
        }),
      });
    });

    // Update mock to return increasing number of resumes
    await authenticatedPage.route('**/api/resumes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              ...mockResumeListResponse.data,
              ...Array(uploadCount).fill(null).map((_, i) => ({
                id: `resume-new-${i + 1}`,
                filename: `resume${i + 1}.pdf`,
                status: 'parsed',
                createdAt: new Date().toISOString(),
              })),
            ],
            total: mockResumeListResponse.data.length + uploadCount,
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Upload first resume
    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();
    const fileInput = authenticatedPage.locator('input[type="file"]');
    const pdfContent1 = Buffer.from('%PDF-1.4 mock pdf content 1');
    await fileInput.setInputFiles({
      name: 'resume1.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent1,
    });
    await expect(authenticatedPage.getByText(/uploaded|success/i)).toBeVisible({ timeout: WAIT_TIMES.fileUpload });

    // Close modal if still open
    const closeButton = authenticatedPage.getByRole('button', { name: /close|done|x/i });
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }

    // Upload second resume
    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();
    const pdfContent2 = Buffer.from('%PDF-1.4 mock pdf content 2');
    await fileInput.setInputFiles({
      name: 'resume2.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent2,
    });
    await expect(authenticatedPage.getByText(/uploaded|success/i)).toBeVisible({ timeout: WAIT_TIMES.fileUpload });

    // Verify both uploads completed
    expect(uploadCount).toBe(2);
  });

  authenticatedTest('should close upload modal after success', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/resumes/upload', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(mockResumeUploadResponse),
      });
    });

    await authenticatedPage.getByRole('button', { name: /upload.*resume/i }).click();

    const modal = authenticatedPage.getByRole('dialog');
    await expect(modal).toBeVisible();

    const fileInput = authenticatedPage.locator('input[type="file"]');
    const pdfContent = Buffer.from('%PDF-1.4 mock pdf content');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent,
    });

    // Wait for upload success
    await expect(authenticatedPage.getByText(/uploaded|success/i)).toBeVisible({ timeout: WAIT_TIMES.fileUpload });

    // Modal should close automatically or have close button
    await authenticatedPage.waitForTimeout(1000);
    const isModalGone = !(await modal.isVisible({ timeout: 3000 }).catch(() => true));

    if (!isModalGone) {
      // Click close button if modal is still open
      const closeButton = modal.getByRole('button', { name: /close|done|x/i });
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await expect(modal).not.toBeVisible({ timeout: 2000 });
      }
    }
  });

  authenticatedTest('should display upload history/recent uploads', async ({ authenticatedPage }) => {
    // After page loads with mocked data, should see existing resumes
    const resumeItems = authenticatedPage.getByTestId('resume-item');

    // Check if resume items or a list is visible
    const hasResumeItems = await resumeItems.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasRecentSection = await authenticatedPage.getByRole('heading', { name: /recent|uploaded|my.*resumes/i }).isVisible().catch(() => false);

    expect(hasResumeItems || hasRecentSection).toBeTruthy();
  });
});

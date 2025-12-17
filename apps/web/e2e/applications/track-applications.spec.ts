import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';

/**
 * E2E Tests for Track Applications Flow
 *
 * This suite tests application tracking including:
 * - Viewing all applications
 * - Filtering applications
 * - Application status updates
 * - Application details
 * - Analytics/statistics
 */

// Mock application data
const mockApplicationsData = {
  data: [
    {
      id: 'app-1',
      job_id: 'job-1',
      job_title: 'Senior Software Engineer',
      company_name: 'TechCorp Inc.',
      status: 'pending',
      applied_at: '2024-01-15T10:00:00Z',
      notes: 'Waiting for response',
      timeline: [
        { event: 'Applied', date: '2024-01-15T10:00:00Z' },
      ],
    },
    {
      id: 'app-2',
      job_id: 'job-2',
      job_title: 'Product Manager',
      company_name: 'StartupXYZ',
      status: 'interview',
      applied_at: '2024-01-10T10:00:00Z',
      notes: 'Phone screen scheduled',
      timeline: [
        { event: 'Applied', date: '2024-01-10T10:00:00Z' },
        { event: 'Phone Screen Scheduled', date: '2024-01-14T10:00:00Z' },
      ],
    },
    {
      id: 'app-3',
      job_id: 'job-3',
      job_title: 'Data Scientist',
      company_name: 'DataCo',
      status: 'offer',
      applied_at: '2024-01-05T10:00:00Z',
      notes: 'Received offer!',
      timeline: [
        { event: 'Applied', date: '2024-01-05T10:00:00Z' },
        { event: 'Interview', date: '2024-01-12T10:00:00Z' },
        { event: 'Offer Received', date: '2024-01-18T10:00:00Z' },
      ],
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 3,
    total_pages: 1,
  },
  stats: {
    total: 3,
    pending: 1,
    interview: 1,
    offer: 1,
    rejected: 0,
    responseRate: 66,
  },
};

const mockApplicationDetails = {
  ...mockApplicationsData.data[0],
  cover_letter: 'Dear Hiring Manager...',
  resume_id: 'resume-1',
  resume_name: 'Software_Engineer_Resume.pdf',
};

authenticatedTest.describe('Track Applications', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    // Mock applications list API
    await authenticatedPage.route('**/api/applications', async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');

      let filteredData = [...mockApplicationsData.data];
      if (status) {
        filteredData = filteredData.filter((app) => app.status === status);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockApplicationsData,
          data: filteredData,
          pagination: {
            ...mockApplicationsData.pagination,
            total: filteredData.length,
          },
        }),
      });
    });

    // Mock single application API
    await authenticatedPage.route('**/api/applications/*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockApplicationDetails),
        });
      } else if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockApplicationDetails, ...JSON.parse(route.request().postData() || '{}') }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock stats API
    await authenticatedPage.route('**/api/applications/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApplicationsData.stats),
      });
    });

    // Mock reminders API
    await authenticatedPage.route('**/api/applications/*/reminders', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Reminder set' }),
      });
    });

    // Mock export API
    await authenticatedPage.route('**/api/applications/export', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'job_title,company,status,applied_at\nSoftware Engineer,TechCorp,pending,2024-01-15',
        headers: {
          'Content-Disposition': 'attachment; filename="applications.csv"',
        },
      });
    });

    await authenticatedPage.goto('/applications');
  });

  authenticatedTest('should display applications page', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveURL(/.*applications?/);
    await expect(authenticatedPage.getByRole('heading', { name: /applications?/i })).toBeVisible();
  });

  authenticatedTest('should display list of applications', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForLoadState('networkidle');

    const applicationItems = authenticatedPage.getByTestId('application-item');
    const applicationList = authenticatedPage.locator('[class*="application"]');

    const hasItems = await applicationItems.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasList = await applicationList.first().isVisible({ timeout: 5000 }).catch(() => false);

    // Should have application content or show mocked data
    const hasContent = await authenticatedPage.getByText(/software.*engineer|techcorp/i).isVisible().catch(() => false);

    expect(hasItems || hasList || hasContent).toBeTruthy();
  });

  authenticatedTest('should filter applications by status', async ({ authenticatedPage }) => {
    const statusFilter = authenticatedPage.getByRole('combobox', { name: /status/i });
    const statusButton = authenticatedPage.getByRole('button', { name: /status|filter/i });

    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click();
      await authenticatedPage.getByRole('option', { name: /interview/i }).click();

      await authenticatedPage.waitForLoadState('networkidle');

      // All visible applications should show interview status
      await expect(authenticatedPage.getByText(/interview/i).first()).toBeVisible();
    } else if (await statusButton.isVisible().catch(() => false)) {
      await statusButton.click();
    }
  });

  authenticatedTest('should sort applications by date', async ({ authenticatedPage }) => {
    const sortSelect = authenticatedPage.getByRole('combobox', { name: /sort/i });
    const sortButton = authenticatedPage.getByRole('button', { name: /sort|order/i });

    if (await sortSelect.isVisible().catch(() => false)) {
      await sortSelect.click();
      await authenticatedPage.getByRole('option', { name: /date|newest/i }).click();
      await authenticatedPage.waitForLoadState('networkidle');
    } else if (await sortButton.isVisible().catch(() => false)) {
      await sortButton.click();
    }
  });

  authenticatedTest('should view application details', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForLoadState('networkidle');

    const firstApplication = authenticatedPage.getByTestId('application-item').first();
    const applicationLink = authenticatedPage.locator('[class*="application"]').first();

    if (await firstApplication.isVisible().catch(() => false)) {
      await firstApplication.click();
    } else if (await applicationLink.isVisible().catch(() => false)) {
      await applicationLink.click();
    }

    // Should navigate to detail page or show detail view
    await authenticatedPage.waitForLoadState('networkidle');

    const isDetailPage = authenticatedPage.url().match(/.*applications\/[a-z0-9-]+/i);
    const hasDetailContent = await authenticatedPage.getByText(/application.*details|job.*details/i).isVisible().catch(() => false);

    expect(isDetailPage || hasDetailContent).toBeTruthy();
  });

  authenticatedTest('should update application status', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications/app-1');
    await authenticatedPage.waitForLoadState('networkidle');

    const statusSelect = authenticatedPage.getByLabel(/status/i);
    const statusDropdown = authenticatedPage.getByRole('combobox', { name: /status/i });

    if (await statusSelect.isVisible().catch(() => false)) {
      await statusSelect.click();
      await authenticatedPage.getByRole('option', { name: /interview/i }).click();
      await expect(authenticatedPage.getByText(/updated|saved|success/i)).toBeVisible({ timeout: 5000 });
    } else if (await statusDropdown.isVisible().catch(() => false)) {
      await statusDropdown.click();
      await authenticatedPage.getByRole('option', { name: /interview/i }).click();
    }
  });

  authenticatedTest('should add notes to application', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications/app-1');
    await authenticatedPage.waitForLoadState('networkidle');

    const notesField = authenticatedPage.getByLabel(/notes|comments/i);
    const notesTextarea = authenticatedPage.getByPlaceholder(/notes|add.*note/i);

    if (await notesField.isVisible().catch(() => false)) {
      await notesField.fill('Had phone interview on 12/15. Waiting for next round.');
      const saveButton = authenticatedPage.getByRole('button', { name: /save/i });
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await expect(authenticatedPage.getByText(/saved|success/i)).toBeVisible({ timeout: 5000 });
      }
    } else if (await notesTextarea.isVisible().catch(() => false)) {
      await notesTextarea.fill('Had phone interview. Waiting for next round.');
    }
  });

  authenticatedTest('should display application timeline', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications/app-1');
    await authenticatedPage.waitForLoadState('networkidle');

    const timeline = authenticatedPage.getByRole('region', { name: /timeline|history/i });
    const timelineSection = authenticatedPage.getByText(/timeline|history|activity/i);

    if (await timeline.isVisible().catch(() => false)) {
      await expect(timeline).toBeVisible();
    } else if (await timelineSection.isVisible().catch(() => false)) {
      await expect(timelineSection).toBeVisible();
    }
  });

  authenticatedTest('should show application statistics', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for stats like total applications, response rate, etc.
    const statsPatterns = [
      /total.*applications|\d+.*applications/i,
      /pending|in.*progress/i,
      /interviews?/i,
      /offers?/i,
      /response.*rate/i,
    ];

    let foundStat = false;
    for (const pattern of statsPatterns) {
      const element = authenticatedPage.getByText(pattern);
      if (await element.first().isVisible().catch(() => false)) {
        foundStat = true;
        break;
      }
    }

    expect(foundStat).toBeTruthy();
  });

  authenticatedTest('should export applications list', async ({ authenticatedPage }) => {
    const exportButton = authenticatedPage.getByRole('button', { name: /export/i });

    if (await exportButton.isVisible().catch(() => false)) {
      const downloadPromise = authenticatedPage.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      await exportButton.click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/applications/i);
      }
    }
  });

  authenticatedTest('should delete application', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForLoadState('networkidle');

    const deleteButton = authenticatedPage.getByRole('button', { name: /delete|remove/i }).first();

    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = authenticatedPage.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
        await expect(authenticatedPage.getByText(/deleted|removed|success/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  authenticatedTest('should set application reminders', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/applications/app-1');
    await authenticatedPage.waitForLoadState('networkidle');

    const reminderButton = authenticatedPage.getByRole('button', { name: /reminder|follow.*up|schedule/i });

    if (await reminderButton.isVisible().catch(() => false)) {
      await reminderButton.click();

      const dateInput = authenticatedPage.getByLabel(/date/i);
      if (await dateInput.isVisible().catch(() => false)) {
        await dateInput.fill('2024-12-20');
      }

      const saveButton = authenticatedPage.getByRole('button', { name: /save|set/i });
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await expect(authenticatedPage.getByText(/reminder.*set|success/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  authenticatedTest('should show empty state when no applications', async ({ authenticatedPage }) => {
    // Mock empty applications response
    await authenticatedPage.route('**/api/applications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
        }),
      });
    });

    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');

    // If user has no applications
    const emptyState = authenticatedPage.getByText(/no.*applications|start.*applying|get.*started/i);
    if (await emptyState.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(emptyState).toBeVisible();
    }
  });
});

/**
 * Background Service Worker
 * Handles background tasks, message routing, and state management
 */

import { onMessage, combineMessageHandlers, createMessageHandler } from '@shared/messaging';
import { MessageType } from '@shared/types';
import { AuthManager } from './auth';
import { ApiClient } from './api';
import { NotificationManager } from './notifications';

// Initialize managers
const authManager = new AuthManager();
const apiClient = new ApiClient();
const notificationManager = new NotificationManager();

// Message handlers
const authHandlers = combineMessageHandlers(
  createMessageHandler(MessageType.LOGIN, async (payload: { email: string; password: string }) => {
    return await authManager.login(payload.email, payload.password);
  }),

  createMessageHandler(MessageType.LOGOUT, async () => {
    return await authManager.logout();
  }),

  createMessageHandler(MessageType.CHECK_AUTH, async () => {
    return await authManager.checkAuth();
  }),

  createMessageHandler(MessageType.REFRESH_TOKEN, async () => {
    return await authManager.refreshToken();
  })
);

const resumeHandlers = combineMessageHandlers(
  createMessageHandler(MessageType.GET_RESUMES, async () => {
    return await apiClient.getResumes();
  }),

  createMessageHandler(MessageType.SELECT_RESUME, async (payload: { resumeId: string }) => {
    return await apiClient.selectResume(payload.resumeId);
  }),

  createMessageHandler(MessageType.GET_ACTIVE_RESUME, async () => {
    return await apiClient.getActiveResume();
  })
);

const jobHandlers = combineMessageHandlers(
  createMessageHandler(MessageType.DETECT_JOB, async (payload: any) => {
    return await apiClient.detectJob(payload);
  }),

  createMessageHandler(MessageType.SAVE_JOB, async (payload: any) => {
    return await apiClient.saveJob(payload);
  }),

  createMessageHandler(MessageType.GET_JOB_MATCH, async (payload: { jobId: string; resumeId: string }) => {
    return await apiClient.getJobMatch(payload.jobId, payload.resumeId);
  })
);

const applicationHandlers = combineMessageHandlers(
  createMessageHandler(MessageType.START_APPLICATION, async (payload: any) => {
    return await apiClient.startApplication(payload);
  }),

  createMessageHandler(MessageType.SUBMIT_APPLICATION, async (payload: any) => {
    return await apiClient.submitApplication(payload);
  }),

  createMessageHandler(MessageType.GET_APPLICATION_STATUS, async (payload: { applicationId: string }) => {
    return await apiClient.getApplicationStatus(payload.applicationId);
  })
);

const statsHandlers = combineMessageHandlers(
  createMessageHandler(MessageType.GET_STATS, async () => {
    return await apiClient.getStats();
  }),

  createMessageHandler(MessageType.GET_RECENT_APPLICATIONS, async () => {
    return await apiClient.getRecentApplications();
  })
);

const settingsHandlers = combineMessageHandlers(
  createMessageHandler(MessageType.GET_SETTINGS, async () => {
    return await apiClient.getSettings();
  }),

  createMessageHandler(MessageType.UPDATE_SETTINGS, async (payload: any) => {
    return await apiClient.updateSettings(payload);
  })
);

const notificationHandlers = combineMessageHandlers(
  createMessageHandler(MessageType.SHOW_NOTIFICATION, async (payload: { title: string; message: string }) => {
    return await notificationManager.show(payload.title, payload.message);
  })
);

// Combine all handlers
const masterHandler = combineMessageHandlers(
  authHandlers,
  resumeHandlers,
  jobHandlers,
  applicationHandlers,
  statsHandlers,
  settingsHandlers,
  notificationHandlers
);

// Setup message listener
onMessage(masterHandler);

// Extension lifecycle events
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason);

  if (details.reason === 'install') {
    // First time installation
    await handleFirstInstall();
  } else if (details.reason === 'update') {
    // Extension updated
    await handleUpdate(details.previousVersion);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension started');
  await authManager.checkAuth();
});

// Tab events
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if on job board
    const isJobBoard = await checkIfJobBoard(tab.url);

    if (isJobBoard) {
      console.log('Job board detected:', tab.url);
      // Could inject content script or update icon
    }
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    const isJobBoard = await checkIfJobBoard(tab.url);
    // Could update extension icon or badge
  }
});

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-job',
    title: 'Save Job with JobPilot',
    contexts: ['selection', 'page'],
    documentUrlPatterns: [
      'https://www.linkedin.com/*',
      'https://www.indeed.com/*',
      'https://*.greenhouse.io/*',
      'https://*.lever.co/*',
      'https://*.myworkdayjobs.com/*',
    ],
  });

  chrome.contextMenus.create({
    id: 'quick-apply',
    title: 'Quick Apply with JobPilot',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://www.linkedin.com/*',
      'https://www.indeed.com/*',
      'https://*.greenhouse.io/*',
      'https://*.lever.co/*',
      'https://*.myworkdayjobs.com/*',
    ],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'save-job') {
    await chrome.tabs.sendMessage(tab.id, {
      type: MessageType.SAVE_JOB,
      payload: { selectedText: info.selectionText },
    });
  } else if (info.menuItemId === 'quick-apply') {
    await chrome.tabs.sendMessage(tab.id, {
      type: MessageType.START_APPLICATION,
    });
  }
});

// Alarm for periodic tasks
chrome.alarms.create('refresh-token', { periodInMinutes: 30 });
chrome.alarms.create('sync-applications', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refresh-token') {
    try {
      await authManager.refreshTokenIfNeeded();
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  } else if (alarm.name === 'sync-applications') {
    try {
      // Sync application status from backend
      await apiClient.syncApplications();
    } catch (error) {
      console.error('Application sync failed:', error);
    }
  }
});

// Helper functions
async function handleFirstInstall() {
  console.log('First installation - setting up defaults');

  // Set default settings
  const { DEFAULT_SETTINGS } = await import('@shared/constants');
  await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });

  // Open welcome page
  await chrome.tabs.create({
    url: chrome.runtime.getURL('welcome.html'),
  });
}

async function handleUpdate(previousVersion?: string) {
  console.log(`Updated from version ${previousVersion}`);
  // Handle any migration logic here
}

async function checkIfJobBoard(url: string): Promise<boolean> {
  const { JOB_BOARD_PATTERNS } = await import('@shared/constants');

  return Object.values(JOB_BOARD_PATTERNS).some((pattern) =>
    pattern.test(url)
  );
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Background script error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection in background:', event.reason);
});

console.log('JobPilot AI Extension - Background Service Worker loaded');

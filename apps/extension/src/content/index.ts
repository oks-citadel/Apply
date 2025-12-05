/**
 * Content Script Entry Point
 * Runs on job board pages to detect jobs and inject UI
 */

import { onMessage, createMessageHandler, combineMessageHandlers } from '@shared/messaging';
import { MessageType, DetectedJob, JobPlatform } from '@shared/types';
import { JobDetector } from './detector';
import { UIInjector } from './injector';
import { FormFiller } from './formFiller';
import './styles/injected.css';

class ContentScript {
  private detector: JobDetector;
  private injector: UIInjector;
  private formFiller: FormFiller;
  private currentJob: DetectedJob | null = null;

  constructor() {
    this.detector = new JobDetector();
    this.injector = new UIInjector();
    this.formFiller = new FormFiller();
  }

  async initialize() {
    console.log('[JobPilot] Content script loaded');

    // Detect job on current page
    await this.detectAndInject();

    // Setup message handlers
    this.setupMessageHandlers();

    // Watch for page changes (SPA navigation)
    this.watchForPageChanges();
  }

  private async detectAndInject() {
    try {
      const job = await this.detector.detectJob();

      if (job) {
        console.log('[JobPilot] Job detected:', job);
        this.currentJob = job;

        // Inject UI elements
        this.injector.injectFloatingButton(job);
        this.injector.injectJobPanel(job);

        // Notify background script
        chrome.runtime.sendMessage({
          type: MessageType.DETECT_JOB,
          payload: job,
        });
      }
    } catch (error) {
      console.error('[JobPilot] Detection failed:', error);
    }
  }

  private setupMessageHandlers() {
    const handlers = combineMessageHandlers(
      createMessageHandler(MessageType.DETECT_JOB, async () => {
        return this.currentJob;
      }),

      createMessageHandler(MessageType.START_APPLICATION, async () => {
        if (!this.currentJob) {
          throw new Error('No job detected');
        }
        return await this.startApplication();
      }),

      createMessageHandler(MessageType.AUTOFILL_FORM, async (payload: any) => {
        return await this.formFiller.autofillForm(payload.resume);
      }),

      createMessageHandler(MessageType.SAVE_JOB, async () => {
        if (!this.currentJob) {
          throw new Error('No job detected');
        }
        return this.currentJob;
      })
    );

    onMessage(handlers);
  }

  private async startApplication() {
    if (!this.currentJob) {
      throw new Error('No job detected');
    }

    console.log('[JobPilot] Starting application for:', this.currentJob.title);

    // Click apply button if found
    if (this.currentJob.applyButton) {
      this.currentJob.applyButton.click();

      // Wait for form to load
      await this.waitForApplicationForm();

      // Show autofill overlay
      this.injector.showAutofillOverlay();
    }

    return { success: true };
  }

  private async waitForApplicationForm(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const formFields = this.detector.detectFormFields();
        if (formFields.length > 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    });
  }

  private watchForPageChanges() {
    // Watch for URL changes (for SPAs)
    let lastUrl = window.location.href;

    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('[JobPilot] Page changed, re-detecting');
        this.detectAndInject();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also listen to popstate
    window.addEventListener('popstate', () => {
      this.detectAndInject();
    });

    // Listen to pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      window.dispatchEvent(new Event('pushstate'));
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event('replacestate'));
    };

    window.addEventListener('pushstate', () => {
      this.detectAndInject();
    });

    window.addEventListener('replacestate', () => {
      this.detectAndInject();
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const contentScript = new ContentScript();
    contentScript.initialize();
  });
} else {
  const contentScript = new ContentScript();
  contentScript.initialize();
}

// Handle extension context invalidated
window.addEventListener('beforeunload', () => {
  console.log('[JobPilot] Content script unloading');
});

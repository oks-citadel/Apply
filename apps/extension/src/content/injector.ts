/**
 * UI Injector
 * Injects extension UI elements into job board pages
 */

import { DetectedJob } from '@shared/types';

export class UIInjector {
  private floatingButton: HTMLElement | null = null;
  private jobPanel: HTMLElement | null = null;
  private autofillOverlay: HTMLElement | null = null;

  /**
   * Inject floating action button
   */
  injectFloatingButton(_job: DetectedJob): void {
    // Remove existing button if present
    if (this.floatingButton) {
      this.floatingButton.remove();
    }

    const button = document.createElement('div');
    button.id = 'jobpilot-floating-button';
    button.className = 'jobpilot-floating-btn';
    button.innerHTML = `
      <button title="JobPilot Quick Actions">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </button>
    `;

    button.addEventListener('click', () => {
      this.toggleJobPanel();
    });

    document.body.appendChild(button);
    this.floatingButton = button;
  }

  /**
   * Inject job information panel
   */
  injectJobPanel(job: DetectedJob): void {
    // Remove existing panel if present
    if (this.jobPanel) {
      this.jobPanel.remove();
    }

    const panel = document.createElement('div');
    panel.id = 'jobpilot-job-panel';
    panel.className = 'jobpilot-panel jobpilot-panel-hidden';
    panel.innerHTML = `
      <div class="jobpilot-panel-header">
        <h3>JobPilot</h3>
        <button class="jobpilot-close-btn" title="Close">&times;</button>
      </div>
      <div class="jobpilot-panel-content">
        <div class="jobpilot-job-info">
          <h4>${this.escapeHtml(job.title)}</h4>
          <p class="jobpilot-company">${this.escapeHtml(job.company)}</p>
          <p class="jobpilot-location">${this.escapeHtml(job.location)}</p>
        </div>
        <div class="jobpilot-actions">
          <button class="jobpilot-btn jobpilot-btn-primary" id="jobpilot-save-job">
            Save Job
          </button>
          <button class="jobpilot-btn jobpilot-btn-primary" id="jobpilot-quick-apply">
            Quick Apply
          </button>
          <button class="jobpilot-btn jobpilot-btn-secondary" id="jobpilot-analyze">
            Analyze Match
          </button>
        </div>
        <div class="jobpilot-stats" id="jobpilot-stats" style="display: none;">
          <p class="jobpilot-match-score">Match Score: <span>-</span></p>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = panel.querySelector('.jobpilot-close-btn');
    closeBtn?.addEventListener('click', () => {
      this.hideJobPanel();
    });

    const saveBtn = panel.querySelector('#jobpilot-save-job');
    saveBtn?.addEventListener('click', () => {
      this.handleSaveJob(job);
    });

    const applyBtn = panel.querySelector('#jobpilot-quick-apply');
    applyBtn?.addEventListener('click', () => {
      this.handleQuickApply(job);
    });

    const analyzeBtn = panel.querySelector('#jobpilot-analyze');
    analyzeBtn?.addEventListener('click', () => {
      this.handleAnalyzeJob(job);
    });

    document.body.appendChild(panel);
    this.jobPanel = panel;
  }

  /**
   * Show autofill overlay
   */
  showAutofillOverlay(): void {
    if (this.autofillOverlay) {
      this.autofillOverlay.style.display = 'flex';
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'jobpilot-autofill-overlay';
    overlay.className = 'jobpilot-overlay';
    overlay.innerHTML = `
      <div class="jobpilot-overlay-content">
        <div class="jobpilot-overlay-header">
          <h3>Auto-fill Application</h3>
          <button class="jobpilot-close-btn" title="Close">&times;</button>
        </div>
        <div class="jobpilot-overlay-body">
          <p>Select a resume to auto-fill this application:</p>
          <div id="jobpilot-resume-selector">
            <p>Loading resumes...</p>
          </div>
          <div class="jobpilot-overlay-actions">
            <button class="jobpilot-btn jobpilot-btn-secondary" id="jobpilot-cancel-autofill">
              Cancel
            </button>
            <button class="jobpilot-btn jobpilot-btn-primary" id="jobpilot-start-autofill">
              Start Auto-fill
            </button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = overlay.querySelector('.jobpilot-close-btn');
    closeBtn?.addEventListener('click', () => {
      this.hideAutofillOverlay();
    });

    const cancelBtn = overlay.querySelector('#jobpilot-cancel-autofill');
    cancelBtn?.addEventListener('click', () => {
      this.hideAutofillOverlay();
    });

    const startBtn = overlay.querySelector('#jobpilot-start-autofill');
    startBtn?.addEventListener('click', () => {
      this.startAutofill();
    });

    document.body.appendChild(overlay);
    this.autofillOverlay = overlay;

    // Load resumes
    this.loadResumes();
  }

  /**
   * Hide autofill overlay
   */
  hideAutofillOverlay(): void {
    if (this.autofillOverlay) {
      this.autofillOverlay.style.display = 'none';
    }
  }

  /**
   * Toggle job panel visibility
   */
  private toggleJobPanel(): void {
    if (this.jobPanel) {
      this.jobPanel.classList.toggle('jobpilot-panel-hidden');
    }
  }

  /**
   * Hide job panel
   */
  private hideJobPanel(): void {
    if (this.jobPanel) {
      this.jobPanel.classList.add('jobpilot-panel-hidden');
    }
  }

  /**
   * Handle save job action
   */
  private handleSaveJob(job: DetectedJob): void {
    chrome.runtime.sendMessage({
      type: 'SAVE_JOB',
      payload: job,
    });
  }

  /**
   * Handle quick apply action
   */
  private handleQuickApply(job: DetectedJob): void {
    if (job.applyButton) {
      job.applyButton.click();
      setTimeout(() => {
        this.showAutofillOverlay();
      }, 1000);
    } else {
      this.showAutofillOverlay();
    }
  }

  /**
   * Handle analyze job action
   */
  private handleAnalyzeJob(job: DetectedJob): void {
    chrome.runtime.sendMessage({
      type: 'ANALYZE_JOB',
      payload: job,
    }, (response) => {
      if (response?.matchScore) {
        const statsDiv = this.jobPanel?.querySelector('#jobpilot-stats');
        const scoreSpan = statsDiv?.querySelector('span');
        if (statsDiv && scoreSpan) {
          (statsDiv as HTMLElement).style.display = 'block';
          scoreSpan.textContent = `${response.matchScore}%`;
        }
      }
    });
  }

  /**
   * Load resumes from storage
   */
  private async loadResumes(): Promise<void> {
    const selector = this.autofillOverlay?.querySelector('#jobpilot-resume-selector');
    if (!selector) return;

    try {
      chrome.runtime.sendMessage(
        { type: 'GET_RESUMES' },
        (response) => {
          if (response?.resumes) {
            this.renderResumeSelector(response.resumes);
          } else {
            selector.innerHTML = '<p>No resumes found. Please create a resume first.</p>';
          }
        }
      );
    } catch (error) {
      selector.innerHTML = '<p>Error loading resumes.</p>';
    }
  }

  /**
   * Render resume selector
   */
  private renderResumeSelector(resumes: any[]): void {
    const selector = this.autofillOverlay?.querySelector('#jobpilot-resume-selector');
    if (!selector) return;

    if (resumes.length === 0) {
      selector.innerHTML = '<p>No resumes found. Please create a resume first.</p>';
      return;
    }

    selector.innerHTML = `
      <select id="jobpilot-resume-select" class="jobpilot-select">
        ${resumes.map((resume) => `
          <option value="${resume.id}" ${resume.isDefault ? 'selected' : ''}>
            ${this.escapeHtml(resume.name)}
          </option>
        `).join('')}
      </select>
    `;
  }

  /**
   * Start autofill process
   */
  private startAutofill(): void {
    const select = this.autofillOverlay?.querySelector<HTMLSelectElement>('#jobpilot-resume-select');
    const resumeId = select?.value;

    if (!resumeId) {
      alert('Please select a resume');
      return;
    }

    chrome.runtime.sendMessage({
      type: 'START_AUTOFILL',
      payload: { resumeId },
    });

    this.hideAutofillOverlay();
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

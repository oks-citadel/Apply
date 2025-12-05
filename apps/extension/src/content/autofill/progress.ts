/**
 * Progress tracking for autofill operations
 */

import { AutofillProgress } from './types';

export class ProgressTracker {
  private progress: AutofillProgress = {
    status: 'idle',
    currentStep: '',
    progress: 0,
  };

  private listeners: Array<(progress: AutofillProgress) => void> = [];
  private totalSteps: number = 0;
  private currentStepNumber: number = 0;

  /**
   * Start tracking
   */
  public start(): void {
    this.progress = {
      status: 'idle',
      currentStep: 'Initializing...',
      progress: 0,
    };
    this.totalSteps = 0;
    this.currentStepNumber = 0;
    this.notifyListeners();
  }

  /**
   * Update status
   */
  public updateStatus(
    status: AutofillProgress['status'],
    message?: string,
    currentField?: string
  ): void {
    this.progress = {
      ...this.progress,
      status,
      currentStep: message || this.progress.currentStep,
      message,
      currentField,
    };
    this.notifyListeners();
  }

  /**
   * Set total steps
   */
  public setTotalSteps(total: number): void {
    this.totalSteps = total;
  }

  /**
   * Update progress
   */
  public updateProgress(current: number, total?: number): void {
    if (total) {
      this.totalSteps = total;
    }

    this.currentStepNumber = current;

    const progress = this.totalSteps > 0 ? (current / this.totalSteps) * 100 : 0;

    this.progress = {
      ...this.progress,
      progress: Math.min(Math.round(progress), 100),
    };

    this.notifyListeners();
  }

  /**
   * Set current field being filled
   */
  public setCurrentField(field: string): void {
    this.progress = {
      ...this.progress,
      currentField: field,
      currentStep: `Filling: ${field}`,
    };
    this.notifyListeners();
  }

  /**
   * Complete tracking
   */
  public complete(): void {
    this.progress = {
      status: 'completed',
      currentStep: 'Autofill completed successfully',
      progress: 100,
      message: 'All fields have been filled',
    };
    this.notifyListeners();
  }

  /**
   * Mark as error
   */
  public error(message: string): void {
    this.progress = {
      status: 'error',
      currentStep: 'Error occurred',
      progress: this.progress.progress,
      message,
    };
    this.notifyListeners();
  }

  /**
   * Get current progress
   */
  public getProgress(): AutofillProgress {
    return { ...this.progress };
  }

  /**
   * Subscribe to progress updates
   */
  public onProgress(callback: (progress: AutofillProgress) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Unsubscribe from progress updates
   */
  public offProgress(callback: (progress: AutofillProgress) => void): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const progressCopy = { ...this.progress };
    this.listeners.forEach((listener) => {
      try {
        listener(progressCopy);
      } catch (error) {
        console.error('Error in progress listener:', error);
      }
    });
  }

  /**
   * Reset tracker
   */
  public reset(): void {
    this.progress = {
      status: 'idle',
      currentStep: '',
      progress: 0,
    };
    this.totalSteps = 0;
    this.currentStepNumber = 0;
    this.notifyListeners();
  }

  /**
   * Get current step number
   */
  public getCurrentStep(): number {
    return this.currentStepNumber;
  }

  /**
   * Get total steps
   */
  public getTotalSteps(): number {
    return this.totalSteps;
  }

  /**
   * Increment progress
   */
  public incrementProgress(): void {
    this.updateProgress(this.currentStepNumber + 1);
  }
}

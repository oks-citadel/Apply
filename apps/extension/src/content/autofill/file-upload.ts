/**
 * File upload handler for resume attachments
 */

export class FileUploadHandler {
  private supportedFormats = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];

  /**
   * Handle file upload to input element
   */
  public async handleFileUpload(input: HTMLInputElement, file: File): Promise<void> {
    if (!this.isValidFileType(file)) {
      throw new Error(
        `Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Create DataTransfer object to set files on input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // Set files on input
    input.files = dataTransfer.files;

    // Trigger change events
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for upload to complete (if there's any visual feedback)
    await this.waitForUploadComplete(input);
  }

  /**
   * Handle file upload from URL
   */
  public async handleFileUploadFromUrl(
    input: HTMLInputElement,
    url: string,
    filename: string = 'resume.pdf'
  ): Promise<void> {
    try {
      // Fetch file from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type });

      await this.handleFileUpload(input, file);
    } catch (error) {
      throw new Error(`Failed to upload file from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all file upload inputs on the page
   */
  public findFileInputs(): HTMLInputElement[] {
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    return Array.from(inputs).filter((input) => {
      // Filter out hidden inputs
      return input.offsetWidth > 0 && input.offsetHeight > 0;
    });
  }

  /**
   * Check if file type is valid
   */
  private isValidFileType(file: File): boolean {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return this.supportedFormats.includes(extension);
  }

  /**
   * Wait for upload to complete
   */
  private async waitForUploadComplete(input: HTMLInputElement, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();

    // Look for upload progress indicators
    const container = input.closest('.file-upload, .upload-container, [class*="upload"]');

    if (!container) {
      // No container found, assume immediate completion
      await this.delay(500);
      return;
    }

    while (Date.now() - startTime < timeout) {
      // Check for progress indicators
      const progressBar = container.querySelector('.progress, [role="progressbar"]');
      const spinner = container.querySelector('.spinner, .loading, [class*="loading"]');
      const successIndicator = container.querySelector('.success, .complete, [class*="success"]');

      if (successIndicator) {
        // Upload complete
        return;
      }

      if (!progressBar && !spinner) {
        // No progress indicators, assume complete
        return;
      }

      await this.delay(100);
    }
  }

  /**
   * Get upload status
   */
  public getUploadStatus(input: HTMLInputElement): {
    uploaded: boolean;
    filename?: string;
    error?: string;
  } {
    if (input.files && input.files.length > 0) {
      return {
        uploaded: true,
        filename: input.files[0].name,
      };
    }

    // Check for error messages
    const container = input.closest('.file-upload, .upload-container, [class*="upload"]');
    if (container) {
      const errorElement = container.querySelector('.error, .error-message, [class*="error"]');
      if (errorElement && errorElement.textContent) {
        return {
          uploaded: false,
          error: errorElement.textContent.trim(),
        };
      }
    }

    return {
      uploaded: false,
    };
  }

  /**
   * Clear file upload
   */
  public clearFileUpload(input: HTMLInputElement): void {
    input.value = '';
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Convert file to base64
   */
  public async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get file preview (for PDFs)
   */
  public async getFilePreview(file: File): Promise<string | null> {
    if (file.type === 'application/pdf') {
      return await this.fileToBase64(file);
    }
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

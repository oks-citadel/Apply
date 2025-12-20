import { Processor, Process, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from '../../email/email.service';

export interface EmailJob {
  to: string;
  subject: string;
  template?: string;
  templateData?: Record<string, any>;
  body?: string;
  isHtml?: boolean;
}

export interface WelcomeEmailJob {
  email: string;
  name: string;
  userId: string;
}

export interface VerificationEmailJob {
  email: string;
  name: string;
  verificationToken: string;
}

export interface PasswordResetEmailJob {
  email: string;
  name: string;
  resetToken: string;
}

export interface ApplicationStatusEmailJob {
  email: string;
  name: string;
  jobTitle: string;
  companyName: string;
  status: string;
  message?: string;
}

export interface WeeklyDigestEmailJob {
  email: string;
  name: string;
  digestData: {
    applications: number;
    interviews: number;
    offers: number;
    rejections: number;
    newJobs: number;
    topJobs?: Array<{
      title: string;
      company: string;
      location: string;
      url: string;
    }>;
  };
}

@Processor('email')
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJob>) {
    this.logger.log(`Processing email job ${job.id} to ${job.data.to}`);

    try {
      const { to, subject, template, templateData, body, isHtml } = job.data;

      if (template && templateData) {
        await this.emailService.sendTemplatedEmail(
          to,
          subject,
          template,
          templateData,
        );
      } else if (body) {
        await this.emailService.sendEmail(to, subject, body, isHtml);
      } else {
        throw new Error('Either template or body must be provided');
      }

      this.logger.log(`Email sent successfully to ${to}`);
      return { success: true, recipient: to };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('send-welcome-email')
  async handleWelcomeEmail(job: Job<WelcomeEmailJob>) {
    this.logger.log(
      `Processing welcome email job ${job.id} for ${job.data.email}`,
    );

    try {
      const { email, name } = job.data;
      await this.emailService.sendWelcomeEmail(email, name);

      this.logger.log(`Welcome email sent successfully to ${email}`);
      return { success: true, recipient: email };
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('send-verification-email')
  async handleVerificationEmail(job: Job<VerificationEmailJob>) {
    this.logger.log(
      `Processing verification email job ${job.id} for ${job.data.email}`,
    );

    try {
      const { email, name, verificationToken } = job.data;
      await this.emailService.sendVerificationEmail(
        email,
        name,
        verificationToken,
      );

      this.logger.log(`Verification email sent successfully to ${email}`);
      return { success: true, recipient: email };
    } catch (error) {
      this.logger.error(
        `Failed to send verification email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('send-password-reset-email')
  async handlePasswordResetEmail(job: Job<PasswordResetEmailJob>) {
    this.logger.log(
      `Processing password reset email job ${job.id} for ${job.data.email}`,
    );

    try {
      const { email, name, resetToken } = job.data;
      await this.emailService.sendPasswordResetEmail(email, name, resetToken);

      this.logger.log(`Password reset email sent successfully to ${email}`);
      return { success: true, recipient: email };
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('send-application-status-email')
  async handleApplicationStatusEmail(job: Job<ApplicationStatusEmailJob>) {
    this.logger.log(
      `Processing application status email job ${job.id} for ${job.data.email}`,
    );

    try {
      const { email, name, jobTitle, companyName, status, message } = job.data;
      await this.emailService.sendApplicationStatusEmail(
        email,
        name,
        jobTitle,
        companyName,
        status,
        message,
      );

      this.logger.log(`Application status email sent successfully to ${email}`);
      return { success: true, recipient: email };
    } catch (error) {
      this.logger.error(
        `Failed to send application status email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('send-weekly-digest-email')
  async handleWeeklyDigestEmail(job: Job<WeeklyDigestEmailJob>) {
    this.logger.log(
      `Processing weekly digest email job ${job.id} for ${job.data.email}`,
    );

    try {
      const { email, name, digestData } = job.data;
      await this.emailService.sendWeeklyDigestEmail(email, name, digestData);

      this.logger.log(`Weekly digest email sent successfully to ${email}`);
      return { success: true, recipient: email };
    } catch (error) {
      this.logger.error(
        `Failed to send weekly digest email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error(`Queue error: ${error.message}`, error.stack);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed with error: ${error.message}`,
      error.stack,
    );
  }
}

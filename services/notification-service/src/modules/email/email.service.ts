import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly frontendUrl: string;
  private readonly emailFrom: string;
  private readonly emailFromName: string;

  constructor(private configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    this.emailFrom = this.configService.get<string>(
      'EMAIL_FROM',
      'noreply@jobapply.com',
    );
    this.emailFromName = this.configService.get<string>(
      'EMAIL_FROM_NAME',
      'Job Apply Platform',
    );

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });

    this.logger.log('Email service initialized');
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    isHtml = true,
  ): Promise<any> {
    try {
      const mailOptions: EmailOptions = {
        from: `"${this.emailFromName}" <${this.emailFrom}>`,
        to,
        subject,
      };

      if (isHtml) {
        mailOptions.html = body;
      } else {
        mailOptions.text = body;
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendTemplatedEmail(
    to: string,
    subject: string,
    template: string,
    data: Record<string, any>,
  ): Promise<any> {
    const html = this.renderTemplate(template, data);
    return this.sendEmail(to, subject, html, true);
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    verificationToken: string,
  ): Promise<any> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Thank you for registering with Job Apply Platform. Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Job Apply Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, 'Verify Your Email Address', html, true);
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<any> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
              <div class="warning">
                <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Job Apply Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, 'Reset Your Password', html, true);
  }

  async sendApplicationStatusEmail(
    to: string,
    name: string,
    jobTitle: string,
    companyName: string,
    status: string,
    message?: string,
  ): Promise<any> {
    const statusColors = {
      applied: '#4F46E5',
      reviewing: '#F59E0B',
      interviewing: '#8B5CF6',
      accepted: '#10B981',
      rejected: '#EF4444',
    };

    const statusColor = statusColors[status.toLowerCase()] || '#6B7280';
    const applicationUrl = `${this.frontendUrl}/applications`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .job-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .status-badge { display: inline-block; padding: 5px 15px; background: ${statusColor}; color: white; border-radius: 20px; font-size: 14px; }
            .button { display: inline-block; padding: 12px 30px; background: ${statusColor}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Your application status has been updated:</p>
              <div class="job-info">
                <h3 style="margin-top: 0;">${jobTitle}</h3>
                <p style="color: #666; margin: 5px 0;">${companyName}</p>
                <p><span class="status-badge">${status.toUpperCase()}</span></p>
              </div>
              ${message ? `<p><strong>Message:</strong></p><p>${message}</p>` : ''}
              <div style="text-align: center;">
                <a href="${applicationUrl}" class="button">View Application</a>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Job Apply Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(
      to,
      `Application Update: ${jobTitle} at ${companyName}`,
      html,
      true,
    );
  }

  async sendJobAlertEmail(
    to: string,
    name: string,
    jobs: Array<{
      title: string;
      company: string;
      location: string;
      salary?: string;
      url: string;
    }>,
  ): Promise<any> {
    const jobListHtml = jobs
      .map(
        (job) => `
      <div class="job-card">
        <h3 style="margin: 0 0 10px 0; color: #4F46E5;">${job.title}</h3>
        <p style="margin: 5px 0; color: #666;">${job.company}</p>
        <p style="margin: 5px 0; color: #666;">${job.location}</p>
        ${job.salary ? `<p style="margin: 5px 0; color: #10B981; font-weight: bold;">${job.salary}</p>` : ''}
        <a href="${job.url}" class="job-link">View Job Details</a>
      </div>
    `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .job-card { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4F46E5; }
            .job-link { display: inline-block; margin-top: 10px; color: #4F46E5; text-decoration: none; font-weight: bold; }
            .button { display: inline-block; padding: 12px 30px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Job Opportunities</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>We found ${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching your preferences:</p>
              ${jobListHtml}
              <div style="text-align: center;">
                <a href="${this.frontendUrl}/jobs" class="button">Browse All Jobs</a>
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 20px;">
                You're receiving this email because you've enabled job alerts.
                You can manage your preferences in your account settings.
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Job Apply Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(
      to,
      `${jobs.length} New Job${jobs.length > 1 ? 's' : ''} Matching Your Preferences`,
      html,
      true,
    );
  }

  private renderTemplate(
    template: string,
    data: Record<string, any>,
  ): string {
    let html = template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value));
    }
    return html;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

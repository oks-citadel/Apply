import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

interface WeeklyDigestData {
  applications: number;
  interviews: number;
  offers: number;
  rejections: number;
  newJobs: number;
  topJobs?: Array<{
    title: string;
    company: string;
    location: string;
    salary?: string;
    url: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly frontendUrl: string;
  private readonly emailFrom: string;
  private readonly emailFromName: string;
  private templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

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
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: this.configService.get<string>('SMTP_USER')
        ? {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASSWORD'),
          }
        : undefined,
      // For MailHog, we don't need auth
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.logger.log('Email service initialized');
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    // Register custom Handlebars helpers
    handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    handlebars.registerHelper('gt', function (a, b) {
      return a > b;
    });

    handlebars.registerHelper('formatDate', function (date) {
      return new Date(date).toLocaleDateString();
    });
  }

  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const templatePath = path.join(
        __dirname,
        '..',
        '..',
        'templates',
        'emails',
        `${templateName}.hbs`,
      );

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(templateContent);

      // Cache the compiled template
      this.templateCache.set(templateName, compiledTemplate);

      return compiledTemplate;
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
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
    templateName: string,
    data: Record<string, any>,
  ): Promise<any> {
    try {
      const template = await this.loadTemplate(templateName);
      const html = template({
        ...data,
        year: new Date().getFullYear(),
      });

      return this.sendEmail(to, subject, html, true);
    } catch (error) {
      this.logger.error(`Failed to send templated email to ${to}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<any> {
    return this.sendTemplatedEmail(to, 'Welcome to Job Apply Platform!', 'welcome', {
      name,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
    });
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    verificationToken: string,
  ): Promise<any> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;

    return this.sendTemplatedEmail(
      to,
      'Verify Your Email Address',
      'verification',
      {
        name,
        verificationUrl,
      },
    );
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<any> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    return this.sendTemplatedEmail(to, 'Reset Your Password', 'password-reset', {
      name,
      resetUrl,
    });
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

    return this.sendTemplatedEmail(
      to,
      `Application Update: ${jobTitle} at ${companyName}`,
      'application-status',
      {
        name,
        jobTitle,
        companyName,
        status,
        message,
        statusColor,
        applicationUrl,
      },
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

  async sendWeeklyDigestEmail(
    to: string,
    name: string,
    digestData: WeeklyDigestData,
  ): Promise<any> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const jobSearchTips = [
      'Customize your resume for each application to highlight relevant skills and experience.',
      'Follow up on applications 1-2 weeks after submission to show your continued interest.',
      'Network actively on LinkedIn by engaging with posts and connecting with professionals in your field.',
      'Practice common interview questions and prepare specific examples from your experience.',
      'Keep your skills updated by taking online courses or working on personal projects.',
      'Research companies thoroughly before applying to ensure cultural fit and alignment with your values.',
      'Update your LinkedIn profile regularly and keep it consistent with your resume.',
    ];

    const randomTip = jobSearchTips[Math.floor(Math.random() * jobSearchTips.length)];

    return this.sendTemplatedEmail(
      to,
      'Your Weekly Job Search Summary',
      'weekly-digest',
      {
        name,
        startDate: weekAgo.toLocaleDateString(),
        endDate: today.toLocaleDateString(),
        applications: digestData.applications,
        interviews: digestData.interviews,
        offers: digestData.offers,
        newJobs: digestData.newJobs,
        topJobs: digestData.topJobs,
        tip: randomTip,
        dashboardUrl: `${this.frontendUrl}/dashboard`,
        preferencesUrl: `${this.frontendUrl}/settings/notifications`,
      },
    );
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

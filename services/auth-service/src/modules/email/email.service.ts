import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { ConfigService } from '@nestjs/config';

import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('email.from');
    this.frontendUrl = this.configService.get<string>('frontendUrl');

    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure'),
      auth: {
        user: this.configService.get<string>('email.auth.user'),
        pass: this.configService.get<string>('email.auth.pass'),
      },
    });

    // Verify transporter configuration
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service is ready to send emails');
    } catch (error) {
      this.logger.error(
        'Email service configuration error. Emails will not be sent.',
        error.stack,
      );
    }
  }

  /**
   * Send verification email to user
   * @param email - User's email address
   * @param token - Email verification token
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Verify Your Email - ApplyForUs AI Platform',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background-color: #4F46E5;
                  color: white;
                  padding: 20px;
                  text-align: center;
                  border-radius: 5px 5px 0 0;
                }
                .content {
                  background-color: #f9fafb;
                  padding: 30px;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                }
                .button {
                  display: inline-block;
                  padding: 12px 30px;
                  background-color: #4F46E5;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  font-size: 12px;
                  color: #6b7280;
                }
                .token {
                  background-color: #e5e7eb;
                  padding: 10px;
                  border-radius: 5px;
                  font-family: monospace;
                  word-break: break-all;
                  margin: 10px 0;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Welcome to ApplyForUs AI!</h1>
              </div>
              <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Thank you for registering with ApplyForUs AI Platform. To complete your registration, please verify your email address by clicking the button below:</p>

                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>

                <p>Or copy and paste this link into your browser:</p>
                <div class="token">${verificationUrl}</div>

                <p><strong>This verification link will expire in 24 hours.</strong></p>

                <p>If you didn't create an account with ApplyForUs AI, please ignore this email.</p>

                <p>Best regards,<br>The ApplyForUs AI Team</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ApplyForUs AI Platform. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
        text: `
Welcome to ApplyForUs AI!

Verify Your Email Address

Thank you for registering with ApplyForUs AI Platform. To complete your registration, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with ApplyForUs AI, please ignore this email.

Best regards,
The ApplyForUs AI Team

© ${new Date().getFullYear()} ApplyForUs AI Platform. All rights reserved.
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent successfully to: ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to: ${email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send password reset email to user
   * @param email - User's email address
   * @param token - Password reset token
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Reset Your Password - ApplyForUs AI Platform',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background-color: #4F46E5;
                  color: white;
                  padding: 20px;
                  text-align: center;
                  border-radius: 5px 5px 0 0;
                }
                .content {
                  background-color: #f9fafb;
                  padding: 30px;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                }
                .button {
                  display: inline-block;
                  padding: 12px 30px;
                  background-color: #DC2626;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  font-size: 12px;
                  color: #6b7280;
                }
                .token {
                  background-color: #e5e7eb;
                  padding: 10px;
                  border-radius: 5px;
                  font-family: monospace;
                  word-break: break-all;
                  margin: 10px 0;
                }
                .warning {
                  background-color: #FEF3C7;
                  border-left: 4px solid #F59E0B;
                  padding: 15px;
                  margin: 20px 0;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password for your ApplyForUs AI account. Click the button below to reset your password:</p>

                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>

                <p>Or copy and paste this link into your browser:</p>
                <div class="token">${resetUrl}</div>

                <div class="warning">
                  <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.
                </div>

                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>

                <p>For security reasons, we recommend that you:</p>
                <ul>
                  <li>Use a strong, unique password</li>
                  <li>Never share your password with anyone</li>
                  <li>Enable two-factor authentication</li>
                </ul>

                <p>Best regards,<br>The ApplyForUs AI Team</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ApplyForUs AI Platform. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
        text: `
Password Reset Request

Reset Your Password

We received a request to reset your password for your ApplyForUs AI account. Visit this link to reset your password:

${resetUrl}

IMPORTANT: This password reset link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

For security reasons, we recommend that you:
- Use a strong, unique password
- Never share your password with anyone
- Enable two-factor authentication

Best regards,
The ApplyForUs AI Team

© ${new Date().getFullYear()} ApplyForUs AI Platform. All rights reserved.
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent successfully to: ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to: ${email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send welcome email after successful verification
   * @param email - User's email address
   * @param firstName - User's first name
   */
  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    try {
      const name = firstName || 'there';

      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to ApplyForUs AI Platform!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background-color: #4F46E5;
                  color: white;
                  padding: 20px;
                  text-align: center;
                  border-radius: 5px 5px 0 0;
                }
                .content {
                  background-color: #f9fafb;
                  padding: 30px;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                }
                .button {
                  display: inline-block;
                  padding: 12px 30px;
                  background-color: #4F46E5;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  font-size: 12px;
                  color: #6b7280;
                }
                .features {
                  background-color: white;
                  padding: 15px;
                  margin: 20px 0;
                  border-radius: 5px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Welcome to ApplyForUs AI! 🎉</h1>
              </div>
              <div class="content">
                <h2>Hi ${name}!</h2>
                <p>Your email has been verified successfully. Welcome to ApplyForUs AI Platform!</p>

                <div class="features">
                  <h3>Get Started:</h3>
                  <ul>
                    <li>Complete your profile</li>
                    <li>Upload your resume</li>
                    <li>Start applying to jobs with AI assistance</li>
                    <li>Track your applications</li>
                  </ul>
                </div>

                <div style="text-align: center;">
                  <a href="${this.frontendUrl}/dashboard" class="button">Go to Dashboard</a>
                </div>

                <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>

                <p>Best regards,<br>The ApplyForUs AI Team</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ApplyForUs AI Platform. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
        text: `
Welcome to ApplyForUs AI!

Hi ${name}!

Your email has been verified successfully. Welcome to ApplyForUs AI Platform!

Get Started:
- Complete your profile
- Upload your resume
- Start applying to jobs with AI assistance
- Track your applications

Visit your dashboard: ${this.frontendUrl}/dashboard

If you have any questions or need assistance, feel free to reach out to our support team.

Best regards,
The ApplyForUs AI Team

© ${new Date().getFullYear()} ApplyForUs AI Platform. All rights reserved.
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent successfully to: ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to: ${email}`,
        error.stack,
      );
      // Don't throw error for welcome email - it's not critical
    }
  }
}

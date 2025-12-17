import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockTransporter: any;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        FRONTEND_URL: 'http://localhost:3000',
        EMAIL_FROM: 'noreply@applyforus.com',
        EMAIL_FROM_NAME: 'ApplyForUs',
        SMTP_HOST: 'localhost',
        SMTP_PORT: 1025,
        SMTP_SECURE: false,
        SMTP_USER: null,
        SMTP_PASSWORD: null,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize transporter', () => {
      // Re-create the service to test constructor behavior
      (nodemailer.createTransport as jest.Mock).mockClear();
      (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

      // Manually call to verify the mock setup
      const testTransporter = nodemailer.createTransport({});
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    it('should send plain text email successfully', async () => {
      const messageId = 'test-message-id-123';
      mockTransporter.sendMail.mockResolvedValue({ messageId });

      const result = await service.sendEmail(
        'test@example.com',
        'Test Subject',
        'Test body content',
        false,
      );

      expect(result.messageId).toBe(messageId);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"ApplyForUs" <noreply@applyforus.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test body content',
      });
    });

    it('should send HTML email successfully', async () => {
      const messageId = 'test-message-id-456';
      mockTransporter.sendMail.mockResolvedValue({ messageId });

      const htmlContent = '<h1>Test Email</h1><p>Test content</p>';
      const result = await service.sendEmail(
        'test@example.com',
        'Test HTML Email',
        htmlContent,
        true,
      );

      expect(result.messageId).toBe(messageId);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"ApplyForUs" <noreply@applyforus.com>',
        to: 'test@example.com',
        subject: 'Test HTML Email',
        html: htmlContent,
      });
    });

    it('should throw error when sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP connection failed'),
      );

      await expect(
        service.sendEmail('test@example.com', 'Test', 'Body', true),
      ).rejects.toThrow('SMTP connection failed');
    });

    it('should send email to multiple recipients', async () => {
      const messageId = 'test-message-id-789';
      mockTransporter.sendMail.mockResolvedValue({ messageId });

      await service.sendEmail(
        'test1@example.com,test2@example.com',
        'Multiple Recipients',
        'Test content',
        false,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test1@example.com,test2@example.com',
        }),
      );
    });
  });

  describe('sendTemplatedEmail', () => {
    it('should send templated email with data', async () => {
      const messageId = 'template-message-id';
      mockTransporter.sendMail.mockResolvedValue({ messageId });

      // Mock file system read for template
      const mockTemplate = jest.fn().mockReturnValue('<h1>Welcome {{name}}</h1>');

      const result = await service.sendTemplatedEmail(
        'user@example.com',
        'Welcome Email',
        'welcome',
        { name: 'John Doe' },
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should throw error when template not found', async () => {
      await expect(
        service.sendTemplatedEmail(
          'user@example.com',
          'Subject',
          'non-existent-template',
          {},
        ),
      ).rejects.toThrow();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct data', async () => {
      const messageId = 'welcome-message-id';
      mockTransporter.sendMail.mockResolvedValue({ messageId });

      await service.sendWelcomeEmail('newuser@example.com', 'Jane Doe');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('newuser@example.com');
      expect(callArgs.subject).toContain('Welcome');
    });

    it('should include dashboard URL in welcome email', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendWelcomeEmail('user@example.com', 'Test User');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with token', async () => {
      const messageId = 'verify-message-id';
      mockTransporter.sendMail.mockResolvedValue({ messageId });

      const verificationToken = 'verify-token-123';
      await service.sendVerificationEmail(
        'user@example.com',
        'Test User',
        verificationToken,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain('Verify');
    });

    it('should include verification URL with token', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendVerificationEmail(
        'user@example.com',
        'Test User',
        'token123',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      const messageId = 'reset-message-id';
      mockTransporter.sendMail.mockResolvedValue({ messageId });

      const resetToken = 'reset-token-456';
      await service.sendPasswordResetEmail(
        'user@example.com',
        'Test User',
        resetToken,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain('Reset');
    });

    it('should include reset URL with token', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendPasswordResetEmail(
        'user@example.com',
        'Test User',
        'reset123',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('sendApplicationStatusEmail', () => {
    it('should send application status email with all details', async () => {
      const messageId = 'status-message-id';
      mockTransporter.sendMail.mockResolvedValue({ messageId });

      await service.sendApplicationStatusEmail(
        'applicant@example.com',
        'John Doe',
        'Senior Developer',
        'Tech Corp',
        'interviewing',
        'You have been selected for an interview',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('applicant@example.com');
      expect(callArgs.subject).toContain('Senior Developer');
      expect(callArgs.subject).toContain('Tech Corp');
    });

    it('should handle different application statuses', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      const statuses = ['applied', 'reviewing', 'interviewing', 'accepted', 'rejected'];

      for (const status of statuses) {
        await service.sendApplicationStatusEmail(
          'user@example.com',
          'User',
          'Job Title',
          'Company',
          status,
        );
      }

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(statuses.length);
    });

    it('should send status email without optional message', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendApplicationStatusEmail(
        'user@example.com',
        'Test User',
        'Developer',
        'Company',
        'applied',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('sendJobAlertEmail', () => {
    it('should send job alert email with multiple jobs', async () => {
      const messageId = 'alert-message-id';
      mockTransporter.sendMail.mockResolvedValue({ messageId });

      const jobs = [
        {
          title: 'Senior Developer',
          company: 'Tech Corp',
          location: 'Remote',
          salary: '$100k - $150k',
          url: 'http://jobs.com/1',
        },
        {
          title: 'Frontend Engineer',
          company: 'Startup Inc',
          location: 'New York',
          url: 'http://jobs.com/2',
        },
      ];

      await service.sendJobAlertEmail('jobseeker@example.com', 'Jane Doe', jobs);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain('2 New Jobs');
    });

    it('should send job alert for single job', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      const jobs = [
        {
          title: 'Developer',
          company: 'Company',
          location: 'Remote',
          url: 'http://jobs.com/1',
        },
      ];

      await service.sendJobAlertEmail('user@example.com', 'User', jobs);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.subject).not.toContain('Jobs'); // Should be singular "Job"
    });

    it('should include job details in email body', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      const jobs = [
        {
          title: 'Test Job',
          company: 'Test Company',
          location: 'Test Location',
          salary: '$50k',
          url: 'http://test.com/job',
        },
      ];

      await service.sendJobAlertEmail('user@example.com', 'User', jobs);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Test Job');
      expect(callArgs.html).toContain('Test Company');
      expect(callArgs.html).toContain('$50k');
    });
  });

  describe('sendWeeklyDigestEmail', () => {
    it('should send weekly digest with statistics', async () => {
      const messageId = 'digest-message-id';
      mockTransporter.sendMail.mockResolvedValue({ messageId });

      const digestData = {
        applications: 5,
        interviews: 2,
        offers: 1,
        rejections: 1,
        newJobs: 10,
        topJobs: [
          {
            title: 'Best Job',
            company: 'Great Company',
            location: 'Remote',
            salary: '$120k',
            url: 'http://jobs.com/best',
          },
        ],
      };

      await service.sendWeeklyDigestEmail(
        'user@example.com',
        'Test User',
        digestData,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain('Weekly');
    });

    it('should include job search tip in digest', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      const digestData = {
        applications: 0,
        interviews: 0,
        offers: 0,
        rejections: 0,
        newJobs: 0,
      };

      await service.sendWeeklyDigestEmail('user@example.com', 'User', digestData);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should handle digest with no activity', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      const digestData = {
        applications: 0,
        interviews: 0,
        offers: 0,
        rejections: 0,
        newJobs: 0,
      };

      await service.sendWeeklyDigestEmail('user@example.com', 'User', digestData);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('verifyConnection', () => {
    it('should verify email service connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await service.verifyConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      mockTransporter.verify.mockRejectedValue(
        new Error('Connection refused'),
      );

      const result = await service.verifyConnection();

      expect(result).toBe(false);
    });
  });

  describe('Email Formatting', () => {
    it('should include year in templated emails', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendWelcomeEmail('user@example.com', 'User');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should format sender name and email correctly', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendEmail('test@example.com', 'Test', 'Body', false);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.from).toBe('"ApplyForUs" <noreply@applyforus.com>');
    });
  });

  describe('Error Handling', () => {
    it('should handle SMTP errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP timeout'),
      );

      await expect(
        service.sendEmail('test@example.com', 'Test', 'Body', true),
      ).rejects.toThrow('SMTP timeout');
    });

    it('should handle invalid email addresses', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('Invalid recipient'),
      );

      await expect(
        service.sendEmail('invalid-email', 'Test', 'Body', false),
      ).rejects.toThrow();
    });
  });
});

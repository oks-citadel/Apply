import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';

import { EmailService } from './email.service';

import type { TestingModule } from '@nestjs/testing';

// Mock nodemailer before importing the service
jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'email.from': 'test@example.com',
        'email.host': 'smtp.test.com',
        'email.port': 587,
        'email.secure': false,
        'email.auth.user': 'testuser',
        'email.auth.pass': 'testpass',
        frontendUrl: 'http://localhost:3000',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    // Create mock transporter
    mockTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    } as unknown as jest.Mocked<nodemailer.Transporter>;

    // Mock createTransport to return our mock transporter
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';

      await service.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Verify Your Email - ApplyForUs AI Platform',
          from: 'test@example.com',
        }),
      );
    });

    it('should throw error if email sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const email = 'test@example.com';
      const token = 'test-token-123';

      await expect(
        service.sendVerificationEmail(email, token),
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';
      const token = 'reset-token-123';

      await service.sendPasswordResetEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Reset Your Password - ApplyForUs AI Platform',
          from: 'test@example.com',
        }),
      );
    });

    it('should throw error if email sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const email = 'test@example.com';
      const token = 'reset-token-123';

      await expect(
        service.sendPasswordResetEmail(email, token),
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with first name', async () => {
      const email = 'test@example.com';
      const firstName = 'John';

      await service.sendWelcomeEmail(email, firstName);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Welcome to ApplyForUs AI Platform!',
          from: 'test@example.com',
        }),
      );
    });

    it('should send welcome email without first name', async () => {
      const email = 'test@example.com';

      await service.sendWelcomeEmail(email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Welcome to ApplyForUs AI Platform!',
          from: 'test@example.com',
        }),
      );
    });

    it('should not throw error if welcome email fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const email = 'test@example.com';

      // Should not throw - welcome emails are not critical
      await expect(service.sendWelcomeEmail(email)).resolves.not.toThrow();
    });
  });

  describe('configuration', () => {
    it('should use correct configuration values', () => {
      expect(configService.get('email.from')).toBe('test@example.com');
      expect(configService.get('email.host')).toBe('smtp.test.com');
      expect(configService.get('email.port')).toBe(587);
      expect(configService.get('frontendUrl')).toBe('http://localhost:3000');
    });
  });
});

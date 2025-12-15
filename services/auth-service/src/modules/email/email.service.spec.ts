import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
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
      // Mock the transporter's sendMail method
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue({ messageId: 'test-message-id' } as any);

      const email = 'test@example.com';
      const token = 'test-token-123';

      await service.sendVerificationEmail(email, token);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Verify Your Email - ApplyForUs AI Platform',
          from: 'test@example.com',
        }),
      );

      sendMailSpy.mockRestore();
    });

    it('should throw error if email sending fails', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockRejectedValue(new Error('SMTP error'));

      const email = 'test@example.com';
      const token = 'test-token-123';

      await expect(
        service.sendVerificationEmail(email, token),
      ).rejects.toThrow('SMTP error');

      sendMailSpy.mockRestore();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue({ messageId: 'test-message-id' } as any);

      const email = 'test@example.com';
      const token = 'reset-token-123';

      await service.sendPasswordResetEmail(email, token);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Reset Your Password - ApplyForUs AI Platform',
          from: 'test@example.com',
        }),
      );

      sendMailSpy.mockRestore();
    });

    it('should throw error if email sending fails', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockRejectedValue(new Error('SMTP error'));

      const email = 'test@example.com';
      const token = 'reset-token-123';

      await expect(
        service.sendPasswordResetEmail(email, token),
      ).rejects.toThrow('SMTP error');

      sendMailSpy.mockRestore();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with first name', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue({ messageId: 'test-message-id' } as any);

      const email = 'test@example.com';
      const firstName = 'John';

      await service.sendWelcomeEmail(email, firstName);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Welcome to ApplyForUs AI Platform!',
          from: 'test@example.com',
        }),
      );

      sendMailSpy.mockRestore();
    });

    it('should send welcome email without first name', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue({ messageId: 'test-message-id' } as any);

      const email = 'test@example.com';

      await service.sendWelcomeEmail(email);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Welcome to ApplyForUs AI Platform!',
          from: 'test@example.com',
        }),
      );

      sendMailSpy.mockRestore();
    });

    it('should not throw error if welcome email fails', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockRejectedValue(new Error('SMTP error'));

      const email = 'test@example.com';

      // Should not throw - welcome emails are not critical
      await expect(service.sendWelcomeEmail(email)).resolves.not.toThrow();

      sendMailSpy.mockRestore();
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

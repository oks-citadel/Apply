import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { Repository } from 'typeorm';
import { TestFactory } from '../../../test/utils/test-factory';
import { mockRepository, mockConfigService } from '../../../test/utils/mock-config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };
      const mockUser = TestFactory.createUser(userData);

      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(userData);

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should create user without password for OAuth', async () => {
      const userData = {
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
        authProvider: 'GOOGLE' as any,
        providerId: 'google-123',
      };
      const mockUser = TestFactory.createOAuthUser('GOOGLE' as any);

      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(userData);

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const mockUser = TestFactory.createUser({ email });

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should return null if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userId = 'test-user-id';
      const mockUser = TestFactory.createUser({ id: userId });

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(userId);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('findByIdOrFail', () => {
    it('should find user by id', async () => {
      const userId = 'test-user-id';
      const mockUser = TestFactory.createUser({ id: userId });

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByIdOrFail(userId);

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findByIdOrFail('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const username = 'testuser';
      const mockUser = TestFactory.createUser({ username });

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername(username);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
    });
  });

  describe('findByProviderId', () => {
    it('should find user by provider ID', async () => {
      const providerId = 'google-123';
      const mockUser = TestFactory.createOAuthUser('GOOGLE' as any, { providerId });

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByProviderId(providerId);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { providerId },
      });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const userId = 'test-user-id';
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = TestFactory.createUser({ ...updateData, id: userId });

      repository.findOne.mockResolvedValue(updatedUser);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { firstName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      const plainPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const result = await service.validatePassword(plainPassword, hashedPassword);

      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const plainPassword = 'WrongPassword';
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);

      const result = await service.validatePassword(plainPassword, hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe('incrementLoginAttempts', () => {
    it('should increment login attempts', async () => {
      const userId = 'test-user-id';
      const mockUser = TestFactory.createUser({ id: userId, loginAttempts: 2 });

      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      await service.incrementLoginAttempts(userId);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          loginAttempts: 3,
        }),
      );
    });

    it('should lock account after max attempts', async () => {
      const userId = 'test-user-id';
      const mockUser = TestFactory.createUser({ id: userId, loginAttempts: 4 });

      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      await service.incrementLoginAttempts(userId);

      // After 5 attempts, account should be locked with lockedUntil set to a future date
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          loginAttempts: 5,
        }),
      );
      // Verify lockedUntil was set to a future time
      const savedUser = repository.save.mock.calls[0][0] as User;
      expect(savedUser.lockedUntil).toBeDefined();
      expect(savedUser.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('resetLoginAttempts', () => {
    it('should reset login attempts', async () => {
      const userId = 'test-user-id';
      const mockUser = TestFactory.createLockedUser({ id: userId });

      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      await service.resetLoginAttempts(userId);

      // isLocked is a getter, so we check lockedUntil is null instead
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          loginAttempts: 0,
          lockedUntil: null,
        }),
      );
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login time and IP', async () => {
      const userId = 'test-user-id';
      const ip = '192.168.1.1';

      repository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.updateLastLogin(userId, ip);

      expect(repository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          lastLoginIp: ip,
        }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and activate user', async () => {
      const userId = 'test-user-id';
      const mockUser = TestFactory.createUnverifiedUser({ id: userId });

      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      await service.verifyEmail(userId);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isEmailVerified: true,
          status: UserStatus.ACTIVE,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        }),
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password and clear reset tokens', async () => {
      const userId = 'test-user-id';
      const newPassword = 'NewPassword123!';
      const mockUser = TestFactory.createUser({
        id: userId,
        passwordResetToken: 'reset-token',
      });

      repository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      repository.findOne.mockResolvedValue(mockUser);

      await service.resetPassword(userId, newPassword);

      expect(repository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          passwordResetToken: null,
          passwordResetExpiry: null,
        }),
      );
    });
  });

  describe('enableMfa', () => {
    it('should enable MFA for user', async () => {
      const userId = 'test-user-id';

      repository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.enableMfa(userId);

      expect(repository.update).toHaveBeenCalledWith(
        userId,
        { isMfaEnabled: true },
      );
    });
  });

  describe('disableMfa', () => {
    it('should disable MFA for user', async () => {
      const userId = 'test-user-id';

      repository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.disableMfa(userId);

      expect(repository.update).toHaveBeenCalledWith(
        userId,
        {
          isMfaEnabled: false,
          mfaSecret: null,
        },
      );
    });
  });
});

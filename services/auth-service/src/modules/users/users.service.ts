import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';


import { User, UserStatus } from './entities/user.entity';

import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    this.logger.log(`Creating new user with email: ${userData.email}`);

    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password if provided
    if (userData.password) {
      const saltRounds = this.configService.get<number>('security.bcryptRounds', 10);
      userData.password = await bcrypt.hash(userData.password, saltRounds);
    }

    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    this.logger.log(`User created successfully: ${savedUser.id}`);
    return savedUser;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailOrFail(email: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByProviderId(providerId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { providerId } });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    this.logger.log(`Updating user: ${id}`);

    const user = await this.findByIdOrFail(id);

    // Hash password if being updated
    if (userData.password) {
      const saltRounds = this.configService.get<number>('security.bcryptRounds', 10);
      userData.password = await bcrypt.hash(userData.password, saltRounds);
    }

    Object.assign(user, userData);
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`User updated successfully: ${id}`);
    return updatedUser;
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    const hashedToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    await this.userRepository.update(id, { refreshToken: hashedToken });
  }

  async verifyEmail(userId: string): Promise<User> {
    this.logger.log(`Verifying email for user: ${userId}`);

    const user = await this.findByIdOrFail(userId);
    user.isEmailVerified = true;
    user.status = UserStatus.ACTIVE;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;

    return this.userRepository.save(user);
  }

  async setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<void> {
    await this.userRepository.update(userId, {
      emailVerificationToken: token,
      emailVerificationExpiry: expiry,
    });
  }

  async setPasswordResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    await this.userRepository.update(userId, {
      passwordResetToken: token,
      passwordResetExpiry: expiry,
    });
  }

  async resetPassword(userId: string, newPassword: string): Promise<User> {
    this.logger.log(`Resetting password for user: ${userId}`);

    const saltRounds = this.configService.get<number>('security.bcryptRounds', 10);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepository.update(userId, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });

    return this.findByIdOrFail(userId);
  }

  async updateMfaSecret(userId: string, secret: string): Promise<void> {
    await this.userRepository.update(userId, { mfaSecret: secret });
  }

  async enableMfa(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isMfaEnabled: true });
  }

  async disableMfa(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isMfaEnabled: false,
      mfaSecret: null,
    });
  }

  async updateLastLogin(userId: string, ip: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async incrementLoginAttempts(userId: string): Promise<User> {
    const user = await this.findByIdOrFail(userId);
    user.incrementLoginAttempts();

    const maxAttempts = this.configService.get<number>('security.maxLoginAttempts', 5);
    if (user.loginAttempts >= maxAttempts) {
      const lockoutDuration = this.configService.get<number>('security.lockoutDuration', 900);
      user.lockAccount(lockoutDuration);
      this.logger.warn(`User ${userId} locked due to too many login attempts`);
    }

    return this.userRepository.save(user);
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    const user = await this.findByIdOrFail(userId);
    user.resetLoginAttempts();
    await this.userRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting user: ${id}`);

    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`User deleted successfully: ${id}`);
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}

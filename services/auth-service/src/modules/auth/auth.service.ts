import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { User, UserStatus, AuthProvider } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MfaSetupResponseDto } from './dto/mfa-setup.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxLoginAttempts: number;
  private readonly lockoutDuration: number;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private readonly emailVerificationExpiresIn: number;
  private readonly passwordResetExpiresIn: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.maxLoginAttempts = this.configService.get<number>(
      'security.maxLoginAttempts',
      5,
    );
    this.lockoutDuration = this.configService.get<number>(
      'security.lockoutDuration',
      900,
    );
    this.accessTokenExpiresIn = this.configService.get<string>(
      'jwt.accessTokenExpiresIn',
      '15m',
    );
    this.refreshTokenExpiresIn = this.configService.get<string>(
      'jwt.refreshTokenExpiresIn',
      '7d',
    );
    this.emailVerificationExpiresIn = this.configService.get<number>(
      'email.verificationExpiresIn',
      86400,
    ); // 24 hours
    this.passwordResetExpiresIn = this.configService.get<number>(
      'email.passwordResetExpiresIn',
      3600,
    ); // 1 hour
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if username is taken
    if (registerDto.username) {
      const existingUsername = await this.usersService.findByUsername(
        registerDto.username,
      );
      if (existingUsername) {
        throw new ConflictException('Username is already taken');
      }
    }

    // Create user
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password, // UsersService handles hashing
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      username: registerDto.username,
      phoneNumber: registerDto.phoneNumber,
      authProvider: AuthProvider.LOCAL,
      status: UserStatus.PENDING_VERIFICATION,
      isEmailVerified: false,
    });

    // Generate email verification token
    const token = await this.generateEmailVerificationToken(user);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, token);
      this.logger.log(`Verification email sent successfully to: ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to: ${user.email}`,
        error.stack,
      );
      // Don't fail registration if email fails to send
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`User registered successfully: ${user.id}`);

    return new TokenResponseDto(
      tokens.accessToken,
      tokens.refreshToken,
      user,
      this.parseExpiresIn(this.accessTokenExpiresIn),
    );
  }

  /**
   * Login with email and password
   */
  async login(loginDto: LoginDto, ip?: string): Promise<TokenResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    // Find user
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new UnauthorizedException(
        `Account is locked until ${user.lockedUntil.toISOString()}. Please try again later.`,
      );
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses social login. Please sign in with your social provider.',
      );
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.usersService.incrementLoginAttempts(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is suspended
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account has been suspended');
    }

    // Check if user is inactive
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check MFA if enabled
    if (user.isMfaEnabled) {
      if (!loginDto.mfaToken) {
        throw new UnauthorizedException('MFA token is required');
      }

      const isMfaValid = await this.verifyMfaToken(user, loginDto.mfaToken);
      if (!isMfaValid) {
        throw new UnauthorizedException('Invalid MFA token');
      }
    }

    // Reset login attempts on successful login
    await this.usersService.resetLoginAttempts(user.id);

    // Update last login
    if (ip) {
      await this.usersService.updateLastLogin(user.id, ip);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`User logged in successfully: ${user.id}`);

    return new TokenResponseDto(
      tokens.accessToken,
      tokens.refreshToken,
      user,
      this.parseExpiresIn(this.accessTokenExpiresIn),
    );
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<{ message: string }> {
    this.logger.log(`Logout for user: ${userId}`);

    // Invalidate refresh token
    await this.usersService.updateRefreshToken(userId, null);

    this.logger.log(`User logged out successfully: ${userId}`);

    return { message: 'Logged out successfully' };
  }

  /**
   * Refresh access token
   */
  async refreshToken(user: User): Promise<TokenResponseDto> {
    this.logger.log(`Refreshing token for user: ${user.id}`);

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`Token refreshed successfully for user: ${user.id}`);

    return new TokenResponseDto(
      tokens.accessToken,
      tokens.refreshToken,
      user,
      this.parseExpiresIn(this.accessTokenExpiresIn),
    );
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Password reset requested for email: ${forgotPasswordDto.email}`,
    );

    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    // Don't reveal if user exists or not
    if (!user) {
      this.logger.warn(
        `Password reset requested for non-existent email: ${forgotPasswordDto.email}`,
      );
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Check if user uses OAuth
    if (user.authProvider !== AuthProvider.LOCAL) {
      this.logger.warn(
        `Password reset requested for OAuth user: ${user.id}`,
      );
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const expiry = new Date(Date.now() + this.passwordResetExpiresIn * 1000);

    await this.usersService.setPasswordResetToken(user.id, resetToken, expiry);

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
      this.logger.log(`Password reset email sent successfully to: ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to: ${user.email}`,
        error.stack,
      );
      // Don't reveal email sending failure for security reasons
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Password reset attempt with token`);

    // Find user with valid reset token
    const users = await this.usersService.findAll();
    const user = users.find(
      (u) =>
        u.passwordResetToken === resetPasswordDto.token &&
        u.passwordResetExpiry &&
        u.passwordResetExpiry > new Date(),
    );

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired password reset token',
      );
    }

    // Reset password
    await this.usersService.resetPassword(user.id, resetPasswordDto.newPassword);

    // Invalidate all existing sessions
    await this.usersService.updateRefreshToken(user.id, null);

    this.logger.log(`Password reset successfully for user: ${user.id}`);

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Password change request for user: ${userId}`);

    // Get user
    const user = await this.usersService.findByIdOrFail(userId);

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      throw new BadRequestException(
        'This account uses social login. Please set a password first.',
      );
    }

    // Validate current password
    const isPasswordValid = await this.usersService.validatePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is the same as current password
    const isSamePassword = await this.usersService.validatePassword(
      changePasswordDto.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Update password
    await this.usersService.resetPassword(userId, changePasswordDto.newPassword);

    // Invalidate all existing refresh tokens for security
    await this.usersService.updateRefreshToken(userId, null);

    this.logger.log(`Password changed successfully for user: ${userId}`);

    return { message: 'Password has been changed successfully. Please login again.' };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Email verification attempt with token`);

    // Find user with valid verification token
    const users = await this.usersService.findAll();
    const user = users.find(
      (u) =>
        u.emailVerificationToken === verifyEmailDto.token &&
        u.emailVerificationExpiry &&
        u.emailVerificationExpiry > new Date(),
    );

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired email verification token',
      );
    }

    // Verify email
    await this.usersService.verifyEmail(user.id);

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to: ${user.email}`,
        error.stack,
      );
      // Don't fail verification if welcome email fails
    }

    this.logger.log(`Email verified successfully for user: ${user.id}`);

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    this.logger.log(`Resending verification email for user: ${userId}`);

    const user = await this.usersService.findByIdOrFail(userId);

    // Check if already verified
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Check if user has a recent verification email (rate limiting)
    if (
      user.emailVerificationExpiry &&
      user.emailVerificationExpiry > new Date(Date.now() + this.emailVerificationExpiresIn * 1000 - 300000) // Within 5 minutes of last email
    ) {
      throw new BadRequestException(
        'Verification email was recently sent. Please check your inbox or wait a few minutes before requesting another.',
      );
    }

    // Generate new verification token
    const token = await this.generateEmailVerificationToken(user);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, token);
      this.logger.log(
        `Verification email resent successfully to: ${user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to resend verification email to: ${user.email}`,
        error.stack,
      );
      throw new BadRequestException('Failed to send verification email');
    }

    return {
      message: 'Verification email has been sent. Please check your inbox.',
    };
  }

  /**
   * Handle Google OAuth login
   */
  async googleLogin(user: User): Promise<TokenResponseDto> {
    this.logger.log(`Google OAuth login for user: ${user.id}`);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return new TokenResponseDto(
      tokens.accessToken,
      tokens.refreshToken,
      user,
      this.parseExpiresIn(this.accessTokenExpiresIn),
    );
  }

  /**
   * Handle generic OAuth login (LinkedIn, GitHub, etc.)
   */
  async oauthLogin(user: User): Promise<TokenResponseDto> {
    this.logger.log(`OAuth login for user: ${user.id}`);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return new TokenResponseDto(
      tokens.accessToken,
      tokens.refreshToken,
      user,
      this.parseExpiresIn(this.accessTokenExpiresIn),
    );
  }

  /**
   * Validate OAuth user (called by OAuth strategies)
   */
  async validateOAuthUser(profile: {
    providerId: string;
    provider: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  }): Promise<User> {
    this.logger.log(
      `Validating OAuth user: ${profile.email} (${profile.provider})`,
    );

    // Check if user exists by provider ID
    let user = await this.usersService.findByProviderId(profile.providerId);

    if (user) {
      // Update last login
      await this.usersService.updateLastLogin(user.id, null);
      return user;
    }

    // Check if user exists by email
    user = await this.usersService.findByEmail(profile.email);

    if (user) {
      // Link OAuth account to existing user
      await this.usersService.update(user.id, {
        providerId: profile.providerId,
        authProvider: profile.provider as AuthProvider,
        profilePicture: profile.profilePicture || user.profilePicture,
      });

      this.logger.log(`Linked OAuth account to existing user: ${user.id}`);
      return user;
    }

    // Create new user
    user = await this.usersService.create({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      providerId: profile.providerId,
      authProvider: profile.provider as AuthProvider,
      profilePicture: profile.profilePicture,
      status: UserStatus.ACTIVE,
      isEmailVerified: true, // OAuth providers verify email
    });

    this.logger.log(`Created new OAuth user: ${user.id}`);
    return user;
  }

  /**
   * Setup MFA for user
   */
  async setupMfa(userId: string): Promise<MfaSetupResponseDto> {
    this.logger.log(`MFA setup for user: ${userId}`);

    const user = await this.usersService.findByIdOrFail(userId);

    // Generate MFA secret
    const secret = speakeasy.generateSecret({
      name: `JobPilot (${user.email})`,
      issuer: 'JobPilot',
      length: 32,
    });

    // Save secret temporarily (not enabled yet)
    await this.usersService.updateMfaSecret(userId, secret.base32);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    this.logger.log(`MFA setup initiated for user: ${userId}`);

    return {
      secret: secret.base32,
      qrCode,
      otpauthUrl: secret.otpauth_url,
    };
  }

  /**
   * Verify and enable MFA
   */
  async verifyMfa(
    userId: string,
    mfaVerifyDto: MfaVerifyDto,
  ): Promise<{ message: string }> {
    this.logger.log(`MFA verification for user: ${userId}`);

    const user = await this.usersService.findByIdOrFail(userId);

    if (!user.mfaSecret) {
      throw new BadRequestException(
        'MFA setup not initiated. Please setup MFA first.',
      );
    }

    // Verify token
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaVerifyDto.token,
      window: 2, // Allow 2 time steps before and after
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA token');
    }

    // Enable MFA
    await this.usersService.enableMfa(userId);

    this.logger.log(`MFA enabled successfully for user: ${userId}`);

    return { message: 'MFA enabled successfully' };
  }

  /**
   * Disable MFA for user
   */
  async disableMfa(userId: string): Promise<{ message: string }> {
    this.logger.log(`Disabling MFA for user: ${userId}`);

    await this.usersService.disableMfa(userId);

    this.logger.log(`MFA disabled successfully for user: ${userId}`);

    return { message: 'MFA disabled successfully' };
  }

  /**
   * Disconnect OAuth provider from user account
   */
  async disconnectOAuth(userId: string): Promise<{ message: string }> {
    this.logger.log(`Disconnecting OAuth for user: ${userId}`);

    const user = await this.usersService.findByIdOrFail(userId);

    // Check if user has a password set (can't disconnect if it's their only auth method)
    if (!user.password && user.authProvider !== AuthProvider.LOCAL) {
      throw new BadRequestException(
        'Cannot disconnect OAuth provider. Please set a password first to maintain account access.',
      );
    }

    // Reset OAuth-related fields
    await this.usersService.update(userId, {
      providerId: null,
      authProvider: AuthProvider.LOCAL,
    });

    this.logger.log(`OAuth disconnected successfully for user: ${userId}`);

    return { message: 'OAuth provider disconnected successfully' };
  }

  /**
   * Validate user by email and password (used by LocalStrategy)
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Generate JWT tokens (access + refresh)
   */
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.accessTokenExpiresIn,
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.refreshTokenExpiresIn,
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
      }),
    ]);

    // Store hashed refresh token
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  /**
   * Generate email verification token
   */
  private async generateEmailVerificationToken(user: User): Promise<string> {
    const token = this.generateToken();
    const expiry = new Date(
      Date.now() + this.emailVerificationExpiresIn * 1000,
    );

    await this.usersService.setEmailVerificationToken(user.id, token, expiry);
    return token;
  }

  /**
   * Verify MFA token
   */
  private async verifyMfaToken(user: User, token: string): Promise<boolean> {
    if (!user.mfaSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  /**
   * Generate random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Parse expiration time to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900; // Default 15 minutes
    }
  }
}

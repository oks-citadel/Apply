import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Ip,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { MfaSetupResponseDto } from './dto/mfa-setup.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('frontendUrl', 'http://localhost:3000');
  }

  /**
   * Set authentication tokens in secure HttpOnly cookies
   * @param res Express Response object
   * @param accessToken JWT access token
   * @param refreshToken JWT refresh token
   */
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';

    // Cookie options with security flags
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // Only use secure flag in production (requires HTTPS)
      sameSite: 'strict' as const,
      path: '/',
    };

    // Set access token cookie (15 minutes)
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });

    // Set refresh token cookie (7 days)
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    this.logger.log('Authentication cookies set successfully');
  }

  /**
   * Register a new user
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    this.logger.log(`Registration request for email: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  /**
   * Login with email and password
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account locked',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
  ): Promise<TokenResponseDto> {
    this.logger.log(`Login request for email: ${loginDto.email} from IP: ${ip}`);
    return this.authService.login(loginDto, ip);
  }

  /**
   * Logout current user
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged out successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async logout(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    this.logger.log(`Logout request for user: ${user.id}`);
    return this.authService.logout(user.id);
  }

  /**
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refreshToken(@Req() req: Request): Promise<TokenResponseDto> {
    const user = req.user as User;
    this.logger.log(`Token refresh request for user: ${user.id}`);
    return this.authService.refreshToken(user);
  }

  /**
   * Forgot password - send reset email
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent if account exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Forgot password request for email: ${forgotPasswordDto.email}`,
    );
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * Reset password with token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Password reset request`);
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   * Change password for authenticated user
   */
  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid current password or new password is same as current',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized or incorrect current password',
  })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Password change request for user: ${user.id}`);
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  /**
   * Verify email with token
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Email verification request`);
    return this.authService.verifyEmail(verifyEmailDto);
  }

  /**
   * Resend verification email
   */
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email already verified or rate limit exceeded',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async resendVerification(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    this.logger.log(`Resend verification request for user: ${user.id}`);
    return this.authService.resendVerificationEmail(user.id);
  }

  /**
   * Initiate Google OAuth login
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to Google OAuth',
  })
  async googleLogin(): Promise<void> {
    // Guard handles the redirect to Google
    this.logger.log(`Google OAuth login initiated`);
  }

  /**
   * Google OAuth callback
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to frontend with authentication tokens in secure cookies',
  })
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const user = req.user as User;

      if (!user) {
        throw new Error('User not found after OAuth authentication');
      }

      this.logger.log(`Google OAuth callback for user: ${user.id}`);

      const tokenResponse = await this.authService.googleLogin(user);

      // Set tokens in secure HttpOnly cookies
      this.setAuthCookies(res, tokenResponse.accessToken, tokenResponse.refreshToken);

      // Redirect to frontend without tokens in URL
      const redirectUrl = `${this.frontendUrl}/oauth/callback?success=true`;
      res.redirect(redirectUrl);
    } catch (error: any) {
      this.logger.error(`Google OAuth callback error: ${error.message}`, error.stack);

      // Redirect to frontend with error
      const errorUrl = `${this.frontendUrl}/oauth/callback?error=server_error&error_description=${encodeURIComponent(error.message || 'Authentication failed')}`;
      res.redirect(errorUrl);
    }
  }

  /**
   * Initiate LinkedIn OAuth login
   */
  @Public()
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Initiate LinkedIn OAuth login' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to LinkedIn OAuth',
  })
  async linkedinLogin(): Promise<void> {
    // Guard handles the redirect to LinkedIn
    this.logger.log(`LinkedIn OAuth login initiated`);
  }

  /**
   * LinkedIn OAuth callback
   */
  @Public()
  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'LinkedIn OAuth callback' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to frontend with authentication tokens in secure cookies',
  })
  async linkedinCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const user = req.user as User;

      if (!user) {
        throw new Error('User not found after OAuth authentication');
      }

      this.logger.log(`LinkedIn OAuth callback for user: ${user.id}`);

      const tokenResponse = await this.authService.oauthLogin(user);

      // Set tokens in secure HttpOnly cookies
      this.setAuthCookies(res, tokenResponse.accessToken, tokenResponse.refreshToken);

      // Redirect to frontend without tokens in URL
      const redirectUrl = `${this.frontendUrl}/oauth/callback?success=true`;
      res.redirect(redirectUrl);
    } catch (error: any) {
      this.logger.error(`LinkedIn OAuth callback error: ${error.message}`, error.stack);

      // Redirect to frontend with error
      const errorUrl = `${this.frontendUrl}/oauth/callback?error=server_error&error_description=${encodeURIComponent(error.message || 'Authentication failed')}`;
      res.redirect(errorUrl);
    }
  }

  /**
   * Initiate GitHub OAuth login
   */
  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to GitHub OAuth',
  })
  async githubLogin(): Promise<void> {
    // Guard handles the redirect to GitHub
    this.logger.log(`GitHub OAuth login initiated`);
  }

  /**
   * GitHub OAuth callback
   */
  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to frontend with authentication tokens in secure cookies',
  })
  async githubCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const user = req.user as User;

      if (!user) {
        throw new Error('User not found after OAuth authentication');
      }

      this.logger.log(`GitHub OAuth callback for user: ${user.id}`);

      const tokenResponse = await this.authService.oauthLogin(user);

      // Set tokens in secure HttpOnly cookies
      this.setAuthCookies(res, tokenResponse.accessToken, tokenResponse.refreshToken);

      // Redirect to frontend without tokens in URL
      const redirectUrl = `${this.frontendUrl}/oauth/callback?success=true`;
      res.redirect(redirectUrl);
    } catch (error: any) {
      this.logger.error(`GitHub OAuth callback error: ${error.message}`, error.stack);

      // Redirect to frontend with error
      const errorUrl = `${this.frontendUrl}/oauth/callback?error=server_error&error_description=${encodeURIComponent(error.message || 'Authentication failed')}`;
      res.redirect(errorUrl);
    }
  }

  /**
   * Setup MFA for current user
   */
  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup MFA (Multi-Factor Authentication)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MFA setup initiated successfully',
    type: MfaSetupResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async setupMfa(@CurrentUser() user: User): Promise<MfaSetupResponseDto> {
    this.logger.log(`MFA setup request for user: ${user.id}`);
    return this.authService.setupMfa(user.id);
  }

  /**
   * Verify and enable MFA
   */
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Verify MFA token and enable MFA' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MFA enabled successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid MFA token',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'MFA not setup',
  })
  async verifyMfa(
    @CurrentUser() user: User,
    @Body() mfaVerifyDto: MfaVerifyDto,
  ): Promise<{ message: string }> {
    this.logger.log(`MFA verification request for user: ${user.id}`);
    return this.authService.verifyMfa(user.id, mfaVerifyDto);
  }

  /**
   * Disable MFA for current user
   */
  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MFA disabled successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async disableMfa(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    this.logger.log(`MFA disable request for user: ${user.id}`);
    return this.authService.disableMfa(user.id);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getCurrentUser(@CurrentUser() user: User): Promise<Partial<User>> {
    this.logger.log(`Get current user request for user: ${user.id}`);
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      role: user.role,
      status: user.status,
      authProvider: user.authProvider,
      providerId: user.providerId,
      isEmailVerified: user.isEmailVerified,
      isMfaEnabled: user.isMfaEnabled,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Disconnect OAuth provider from account
   */
  @Post('oauth/disconnect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect OAuth provider from account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth provider disconnected successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot disconnect - account requires authentication method',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async disconnectOAuth(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    this.logger.log(`OAuth disconnect request for user: ${user.id}`);
    return this.authService.disconnectOAuth(user.id);
  }
}

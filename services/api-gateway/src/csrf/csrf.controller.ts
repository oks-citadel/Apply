import { Controller, Get, Post, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';

import { CsrfService, SkipCsrf, CSRF_COOKIE_NAME } from '@applyforus/security';

import { Public } from '../common/decorators/public.decorator';

/**
 * CSRF Token Controller
 *
 * Provides endpoints for CSRF token management using the Double-Submit Cookie pattern.
 *
 * Flow:
 * 1. Client calls GET /csrf/token on app load or after login
 * 2. Server sets XSRF-TOKEN cookie and returns the token in body
 * 3. Client stores the token and includes it in X-CSRF-Token header for state-changing requests
 * 4. CsrfGuard validates that the header token matches the cookie token
 */
@ApiTags('security')
@Controller('csrf')
export class CsrfController {
  private readonly logger = new Logger(CsrfController.name);

  constructor(private readonly csrfService: CsrfService) {}

  /**
   * Get a new CSRF token
   *
   * This endpoint sets the CSRF token cookie and returns the token in the response body.
   * The client should call this:
   * - On initial app load
   * - After successful authentication
   * - When receiving a 401/403 error related to CSRF
   */
  @Get('token')
  @Public() // Allow unauthenticated access to get CSRF token
  @SkipCsrf() // Skip CSRF check for this endpoint (it's a GET and sets the token)
  @SkipThrottle() // Don't rate limit CSRF token requests
  @ApiOperation({
    summary: 'Get CSRF token',
    description: 'Returns a new CSRF token. The token is also set as a cookie (XSRF-TOKEN). Include this token in the X-CSRF-Token header for all state-changing requests (POST, PUT, PATCH, DELETE).',
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF token generated successfully',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'The CSRF token to include in X-CSRF-Token header',
          example: 'a1b2c3d4e5f6...',
        },
        cookieName: {
          type: 'string',
          description: 'The name of the cookie that contains the token',
          example: 'XSRF-TOKEN',
        },
        headerName: {
          type: 'string',
          description: 'The header name to use when sending the token',
          example: 'X-CSRF-Token',
        },
      },
    },
  })
  getToken(@Res({ passthrough: true }) response: Response) {
    const token = this.csrfService.setToken(response);
    this.logger.debug('CSRF token generated and cookie set');

    return {
      token,
      cookieName: CSRF_COOKIE_NAME,
      headerName: 'X-CSRF-Token',
    };
  }

  /**
   * Refresh CSRF token
   *
   * Call this after sensitive operations for added security (token rotation).
   * Requires authentication.
   */
  @Post('refresh')
  @SkipCsrf() // Skip CSRF check for refresh (we're issuing a new token)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Refresh CSRF token',
    description: 'Generates a new CSRF token, invalidating the previous one. Call this after sensitive operations for added security.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'The new CSRF token',
        },
        cookieName: {
          type: 'string',
          example: 'XSRF-TOKEN',
        },
        headerName: {
          type: 'string',
          example: 'X-CSRF-Token',
        },
      },
    },
  })
  refreshToken(@Res({ passthrough: true }) response: Response) {
    const token = this.csrfService.refreshToken(response);
    this.logger.debug('CSRF token refreshed');

    return {
      token,
      cookieName: CSRF_COOKIE_NAME,
      headerName: 'X-CSRF-Token',
    };
  }
}

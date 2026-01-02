import {
  All,
  Controller,
  Req,
  Res,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { SkipCsrf } from '@applyforus/security';

import { JwtAuthGuard } from '../auth/jwt.guard';

import { ProxyService } from './proxy.service';
import type { Request, Response } from 'express';

@ApiTags('proxy')
@Controller('api')
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Proxy all /api/auth/* requests to auth-service
   * Note: Auth endpoints (login, register, OAuth callbacks) skip CSRF
   * because they are session-initiating, not session-protected
   */
  @All('auth/*')
  @SkipCsrf()
  @ApiOperation({ summary: 'Proxy requests to auth service' })
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.handleProxy('auth', req, res, false);
  }

  /**
   * Proxy all /api/users/* requests to user-service
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @All('users/*')
  @ApiOperation({ summary: 'Proxy requests to user service' })
  async proxyUsers(@Req() req: Request, @Res() res: Response) {
    return this.handleProxy('users', req, res);
  }

  /**
   * Proxy all /api/resumes/* requests to resume-service
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @All('resumes/*')
  @ApiOperation({ summary: 'Proxy requests to resume service' })
  async proxyResumes(@Req() req: Request, @Res() res: Response) {
    return this.handleProxy('resumes', req, res);
  }

  /**
   * Proxy all /api/jobs/* requests to job-service
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @All('jobs/*')
  @ApiOperation({ summary: 'Proxy requests to job service' })
  async proxyJobs(@Req() req: Request, @Res() res: Response) {
    return this.handleProxy('jobs', req, res);
  }

  /**
   * Proxy all /api/applications/* requests to auto-apply-service
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @All('applications/*')
  @ApiOperation({ summary: 'Proxy requests to auto-apply service' })
  async proxyApplications(@Req() req: Request, @Res() res: Response) {
    return this.handleProxy('applications', req, res);
  }

  /**
   * Proxy all /api/analytics/* requests to analytics-service
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @All('analytics/*')
  @ApiOperation({ summary: 'Proxy requests to analytics service' })
  async proxyAnalytics(@Req() req: Request, @Res() res: Response) {
    return this.handleProxy('analytics', req, res);
  }

  /**
   * Proxy all /api/notifications/* requests to notification-service
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @All('notifications/*')
  @ApiOperation({ summary: 'Proxy requests to notification service' })
  async proxyNotifications(@Req() req: Request, @Res() res: Response) {
    return this.handleProxy('notifications', req, res);
  }

  /**
   * Proxy all /api/billing/* requests to payment-service
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @All('billing/*')
  @ApiOperation({ summary: 'Proxy requests to payment service' })
  async proxyBilling(@Req() req: Request, @Res() res: Response) {
    return this.handleProxy('billing', req, res);
  }

  /**
   * Proxy all /api/ai/* requests to ai-service
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @All('ai/*')
  @ApiOperation({ summary: 'Proxy requests to AI service' })
  async proxyAI(@Req() req: Request, @Res() res: Response) {
    return this.handleProxy('ai', req, res);
  }

  /**
   * Generic proxy handler
   */
  private async handleProxy(
    serviceName: string,
    req: Request,
    res: Response,
    _requireAuth: boolean = true,
  ) {
    try {
      // Extract path after service prefix
      const serviceRoute = this.proxyService.getServiceRoute(serviceName);
      if (!serviceRoute) {
        throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
      }

      // Remove the service prefix from the path
      const path = req.path.replace(serviceRoute.prefix, '');

      // Forward request to backend service
      const result = await this.proxyService.proxyRequest(
        serviceName,
        path,
        req.method,
        req.body,
        req.headers as Record<string, string>,
        req.query as Record<string, unknown>,
      );

      // Set response headers
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          if (
            !['content-encoding', 'transfer-encoding', 'connection'].includes(
              key.toLowerCase(),
            )
          ) {
            res.setHeader(key, value as string);
          }
        });
      }

      // Send response
      res.status(result.status).json(result.data);
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Proxy error for ${serviceName}: ${err.message || 'Unknown error'}`,
        err.stack,
      );

      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
      }
    }
  }
}

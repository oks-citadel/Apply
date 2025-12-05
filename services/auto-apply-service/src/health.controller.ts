import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'healthy',
      service: 'auto-apply-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('gateway')
@Controller()
export class AppController {
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: 'Gateway root endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Gateway information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'ApplyForUs API Gateway' },
        version: { type: 'string', example: '1.0.0' },
        status: { type: 'string', example: 'running' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  getRoot() {
    return {
      name: 'ApplyForUs API Gateway',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}

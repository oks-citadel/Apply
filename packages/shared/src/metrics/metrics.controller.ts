import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrometheusMetrics } from './prometheus';

/**
 * Metrics controller to expose Prometheus metrics endpoint
 */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: PrometheusMetrics) {}

  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    const metrics = await this.metrics.getMetrics();
    res.send(metrics);
  }

  @Get('json')
  async getMetricsJSON(): Promise<any> {
    return this.metrics.getMetricsJSON();
  }
}

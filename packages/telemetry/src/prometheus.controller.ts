import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusMetricsService } from './prometheus-metrics.service';

/**
 * Prometheus Metrics Controller
 * Exposes /metrics endpoint for Prometheus scraping
 */
@Controller()
export class PrometheusController {
  constructor(private readonly metricsService: PrometheusMetricsService) {}

  @Get('/metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  @Get('/health/metrics')
  @Header('Content-Type', 'application/json')
  async getMetricsHealth(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

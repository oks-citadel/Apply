import { PrometheusMetricsService } from './prometheus-metrics.service';
/**
 * Prometheus Metrics Controller
 * Exposes /metrics endpoint for Prometheus scraping
 */
export declare class PrometheusController {
    private readonly metricsService;
    constructor(metricsService: PrometheusMetricsService);
    getMetrics(): Promise<string>;
    getMetricsHealth(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
//# sourceMappingURL=prometheus.controller.d.ts.map
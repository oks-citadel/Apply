import { PrometheusMetricsService } from './prometheus-metrics.service';
export declare class PrometheusController {
    private readonly metricsService;
    constructor(metricsService: PrometheusMetricsService);
    getMetrics(): Promise<string>;
    getMetricsHealth(): Promise<{
        status: string;
        timestamp: string;
    }>;
}

import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
/**
 * Prometheus Metrics Interceptor
 * Automatically collects HTTP metrics for all endpoints
 */
export declare class PrometheusInterceptor implements NestInterceptor {
    private static httpRequestDuration;
    private static httpRequestsTotal;
    private static httpRequestsInFlight;
    private static httpRequestSize;
    private static httpResponseSize;
    constructor();
    private initializeMetrics;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private recordMetrics;
    private getRoute;
    private getRequestSize;
    private getResponseSize;
}
//# sourceMappingURL=prometheus.interceptor.d.ts.map
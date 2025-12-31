/**
 * OpenTelemetry Telemetry Package for ApplyForUs Microservices
 *
 * This package provides distributed tracing capabilities using OpenTelemetry
 * with Azure Application Insights integration.
 */
import { SpanStatusCode } from '@opentelemetry/api';
/**
 * Configuration options for telemetry initialization
 */
export interface TelemetryConfig {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
    azureMonitorConnectionString?: string;
    enableConsoleExport?: boolean;
    sampleRate?: number;
    attributes?: Record<string, string | number | boolean>;
}
/**
 * Initialize OpenTelemetry with Azure Monitor exporter
 *
 * This function should be called BEFORE importing any other application modules
 * to ensure proper instrumentation of all dependencies.
 *
 * @param config - Telemetry configuration options
 * @returns Promise that resolves when telemetry is initialized
 *
 * @example
 * ```typescript
 * import { initTelemetry } from '@applyforus/telemetry';
 *
 * async function bootstrap() {
 *   // Initialize telemetry FIRST
 *   await initTelemetry({
 *     serviceName: 'auth-service',
 *     serviceVersion: '1.0.0',
 *     environment: 'production'
 *   });
 *
 *   // Then import and start your application
 *   const { NestFactory } = await import('@nestjs/core');
 *   const { AppModule } = await import('./app.module');
 *   // ...
 * }
 * ```
 */
export declare function initTelemetry(config: TelemetryConfig): Promise<void>;
/**
 * Shutdown telemetry and flush all pending spans
 */
export declare function shutdownTelemetry(): Promise<void>;
/**
 * Get the current tracer instance
 *
 * @param name - Tracer name (typically the service or module name)
 * @param version - Optional version
 * @returns Tracer instance
 */
export declare function getTracer(name: string, version?: string): import("@opentelemetry/api").Tracer;
/**
 * Get the current active span
 *
 * @returns Current active span or undefined
 */
export declare function getCurrentSpan(): import("@opentelemetry/api").Span | undefined;
/**
 * Get the current trace context
 */
export declare function getCurrentContext(): import("@opentelemetry/api").Context;
/**
 * Set the status of the current span
 *
 * @param code - Status code
 * @param message - Optional status message
 */
export declare function setSpanStatus(code: SpanStatusCode, message?: string): void;
/**
 * Add attributes to the current span
 *
 * @param attributes - Key-value pairs to add as attributes
 */
export declare function addSpanAttributes(attributes: Record<string, string | number | boolean>): void;
/**
 * Record an exception in the current span
 *
 * @param error - Error to record
 */
export declare function recordException(error: Error): void;
/**
 * Check if telemetry is initialized
 */
export declare function isTracingEnabled(): boolean;
export { trace, context, propagation, SpanStatusCode, SpanKind } from '@opentelemetry/api';
export type { Span, Tracer, Context } from '@opentelemetry/api';
export * from './tracing';
export * from './middleware';
export * from './decorators';
export * from './logger';
export * from './metrics';
export * from './nestjs-module';
export * from './prometheus.controller';
export * from './prometheus.interceptor';
export * from './prometheus-metrics.service';
export * from './gateway-metrics';
export * from './http-client';
export * from './health';
//# sourceMappingURL=index.d.ts.map
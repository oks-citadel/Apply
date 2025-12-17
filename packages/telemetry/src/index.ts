/**
 * OpenTelemetry Telemetry Package for ApplyForUs Microservices
 *
 * This package provides distributed tracing capabilities using OpenTelemetry
 * with Azure Application Insights integration.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AzureMonitorTraceExporter } from '@azure/monitor-opentelemetry-exporter';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor, SpanProcessor, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { trace, context, propagation, SpanStatusCode } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import type { IncomingMessage } from 'http';

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

let sdk: NodeSDK | null = null;
let isInitialized = false;

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
export async function initTelemetry(config: TelemetryConfig): Promise<void> {
  if (isInitialized) {
    console.warn('[Telemetry] Already initialized, skipping...');
    return;
  }

  try {
    const {
      serviceName,
      serviceVersion = '1.0.0',
      environment = process.env.NODE_ENV || 'development',
      azureMonitorConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
      enableConsoleExport = false,
      sampleRate = 1.0,
      attributes = {},
    } = config;

    if (!serviceName) {
      throw new Error('Service name is required for telemetry initialization');
    }

    // Create resource with service information
    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
      ...attributes,
    });

    // Configure span exporters
    const spanProcessors: SpanProcessor[] = [];

    // Add Azure Monitor exporter if connection string is provided
    if (azureMonitorConnectionString) {
      const azureExporter = new AzureMonitorTraceExporter({
        connectionString: azureMonitorConnectionString,
      });
      // Use type assertion to handle version mismatches between OpenTelemetry packages
      spanProcessors.push(new BatchSpanProcessor(azureExporter as unknown as SpanExporter));
      console.log('[Telemetry] Azure Monitor exporter configured');
    } else {
      console.warn('[Telemetry] Azure Monitor connection string not provided, skipping Azure exporter');
    }

    // Configure trace context propagation (W3C Trace Context)
    propagation.setGlobalPropagator(new W3CTraceContextPropagator());

    // Initialize Node SDK with auto-instrumentation
    sdk = new NodeSDK({
      resource,
      spanProcessors: spanProcessors as any,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable instrumentations that might cause issues or are not needed
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          // Enable HTTP instrumentation with detailed options
          '@opentelemetry/instrumentation-http': {
            enabled: true,
            ignoreIncomingRequestHook: (request) => {
              // Ignore health check and metrics endpoints
              const url = request.url || '';
              return url.includes('/health') || url.includes('/metrics');
            },
            requestHook: (span, request) => {
              // Add custom attributes to HTTP spans - only for IncomingMessage (server requests)
              const incomingRequest = request as IncomingMessage;
              if (incomingRequest.headers) {
                span.setAttribute('http.user_agent', incomingRequest.headers['user-agent'] || 'unknown');
                span.setAttribute('http.request_id', incomingRequest.headers['x-request-id'] || '');
              }
            },
          },
          // Enable Express instrumentation for NestJS apps
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          // Enable PostgreSQL instrumentation
          '@opentelemetry/instrumentation-pg': {
            enabled: true,
            enhancedDatabaseReporting: true,
          },
          // Enable Redis instrumentation
          '@opentelemetry/instrumentation-redis-4': {
            enabled: true,
          },
        }),
      ],
    });

    // Start the SDK
    await sdk.start();
    isInitialized = true;

    console.log(`[Telemetry] Initialized for service: ${serviceName} (${environment})`);
    console.log(`[Telemetry] Tracing enabled with sample rate: ${sampleRate}`);

    // Handle graceful shutdown
    const shutdown = async () => {
      try {
        await sdk?.shutdown();
        console.log('[Telemetry] Shutdown complete');
      } catch (error) {
        console.error('[Telemetry] Error during shutdown:', error);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('beforeExit', shutdown);

  } catch (error) {
    console.error('[Telemetry] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Shutdown telemetry and flush all pending spans
 */
export async function shutdownTelemetry(): Promise<void> {
  if (!isInitialized || !sdk) {
    console.warn('[Telemetry] Not initialized, nothing to shutdown');
    return;
  }

  try {
    await sdk.shutdown();
    isInitialized = false;
    sdk = null;
    console.log('[Telemetry] Shutdown successfully');
  } catch (error) {
    console.error('[Telemetry] Error during shutdown:', error);
    throw error;
  }
}

/**
 * Get the current tracer instance
 *
 * @param name - Tracer name (typically the service or module name)
 * @param version - Optional version
 * @returns Tracer instance
 */
export function getTracer(name: string, version?: string) {
  return trace.getTracer(name, version);
}

/**
 * Get the current active span
 *
 * @returns Current active span or undefined
 */
export function getCurrentSpan() {
  return trace.getActiveSpan();
}

/**
 * Get the current trace context
 */
export function getCurrentContext() {
  return context.active();
}

/**
 * Set the status of the current span
 *
 * @param code - Status code
 * @param message - Optional status message
 */
export function setSpanStatus(code: SpanStatusCode, message?: string) {
  const span = getCurrentSpan();
  if (span) {
    span.setStatus({ code, message });
  }
}

/**
 * Add attributes to the current span
 *
 * @param attributes - Key-value pairs to add as attributes
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>) {
  const span = getCurrentSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Record an exception in the current span
 *
 * @param error - Error to record
 */
export function recordException(error: Error) {
  const span = getCurrentSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

/**
 * Check if telemetry is initialized
 */
export function isTracingEnabled(): boolean {
  return isInitialized;
}

// Re-export commonly used OpenTelemetry types and utilities
export { trace, context, propagation, SpanStatusCode, SpanKind } from '@opentelemetry/api';
export type { Span, Tracer, Context } from '@opentelemetry/api';

// Export all utilities
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
// Note: nestjs-metrics.ts is excluded due to incompatible API with current metrics.ts

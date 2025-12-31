"use strict";
/**
 * OpenTelemetry Telemetry Package for ApplyForUs Microservices
 *
 * This package provides distributed tracing capabilities using OpenTelemetry
 * with Azure Application Insights integration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpanKind = exports.SpanStatusCode = exports.propagation = exports.context = exports.trace = void 0;
exports.initTelemetry = initTelemetry;
exports.shutdownTelemetry = shutdownTelemetry;
exports.getTracer = getTracer;
exports.getCurrentSpan = getCurrentSpan;
exports.getCurrentContext = getCurrentContext;
exports.setSpanStatus = setSpanStatus;
exports.addSpanAttributes = addSpanAttributes;
exports.recordException = recordException;
exports.isTracingEnabled = isTracingEnabled;
const tslib_1 = require("tslib");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const monitor_opentelemetry_exporter_1 = require("@azure/monitor-opentelemetry-exporter");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const api_1 = require("@opentelemetry/api");
const core_1 = require("@opentelemetry/core");
let sdk = null;
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
async function initTelemetry(config) {
    if (isInitialized) {
        console.warn('[Telemetry] Already initialized, skipping...');
        return;
    }
    try {
        const { serviceName, serviceVersion = '1.0.0', environment = process.env.NODE_ENV || 'development', azureMonitorConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING, enableConsoleExport = false, sampleRate = 1.0, attributes = {}, } = config;
        if (!serviceName) {
            throw new Error('Service name is required for telemetry initialization');
        }
        // Create resource with service information
        const resource = new resources_1.Resource({
            [semantic_conventions_1.SEMRESATTRS_SERVICE_NAME]: serviceName,
            [semantic_conventions_1.SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
            [semantic_conventions_1.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
            ...attributes,
        });
        // Configure span exporters
        const spanProcessors = [];
        // Add Azure Monitor exporter if connection string is provided
        if (azureMonitorConnectionString) {
            const azureExporter = new monitor_opentelemetry_exporter_1.AzureMonitorTraceExporter({
                connectionString: azureMonitorConnectionString,
            });
            // Use type assertion to handle version mismatches between OpenTelemetry packages
            spanProcessors.push(new sdk_trace_base_1.BatchSpanProcessor(azureExporter));
            console.log('[Telemetry] Azure Monitor exporter configured');
        }
        else {
            console.warn('[Telemetry] Azure Monitor connection string not provided, skipping Azure exporter');
        }
        // Configure trace context propagation (W3C Trace Context)
        api_1.propagation.setGlobalPropagator(new core_1.W3CTraceContextPropagator());
        // Initialize Node SDK with auto-instrumentation
        sdk = new sdk_node_1.NodeSDK({
            resource,
            spanProcessors: spanProcessors,
            instrumentations: [
                (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
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
                            const incomingRequest = request;
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
            }
            catch (error) {
                console.error('[Telemetry] Error during shutdown:', error);
            }
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        process.on('beforeExit', shutdown);
    }
    catch (error) {
        console.error('[Telemetry] Failed to initialize:', error);
        throw error;
    }
}
/**
 * Shutdown telemetry and flush all pending spans
 */
async function shutdownTelemetry() {
    if (!isInitialized || !sdk) {
        console.warn('[Telemetry] Not initialized, nothing to shutdown');
        return;
    }
    try {
        await sdk.shutdown();
        isInitialized = false;
        sdk = null;
        console.log('[Telemetry] Shutdown successfully');
    }
    catch (error) {
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
function getTracer(name, version) {
    return api_1.trace.getTracer(name, version);
}
/**
 * Get the current active span
 *
 * @returns Current active span or undefined
 */
function getCurrentSpan() {
    return api_1.trace.getActiveSpan();
}
/**
 * Get the current trace context
 */
function getCurrentContext() {
    return api_1.context.active();
}
/**
 * Set the status of the current span
 *
 * @param code - Status code
 * @param message - Optional status message
 */
function setSpanStatus(code, message) {
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
function addSpanAttributes(attributes) {
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
function recordException(error) {
    const span = getCurrentSpan();
    if (span) {
        span.recordException(error);
        span.setStatus({
            code: api_1.SpanStatusCode.ERROR,
            message: error.message,
        });
    }
}
/**
 * Check if telemetry is initialized
 */
function isTracingEnabled() {
    return isInitialized;
}
// Re-export commonly used OpenTelemetry types and utilities
var api_2 = require("@opentelemetry/api");
Object.defineProperty(exports, "trace", { enumerable: true, get: function () { return api_2.trace; } });
Object.defineProperty(exports, "context", { enumerable: true, get: function () { return api_2.context; } });
Object.defineProperty(exports, "propagation", { enumerable: true, get: function () { return api_2.propagation; } });
Object.defineProperty(exports, "SpanStatusCode", { enumerable: true, get: function () { return api_2.SpanStatusCode; } });
Object.defineProperty(exports, "SpanKind", { enumerable: true, get: function () { return api_2.SpanKind; } });
// Export all utilities
tslib_1.__exportStar(require("./tracing"), exports);
tslib_1.__exportStar(require("./middleware"), exports);
tslib_1.__exportStar(require("./decorators"), exports);
tslib_1.__exportStar(require("./logger"), exports);
tslib_1.__exportStar(require("./metrics"), exports);
tslib_1.__exportStar(require("./nestjs-module"), exports);
tslib_1.__exportStar(require("./prometheus.controller"), exports);
tslib_1.__exportStar(require("./prometheus.interceptor"), exports);
tslib_1.__exportStar(require("./prometheus-metrics.service"), exports);
tslib_1.__exportStar(require("./gateway-metrics"), exports);
tslib_1.__exportStar(require("./http-client"), exports);
tslib_1.__exportStar(require("./health"), exports);
// Note: nestjs-metrics.ts is excluded due to incompatible API with current metrics.ts
//# sourceMappingURL=index.js.map
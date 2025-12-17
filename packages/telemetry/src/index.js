"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
        const resource = new resources_1.Resource({
            [semantic_conventions_1.SEMRESATTRS_SERVICE_NAME]: serviceName,
            [semantic_conventions_1.SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
            [semantic_conventions_1.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
            ...attributes,
        });
        const spanProcessors = [];
        if (azureMonitorConnectionString) {
            const azureExporter = new monitor_opentelemetry_exporter_1.AzureMonitorTraceExporter({
                connectionString: azureMonitorConnectionString,
            });
            spanProcessors.push(new sdk_trace_base_1.BatchSpanProcessor(azureExporter));
            console.log('[Telemetry] Azure Monitor exporter configured');
        }
        else {
            console.warn('[Telemetry] Azure Monitor connection string not provided, skipping Azure exporter');
        }
        api_1.propagation.setGlobalPropagator(new core_1.W3CTraceContextPropagator());
        sdk = new sdk_node_1.NodeSDK({
            resource,
            spanProcessors: spanProcessors,
            instrumentations: [
                (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
                    '@opentelemetry/instrumentation-fs': {
                        enabled: false,
                    },
                    '@opentelemetry/instrumentation-http': {
                        enabled: true,
                        ignoreIncomingRequestHook: (request) => {
                            const url = request.url || '';
                            return url.includes('/health') || url.includes('/metrics');
                        },
                        requestHook: (span, request) => {
                            const incomingRequest = request;
                            if (incomingRequest.headers) {
                                span.setAttribute('http.user_agent', incomingRequest.headers['user-agent'] || 'unknown');
                                span.setAttribute('http.request_id', incomingRequest.headers['x-request-id'] || '');
                            }
                        },
                    },
                    '@opentelemetry/instrumentation-express': {
                        enabled: true,
                    },
                    '@opentelemetry/instrumentation-pg': {
                        enabled: true,
                        enhancedDatabaseReporting: true,
                    },
                    '@opentelemetry/instrumentation-redis-4': {
                        enabled: true,
                    },
                }),
            ],
        });
        await sdk.start();
        isInitialized = true;
        console.log(`[Telemetry] Initialized for service: ${serviceName} (${environment})`);
        console.log(`[Telemetry] Tracing enabled with sample rate: ${sampleRate}`);
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
function getTracer(name, version) {
    return api_1.trace.getTracer(name, version);
}
function getCurrentSpan() {
    return api_1.trace.getActiveSpan();
}
function getCurrentContext() {
    return api_1.context.active();
}
function setSpanStatus(code, message) {
    const span = getCurrentSpan();
    if (span) {
        span.setStatus({ code, message });
    }
}
function addSpanAttributes(attributes) {
    const span = getCurrentSpan();
    if (span) {
        span.setAttributes(attributes);
    }
}
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
function isTracingEnabled() {
    return isInitialized;
}
var api_2 = require("@opentelemetry/api");
Object.defineProperty(exports, "trace", { enumerable: true, get: function () { return api_2.trace; } });
Object.defineProperty(exports, "context", { enumerable: true, get: function () { return api_2.context; } });
Object.defineProperty(exports, "propagation", { enumerable: true, get: function () { return api_2.propagation; } });
Object.defineProperty(exports, "SpanStatusCode", { enumerable: true, get: function () { return api_2.SpanStatusCode; } });
Object.defineProperty(exports, "SpanKind", { enumerable: true, get: function () { return api_2.SpanKind; } });
__exportStar(require("./tracing"), exports);
__exportStar(require("./middleware"), exports);
__exportStar(require("./decorators"), exports);
__exportStar(require("./logger"), exports);
__exportStar(require("./metrics"), exports);
__exportStar(require("./nestjs-module"), exports);
__exportStar(require("./prometheus.controller"), exports);
__exportStar(require("./prometheus.interceptor"), exports);
__exportStar(require("./prometheus-metrics.service"), exports);
__exportStar(require("./gateway-metrics"), exports);
__exportStar(require("./http-client"), exports);
__exportStar(require("./health"), exports);
//# sourceMappingURL=index.js.map
// Mock telemetry package for testing
export const initTelemetry = jest.fn().mockResolvedValue(undefined);
export const shutdownTelemetry = jest.fn().mockResolvedValue(undefined);
export const getTracer = jest.fn().mockReturnValue({
  startSpan: jest.fn().mockReturnValue({
    end: jest.fn(),
    setAttribute: jest.fn(),
    setStatus: jest.fn(),
    recordException: jest.fn(),
  }),
});
export const getCurrentSpan = jest.fn().mockReturnValue(null);
export const getCurrentContext = jest.fn().mockReturnValue({});
export const setSpanStatus = jest.fn();
export const addSpanAttributes = jest.fn();
export const recordException = jest.fn();
export const isTracingEnabled = jest.fn().mockReturnValue(false);
export const trace = { getTracer: jest.fn() };
export const context = { active: jest.fn() };
export const propagation = {};
export const SpanStatusCode = { OK: 0, ERROR: 1 };
export const SpanKind = { CLIENT: 0, SERVER: 1 };
export class TelemetryModule {
  static forRoot() {
    return { module: TelemetryModule };
  }
}
export class PrometheusModule {
  static forRoot() {
    return { module: PrometheusModule };
  }
}
export const PrometheusController = jest.fn();
export const PrometheusInterceptor = jest.fn().mockImplementation(() => ({
  intercept: jest.fn((context, next) => next.handle()),
}));
export const PrometheusMetricsService = jest.fn().mockImplementation(() => ({
  incrementHttpRequests: jest.fn(),
  observeHttpRequestDuration: jest.fn(),
}));
export const TracingInterceptor = jest.fn().mockImplementation(() => ({
  intercept: jest.fn((context, next) => next.handle()),
}));
export const TracingMiddleware = jest.fn();
export const Trace = jest.fn();
export const createLogger = jest.fn().mockReturnValue({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
});
export const initMetrics = jest.fn();
export const getMetrics = jest.fn();
export const GatewayMetrics = jest.fn();
export const createHttpClient = jest.fn();

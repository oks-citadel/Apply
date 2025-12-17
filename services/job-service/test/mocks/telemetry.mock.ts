// Mock for @applyforus/telemetry package
export const Logger = jest.fn().mockImplementation(() => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
}));

export const TelemetryService = jest.fn().mockImplementation(() => ({
  trackEvent: jest.fn(),
  trackException: jest.fn(),
  trackMetric: jest.fn(),
}));

export const initTelemetry = jest.fn().mockResolvedValue(undefined);
export const shutdownTelemetry = jest.fn().mockResolvedValue(undefined);
export const getTracer = jest.fn().mockReturnValue({});
export const getCurrentSpan = jest.fn().mockReturnValue(undefined);

export default {
  Logger,
  TelemetryService,
  initTelemetry,
  shutdownTelemetry,
  getTracer,
  getCurrentSpan,
};

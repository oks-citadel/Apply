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

export default {
  Logger,
  TelemetryService,
};

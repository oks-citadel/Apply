// Mock for @applyforus/logging package
export const Logger = jest.fn().mockImplementation(() => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  info: jest.fn(),
  trackMetric: jest.fn(),
}));

export const createLogger = jest.fn().mockReturnValue({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  info: jest.fn(),
  trackMetric: jest.fn(),
});

export const LoggingModule = {
  forRoot: jest.fn().mockReturnValue({
    module: class MockLoggingModule {},
    global: true,
    providers: [],
    exports: [],
  }),
  forRootAsync: jest.fn().mockReturnValue({
    module: class MockLoggingModule {},
    global: true,
    providers: [],
    exports: [],
  }),
};

export const LoggingInterceptor = jest.fn().mockImplementation(() => ({
  intercept: jest.fn((context, next) => next.handle()),
}));

export const LoggingExceptionFilter = jest.fn();

export const LOGGER_OPTIONS = 'LOGGER_OPTIONS';
export const LOGGER_INSTANCE = 'LOGGER_INSTANCE';

export default {
  Logger,
  createLogger,
  LoggingModule,
  LoggingInterceptor,
  LoggingExceptionFilter,
  LOGGER_OPTIONS,
  LOGGER_INSTANCE,
};

// Mock for @applyforus/logging package
export const createLogger = jest.fn().mockReturnValue({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

export const LoggingModule = {
  forRoot: jest.fn().mockReturnValue({
    module: class MockLoggingModule {},
    providers: [],
    exports: [],
  }),
};

export default {
  createLogger,
  LoggingModule,
};

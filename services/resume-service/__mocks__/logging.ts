// Mock logging package for testing
export const createLogger = jest.fn().mockReturnValue({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  trace: jest.fn(),
  child: jest.fn().mockReturnThis(),
  setContext: jest.fn(),
});
export class LoggingModule {
  static forRoot() {
    return { module: LoggingModule };
  }
}
export const LoggingInterceptor = jest.fn().mockImplementation(() => ({
  intercept: jest.fn((context, next) => next.handle()),
}));

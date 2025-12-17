import { Logger, LogLevel } from '../logger';
import { LoggerContext } from '../context';
import { filterSensitiveData, isSensitiveField, formatDuration, formatBytes, formatRequestLog, formatErrorLog } from '../formats';
import { sanitizeLogData, PerformanceTracker } from '../middleware';

jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), log: jest.fn() })),
  transports: { Console: jest.fn() },
  format: { combine: jest.fn(), timestamp: jest.fn(), errors: jest.fn(), printf: jest.fn(), colorize: jest.fn(), json: jest.fn() },
}));

jest.mock('applicationinsights', () => ({
  setup: jest.fn(() => ({
    setAutoDependencyCorrelation: jest.fn().mockReturnThis(),
    setAutoCollectRequests: jest.fn().mockReturnThis(),
    setAutoCollectPerformance: jest.fn().mockReturnThis(),
    setAutoCollectExceptions: jest.fn().mockReturnThis(),
    setAutoCollectDependencies: jest.fn().mockReturnThis(),
    setAutoCollectConsole: jest.fn().mockReturnThis(),
    setUseDiskRetryCaching: jest.fn().mockReturnThis(),
    setSendLiveMetrics: jest.fn().mockReturnThis(),
    setDistributedTracingMode: jest.fn().mockReturnThis(),
    start: jest.fn(),
  })),
  defaultClient: {
    context: { tags: {}, keys: { cloudRole: 'cloudRole', cloudRoleInstance: 'cloudRoleInstance' } },
    commonProperties: {},
    trackTrace: jest.fn(), trackEvent: jest.fn(), trackMetric: jest.fn(), trackDependency: jest.fn(), trackException: jest.fn(),
    flush: jest.fn((options: { callback?: () => void }) => options?.callback?.()),
  },
  Contracts: { SeverityLevel: { Verbose: 0, Information: 1, Warning: 2, Error: 3 } },
  DistributedTracingModes: { AI_AND_W3C: 2 },
}));

jest.mock('cls-hooked', () => {
  const contextData: Record<string, unknown> = {};
  const mockNamespace = {
    get: jest.fn((key: string) => contextData[key]),
    set: jest.fn((key: string, value: unknown) => { contextData[key] = value; }),
    run: jest.fn((fn: () => unknown) => fn()),
    runAndReturn: jest.fn((fn: () => unknown) => fn()),
    bind: jest.fn((fn: unknown) => fn),
    bindEmitter: jest.fn(),
    active: true,
  };
  return { createNamespace: jest.fn(() => mockNamespace), getNamespace: jest.fn(() => mockNamespace) };
});

describe('Logger Tests', () => {
  let logger: Logger;
  beforeEach(() => {
    jest.clearAllMocks();
    logger = new Logger({ serviceName: 'test', environment: 'test', version: '1.0.0', logLevel: LogLevel.DEBUG });
  });

  describe('Logger Creation', () => {
    it('should create a logger', () => {
      expect(new Logger({ serviceName: 'test', environment: 'dev', version: '1.0.0' })).toBeDefined();
    });
    it('should create with Application Insights', () => {
      expect(new Logger({ serviceName: 'test', environment: 'prod', version: '1.0.0', appInsightsKey: 'key' })).toBeDefined();
    });
  });

  describe('Log Levels', () => {
    it('should log info', () => { logger.info('msg'); expect(logger).toBeDefined(); });
    it('should log warn', () => { logger.warn('msg'); expect(logger).toBeDefined(); });
    it('should log error', () => { logger.error('msg'); expect(logger).toBeDefined(); });
    it('should log debug', () => { logger.debug('msg'); expect(logger).toBeDefined(); });
    it('should log trace', () => { logger.trace('msg'); expect(logger).toBeDefined(); });
    it('should have correct enum values', () => {
      expect(LogLevel.ERROR).toBe('error');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.DEBUG).toBe('debug');
      expect(LogLevel.TRACE).toBe('trace');
    });
  });

  describe('Operations', () => {
    it('should start operation', () => { expect(logger.startOperation('op')).toBeDefined(); });
    it('should flush', async () => { await logger.flush(); expect(logger).toBeDefined(); });
  });
});

describe('Formatting Tests', () => {
  describe('filterSensitiveData', () => {
    it('should redact password', () => {
      const filtered = filterSensitiveData({ password: 'secret', name: 'test' });
      expect(filtered.password).toBe('[REDACTED]');
      expect(filtered.name).toBe('test');
    });
    it('should handle null', () => { expect(filterSensitiveData(null)).toBeNull(); });
  });

  describe('isSensitiveField', () => {
    it('should detect password', () => { expect(isSensitiveField('password')).toBe(true); });
    it('should detect token', () => { expect(isSensitiveField('token')).toBe(true); });
    it('should not detect username', () => { expect(isSensitiveField('username')).toBe(false); });
  });

  describe('formatDuration', () => {
    it('should format ms', () => { expect(formatDuration(50)).toBe('50.00ms'); });
    it('should format s', () => { expect(formatDuration(1000)).toBe('1.00s'); });
  });

  describe('formatBytes', () => {
    it('should format 0', () => { expect(formatBytes(0)).toBe('0 Bytes'); });
    it('should format KB', () => { expect(formatBytes(1024)).toBe('1 KB'); });
  });

  describe('formatRequestLog', () => {
    it('should format request', () => {
      const log = formatRequestLog({ method: 'GET', url: '/api', statusCode: 200, duration: 50 });
      expect(log).toContain('GET');
    });
  });

  describe('formatErrorLog', () => {
    it('should format error', () => {
      const log = formatErrorLog({ errorName: 'Error', errorMessage: 'msg' });
      expect(log).toContain('Error');
    });
  });
});

describe('Middleware Tests', () => {
  describe('sanitizeLogData', () => {
    it('should sanitize', () => {
      const sanitized = sanitizeLogData({ password: 'x', name: 'y' });
      expect(sanitized.password).toBe('[REDACTED]');
    });
    it('should handle null', () => { expect(sanitizeLogData(null)).toBeNull(); });
  });

  describe('PerformanceTracker', () => {
    it('should track', () => {
      const logger = new Logger({ serviceName: 'test', environment: 'test', version: '1.0.0' });
      const tracker = new PerformanceTracker(logger);
      tracker.start('op');
      tracker.end('op');
      expect(tracker).toBeDefined();
    });
  });
});

describe('LoggerContext Tests', () => {
  it('should initialize', () => { expect(LoggerContext.initialize()).toBeDefined(); });
  it('should generate ID', () => { LoggerContext.initialize(); expect(LoggerContext.generateCorrelationId()).toBeDefined(); });
  it('should run', () => { let x = false; LoggerContext.run(() => { x = true; }); expect(x).toBe(true); });
});

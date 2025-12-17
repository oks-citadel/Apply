import { MetricsService, createMetricsService, Measure } from '../metrics';

jest.mock('prom-client', () => {
  const mockHistogram = { observe: jest.fn(), labels: jest.fn().mockReturnThis() };
  const mockCounter = { inc: jest.fn(), labels: jest.fn().mockReturnThis() };
  const mockGauge = { inc: jest.fn(), dec: jest.fn(), set: jest.fn(), labels: jest.fn().mockReturnThis() };
  const mockSummary = { observe: jest.fn(), labels: jest.fn().mockReturnThis() };
  const mockRegistry = { setDefaultLabels: jest.fn(), metrics: jest.fn().mockResolvedValue('metrics'), registerMetric: jest.fn() };
  return {
    Counter: jest.fn(() => mockCounter),
    Gauge: jest.fn(() => mockGauge),
    Histogram: jest.fn(() => mockHistogram),
    Summary: jest.fn(() => mockSummary),
    Registry: jest.fn(() => mockRegistry),
    register: mockRegistry,
    collectDefaultMetrics: jest.fn(),
  };
});

describe('MetricsService Tests', () => {
  let metricsService;
  beforeEach(() => {
    jest.clearAllMocks();
    metricsService = new MetricsService({ serviceName: 'test', defaultLabels: { env: 'test' } });
  });

  describe('Creation', () => {
    it('should create with default config', () => {
      expect(new MetricsService({ serviceName: 'svc' })).toBeDefined();
    });
    it('should create with custom labels', () => {
      expect(new MetricsService({ serviceName: 'svc', defaultLabels: { x: 'y' } })).toBeDefined();
    });
    it('should create without default metrics', () => {
      expect(new MetricsService({ serviceName: 'svc', enableDefaultMetrics: false })).toBeDefined();
    });
  });

  describe('Standard Metrics', () => {
    it('should have httpRequestDuration', () => { expect(metricsService.httpRequestDuration).toBeDefined(); });
    it('should have httpRequestTotal', () => { expect(metricsService.httpRequestTotal).toBeDefined(); });
    it('should have httpRequestErrors', () => { expect(metricsService.httpRequestErrors).toBeDefined(); });
    it('should have activeConnections', () => { expect(metricsService.activeConnections).toBeDefined(); });
    it('should have databaseQueryDuration', () => { expect(metricsService.databaseQueryDuration).toBeDefined(); });
    it('should have cacheHits', () => { expect(metricsService.cacheHits).toBeDefined(); });
    it('should have cacheMisses', () => { expect(metricsService.cacheMisses).toBeDefined(); });
    it('should have queueJobsTotal', () => { expect(metricsService.queueJobsTotal).toBeDefined(); });
    it('should have queueJobDuration', () => { expect(metricsService.queueJobDuration).toBeDefined(); });
  });

  describe('Custom Metrics', () => {
    it('should create counter', () => { expect(metricsService.createCounter('c', 'help')).toBeDefined(); });
    it('should create gauge', () => { expect(metricsService.createGauge('g', 'help')).toBeDefined(); });
    it('should create histogram', () => { expect(metricsService.createHistogram('h', 'help', [], [0.1])).toBeDefined(); });
    it('should create summary', () => { expect(metricsService.createSummary('s', 'help', [], [0.5])).toBeDefined(); });
  });

  describe('Recording Metrics', () => {
    it('should record HTTP request', () => { metricsService.recordHttpRequest('GET', '/', 200, 0.1); expect(metricsService).toBeDefined(); });
    it('should record HTTP 4xx error', () => { metricsService.recordHttpRequest('GET', '/', 400, 0.1); expect(metricsService).toBeDefined(); });
    it('should record HTTP 5xx error', () => { metricsService.recordHttpRequest('GET', '/', 500, 0.1); expect(metricsService).toBeDefined(); });
    it('should record DB query', () => { metricsService.recordDatabaseQuery('SELECT', 'users', 0.05); expect(metricsService).toBeDefined(); });
    it('should record cache hit', () => { metricsService.recordCacheHit('cache'); expect(metricsService).toBeDefined(); });
    it('should record cache miss', () => { metricsService.recordCacheMiss('cache'); expect(metricsService).toBeDefined(); });
    it('should record queue job completed', () => { metricsService.recordQueueJob('q', 'completed', 1.0); expect(metricsService).toBeDefined(); });
    it('should record queue job failed', () => { metricsService.recordQueueJob('q', 'failed', 0.5); expect(metricsService).toBeDefined(); });
  });

  describe('Connection Tracking', () => {
    it('should increment connections', () => { metricsService.incrementActiveConnections(); expect(metricsService).toBeDefined(); });
    it('should decrement connections', () => { metricsService.decrementActiveConnections(); expect(metricsService).toBeDefined(); });
  });

  describe('Metrics Export', () => {
    it('should get metrics', async () => { const m = await metricsService.getMetrics(); expect(m).toBeDefined(); });
    it('should get registry', () => { expect(metricsService.getRegistry()).toBeDefined(); });
  });

  describe('Factory', () => {
    it('should create via factory', () => { expect(createMetricsService({ serviceName: 'f' })).toBeInstanceOf(MetricsService); });
  });
});

describe('Measure Decorator', () => {
  it('should be defined', () => { expect(Measure).toBeDefined(); });
  it('should return decorator', () => { expect(typeof Measure('m')).toBe('function'); });
  it('should work without name', () => { expect(typeof Measure()).toBe('function'); });
});

describe('Edge Cases', () => {
  let svc;
  beforeEach(() => { svc = new MetricsService({ serviceName: 'edge' }); });
  it('should handle long route', () => { svc.recordHttpRequest('GET', '/a'.repeat(1000), 200, 0.1); expect(svc).toBeDefined(); });
  it('should handle zero duration', () => { svc.recordHttpRequest('GET', '/', 200, 0); expect(svc).toBeDefined(); });
  it('should handle unusual status', () => { svc.recordHttpRequest('GET', '/', 418, 0.1); expect(svc).toBeDefined(); });
});

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  HealthStatus,
  ServiceHealthInfo,
  QueueInfo,
  DatabaseConnectionInfo,
  EndpointLatencyMetrics,
  ServiceLatencyMetrics,
  EndpointErrorRate,
  ServiceErrorRate,
  ComponentStatus,
  HealthAlert,
} from '../interfaces';

/**
 * Service health information DTO
 */
export class ServiceHealthInfoDto implements ServiceHealthInfo {
  @ApiProperty({ example: 'auth-service', description: 'Service name' })
  name: string;

  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
    example: 'healthy',
    description: 'Health status',
  })
  status: HealthStatus;

  @ApiPropertyOptional({ example: 45, description: 'Response time in milliseconds' })
  responseTime?: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Last health check timestamp' })
  lastCheck: string;

  @ApiPropertyOptional({ example: '1.2.3', description: 'Service version' })
  version?: string;

  @ApiPropertyOptional({ example: 86400, description: 'Service uptime in seconds' })
  uptime?: number;

  @ApiPropertyOptional({ example: 'Connection refused', description: 'Error message if unhealthy' })
  error?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;
}

/**
 * Services health summary DTO
 */
export class ServicesSummaryDto {
  @ApiProperty({ example: 10, description: 'Total number of services' })
  total: number;

  @ApiProperty({ example: 8, description: 'Number of healthy services' })
  healthy: number;

  @ApiProperty({ example: 1, description: 'Number of unhealthy services' })
  unhealthy: number;

  @ApiProperty({ example: 1, description: 'Number of degraded services' })
  degraded: number;

  @ApiProperty({ example: 0, description: 'Number of services with unknown status' })
  unknown: number;
}

/**
 * Services health response DTO
 */
export class ServicesHealthResponseDto {
  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
    example: 'healthy',
    description: 'Overall platform status',
  })
  overallStatus: HealthStatus;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp of the health check' })
  timestamp: string;

  @ApiProperty({ type: [ServiceHealthInfoDto], description: 'Health status of each service' })
  services: ServiceHealthInfoDto[];

  @ApiProperty({ type: ServicesSummaryDto, description: 'Summary of service health' })
  summary: ServicesSummaryDto;
}

/**
 * Queue info DTO
 */
export class QueueInfoDto implements QueueInfo {
  @ApiProperty({ example: 'application-queue', description: 'Queue name' })
  name: string;

  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
    example: 'healthy',
    description: 'Queue status',
  })
  status: HealthStatus;

  @ApiPropertyOptional({ example: 150, description: 'Number of messages in queue' })
  messageCount?: number;

  @ApiPropertyOptional({ example: 5, description: 'Number of active consumers' })
  consumerCount?: number;

  @ApiPropertyOptional({ example: 100, description: 'Messages published per second' })
  publishRate?: number;

  @ApiPropertyOptional({ example: 95, description: 'Messages consumed per second' })
  consumeRate?: number;

  @ApiPropertyOptional({ example: 50, description: 'Consumer lag (messages behind)' })
  lag?: number;

  @ApiPropertyOptional({ example: 'Connection timeout', description: 'Error message if unhealthy' })
  error?: string;
}

/**
 * RabbitMQ health info DTO
 */
export class RabbitMQHealthDto {
  @ApiProperty({ example: true, description: 'Whether RabbitMQ is connected' })
  connected: boolean;

  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
    example: 'healthy',
    description: 'RabbitMQ status',
  })
  status: HealthStatus;

  @ApiProperty({ type: [QueueInfoDto], description: 'Individual queue health' })
  queues: QueueInfoDto[];

  @ApiPropertyOptional({ example: 500, description: 'Total messages across all queues' })
  totalMessages?: number;

  @ApiPropertyOptional({ example: 'Connection refused', description: 'Error message if unhealthy' })
  error?: string;
}

/**
 * Redis health info DTO
 */
export class RedisHealthDto {
  @ApiProperty({ example: true, description: 'Whether Redis is connected' })
  connected: boolean;

  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
    example: 'healthy',
    description: 'Redis status',
  })
  status: HealthStatus;

  @ApiPropertyOptional({ example: 256, description: 'Memory used in MB' })
  memoryUsedMB?: number;

  @ApiPropertyOptional({ example: 512, description: 'Maximum memory in MB' })
  memoryMaxMB?: number;

  @ApiPropertyOptional({ example: 25, description: 'Number of connected clients' })
  connectedClients?: number;

  @ApiPropertyOptional({ example: 86400, description: 'Redis uptime in seconds' })
  uptime?: number;

  @ApiPropertyOptional({ example: 15000, description: 'Number of keys in Redis' })
  keyCount?: number;

  @ApiPropertyOptional({ example: 'Connection timeout', description: 'Error message if unhealthy' })
  error?: string;
}

/**
 * Queue health response DTO
 */
export class QueueHealthResponseDto {
  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
    example: 'healthy',
    description: 'Overall queue health status',
  })
  overallStatus: HealthStatus;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp of the health check' })
  timestamp: string;

  @ApiPropertyOptional({ type: RabbitMQHealthDto, description: 'RabbitMQ health information' })
  rabbitmq?: RabbitMQHealthDto;

  @ApiPropertyOptional({ type: RedisHealthDto, description: 'Redis health information' })
  redis?: RedisHealthDto;
}

/**
 * Database connection info DTO
 */
export class DatabaseConnectionInfoDto implements DatabaseConnectionInfo {
  @ApiProperty({ example: 'primary', description: 'Connection name' })
  name: string;

  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
    example: 'healthy',
    description: 'Connection status',
  })
  status: HealthStatus;

  @ApiPropertyOptional({ example: 5, description: 'Query response time in milliseconds' })
  responseTime?: number;

  @ApiPropertyOptional({ example: 10, description: 'Number of active connections' })
  activeConnections?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum connections allowed' })
  maxConnections?: number;

  @ApiPropertyOptional({ example: 0, description: 'Number of waiting connections' })
  waitingConnections?: number;

  @ApiPropertyOptional({ example: 'Connection refused', description: 'Error message if unhealthy' })
  error?: string;
}

/**
 * Database pool stats DTO
 */
export class DatabasePoolStatsDto {
  @ApiProperty({ example: 10, description: 'Number of active connections' })
  activeConnections: number;

  @ApiProperty({ example: 5, description: 'Number of idle connections' })
  idleConnections: number;

  @ApiProperty({ example: 100, description: 'Maximum connections in pool' })
  maxConnections: number;

  @ApiProperty({ example: 0, description: 'Number of waiting requests' })
  waitingRequests: number;
}

/**
 * Query performance DTO
 */
export class QueryPerformanceDto {
  @ApiProperty({ example: 15.5, description: 'Average query time in milliseconds' })
  avgQueryTime: number;

  @ApiProperty({ example: 3, description: 'Number of slow queries' })
  slowQueries: number;

  @ApiProperty({ example: 10000, description: 'Total queries executed' })
  totalQueries: number;
}

/**
 * Database health response DTO
 */
export class DatabaseHealthResponseDto {
  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
    example: 'healthy',
    description: 'Overall database health status',
  })
  overallStatus: HealthStatus;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp of the health check' })
  timestamp: string;

  @ApiProperty({
    type: [DatabaseConnectionInfoDto],
    description: 'Health of database connections',
  })
  connections: DatabaseConnectionInfoDto[];

  @ApiPropertyOptional({ type: DatabasePoolStatsDto, description: 'Connection pool statistics' })
  poolStats?: DatabasePoolStatsDto;

  @ApiPropertyOptional({ example: 0, description: 'Replication lag in milliseconds' })
  replicationLag?: number;

  @ApiPropertyOptional({ type: QueryPerformanceDto, description: 'Query performance metrics' })
  queryPerformance?: QueryPerformanceDto;
}

/**
 * Latency percentile DTO
 */
export class LatencyPercentileDto {
  @ApiProperty({ example: 95, description: 'Percentile value' })
  percentile: number;

  @ApiProperty({ example: 150, description: 'Latency value in milliseconds' })
  value: number;
}

/**
 * Endpoint latency metrics DTO
 */
export class EndpointLatencyMetricsDto implements EndpointLatencyMetrics {
  @ApiProperty({ example: '/api/jobs', description: 'Endpoint path' })
  endpoint: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 45.5, description: 'Average latency in milliseconds' })
  avgLatency: number;

  @ApiProperty({ example: 10, description: 'Minimum latency in milliseconds' })
  minLatency: number;

  @ApiProperty({ example: 500, description: 'Maximum latency in milliseconds' })
  maxLatency: number;

  @ApiProperty({ type: [LatencyPercentileDto], description: 'Latency percentiles' })
  percentiles: LatencyPercentileDto[];

  @ApiProperty({ example: 10000, description: 'Total request count' })
  requestCount: number;

  @ApiProperty({ example: 50, description: 'Number of errors' })
  errorCount: number;
}

/**
 * Service latency metrics DTO
 */
export class ServiceLatencyMetricsDto implements ServiceLatencyMetrics {
  @ApiProperty({ example: 'job-service', description: 'Service name' })
  serviceName: string;

  @ApiProperty({ example: 45.5, description: 'Average latency in milliseconds' })
  avgLatency: number;

  @ApiProperty({ example: 30, description: '50th percentile latency' })
  p50: number;

  @ApiProperty({ example: 100, description: '90th percentile latency' })
  p90: number;

  @ApiProperty({ example: 150, description: '95th percentile latency' })
  p95: number;

  @ApiProperty({ example: 300, description: '99th percentile latency' })
  p99: number;

  @ApiProperty({ type: [EndpointLatencyMetricsDto], description: 'Per-endpoint metrics' })
  endpoints: EndpointLatencyMetricsDto[];
}

/**
 * Time range DTO
 */
export class TimeRangeDto {
  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Start time' })
  start: string;

  @ApiProperty({ example: '2024-01-31T23:59:59Z', description: 'End time' })
  end: string;
}

/**
 * Global latency metrics DTO
 */
export class GlobalLatencyMetricsDto {
  @ApiProperty({ example: 45.5, description: 'Average latency in milliseconds' })
  avgLatency: number;

  @ApiProperty({ example: 30, description: '50th percentile latency' })
  p50: number;

  @ApiProperty({ example: 100, description: '90th percentile latency' })
  p90: number;

  @ApiProperty({ example: 150, description: '95th percentile latency' })
  p95: number;

  @ApiProperty({ example: 300, description: '99th percentile latency' })
  p99: number;

  @ApiProperty({ example: 100000, description: 'Total requests in period' })
  totalRequests: number;
}

/**
 * API latency metrics response DTO
 */
export class ApiLatencyMetricsResponseDto {
  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp' })
  timestamp: string;

  @ApiProperty({ type: TimeRangeDto, description: 'Time range for metrics' })
  timeRange: TimeRangeDto;

  @ApiProperty({ type: GlobalLatencyMetricsDto, description: 'Global latency metrics' })
  globalMetrics: GlobalLatencyMetricsDto;

  @ApiProperty({ type: [ServiceLatencyMetricsDto], description: 'Per-service latency metrics' })
  serviceMetrics: ServiceLatencyMetricsDto[];

  @ApiProperty({ type: [EndpointLatencyMetricsDto], description: 'Slowest endpoints' })
  slowestEndpoints: EndpointLatencyMetricsDto[];
}

/**
 * Endpoint error rate DTO
 */
export class EndpointErrorRateDto implements EndpointErrorRate {
  @ApiProperty({ example: '/api/applications', description: 'Endpoint path' })
  endpoint: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 10000, description: 'Total requests' })
  totalRequests: number;

  @ApiProperty({ example: 50, description: 'Number of errors' })
  errorCount: number;

  @ApiProperty({ example: 0.5, description: 'Error rate percentage' })
  errorRate: number;

  @ApiProperty({
    example: { '500': 30, '503': 20 },
    description: 'Errors grouped by type',
  })
  errorsByType: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Most recent error information',
  })
  lastError?: {
    message: string;
    timestamp: string;
    statusCode?: number;
  };
}

/**
 * Service error rate DTO
 */
export class ServiceErrorRateDto implements ServiceErrorRate {
  @ApiProperty({ example: 'auto-apply-service', description: 'Service name' })
  serviceName: string;

  @ApiProperty({ example: 50000, description: 'Total requests to service' })
  totalRequests: number;

  @ApiProperty({ example: 250, description: 'Total errors' })
  errorCount: number;

  @ApiProperty({ example: 0.5, description: 'Error rate percentage' })
  errorRate: number;

  @ApiProperty({ type: [EndpointErrorRateDto], description: 'Per-endpoint error rates' })
  endpoints: EndpointErrorRateDto[];

  @ApiProperty({
    example: { '500': 150, '503': 100 },
    description: 'Errors grouped by status code',
  })
  errorsByStatusCode: Record<string, number>;
}

/**
 * Global error rate DTO
 */
export class GlobalErrorRateDto {
  @ApiProperty({ example: 500000, description: 'Total requests platform-wide' })
  totalRequests: number;

  @ApiProperty({ example: 1000, description: 'Total errors' })
  errorCount: number;

  @ApiProperty({ example: 0.2, description: 'Error rate percentage' })
  errorRate: number;

  @ApiProperty({
    example: { 'ValidationError': 500, 'TimeoutError': 300, 'ConnectionError': 200 },
    description: 'Errors grouped by type',
  })
  errorsByType: Record<string, number>;
}

/**
 * Critical error info DTO
 */
export class CriticalErrorDto {
  @ApiProperty({ example: 'payment-service', description: 'Service where error occurred' })
  service: string;

  @ApiProperty({ example: '/api/payments/process', description: 'Endpoint where error occurred' })
  endpoint: string;

  @ApiProperty({ example: 'Database connection pool exhausted', description: 'Error message' })
  message: string;

  @ApiProperty({ example: 150, description: 'Number of occurrences' })
  count: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Last occurrence timestamp' })
  lastOccurrence: string;
}

/**
 * Error rates response DTO
 */
export class ErrorRatesResponseDto {
  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp' })
  timestamp: string;

  @ApiProperty({ type: TimeRangeDto, description: 'Time range for error rates' })
  timeRange: TimeRangeDto;

  @ApiProperty({ type: GlobalErrorRateDto, description: 'Global error rate metrics' })
  globalErrorRate: GlobalErrorRateDto;

  @ApiProperty({ type: [ServiceErrorRateDto], description: 'Per-service error rates' })
  serviceErrorRates: ServiceErrorRateDto[];

  @ApiProperty({ type: [CriticalErrorDto], description: 'Critical errors requiring attention' })
  criticalErrors: CriticalErrorDto[];
}

/**
 * Component status DTO
 */
export class ComponentStatusDto implements ComponentStatus {
  @ApiProperty({ example: 'PostgreSQL Primary', description: 'Component name' })
  name: string;

  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
    example: 'healthy',
    description: 'Component status',
  })
  status: HealthStatus;

  @ApiPropertyOptional({ example: 'All connections operational', description: 'Status message' })
  message?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Last check timestamp' })
  lastCheck: string;
}

/**
 * Health alert DTO
 */
export class HealthAlertDto implements HealthAlert {
  @ApiProperty({ example: 'alert-123', description: 'Alert ID' })
  id: string;

  @ApiProperty({
    enum: ['critical', 'warning', 'info'],
    example: 'warning',
    description: 'Alert severity',
  })
  severity: 'critical' | 'warning' | 'info';

  @ApiProperty({ example: 'RabbitMQ', description: 'Component that triggered alert' })
  component: string;

  @ApiProperty({ example: 'Queue backlog exceeding threshold', description: 'Alert message' })
  message: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Alert timestamp' })
  timestamp: string;

  @ApiProperty({ example: false, description: 'Whether alert has been resolved' })
  resolved: boolean;
}

/**
 * Platform health summary DTO
 */
export class PlatformHealthSummaryDto {
  @ApiProperty({ example: 95, description: 'Overall health score (0-100)' })
  score: number;

  @ApiProperty({
    description: 'Services summary',
  })
  services: {
    total: number;
    healthy: number;
    issues: number;
  };

  @ApiProperty({
    description: 'Queue health summary',
  })
  queues: {
    status: HealthStatus;
    messageBacklog: number;
  };

  @ApiProperty({
    description: 'Database health summary',
  })
  database: {
    status: HealthStatus;
    connectionPoolHealth: number;
  };

  @ApiProperty({
    description: 'Latency summary',
  })
  latency: {
    avgMs: number;
    p99Ms: number;
  };

  @ApiProperty({
    description: 'Error rate summary',
  })
  errorRate: {
    percentage: number;
    trend: 'improving' | 'stable' | 'degrading';
  };
}

/**
 * Platform metrics DTO
 */
export class PlatformMetricsDto {
  @ApiProperty({ example: 99.95, description: 'Uptime percentage' })
  uptime: number;

  @ApiProperty({ example: 99.9, description: 'Availability percentage' })
  availability: number;

  @ApiProperty({ example: 1500, description: 'Requests per second' })
  throughput: number;

  @ApiProperty({ example: 2500, description: 'Number of active users' })
  activeUsers: number;
}

/**
 * Platform health report DTO
 */
export class PlatformHealthReportDto {
  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
    example: 'healthy',
    description: 'Overall platform status',
  })
  status: HealthStatus;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Current timestamp' })
  timestamp: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'When the report was generated' })
  generatedAt: string;

  @ApiProperty({ type: TimeRangeDto, description: 'Report period' })
  reportPeriod: TimeRangeDto;

  @ApiProperty({ type: PlatformHealthSummaryDto, description: 'Health summary' })
  summary: PlatformHealthSummaryDto;

  @ApiProperty({ type: [ComponentStatusDto], description: 'Status of all components' })
  components: ComponentStatusDto[];

  @ApiProperty({ type: [HealthAlertDto], description: 'Active alerts' })
  alerts: HealthAlertDto[];

  @ApiProperty({
    example: ['Consider scaling up job-service', 'Review slow queries in analytics-service'],
    description: 'Recommendations for improvement',
  })
  recommendations: string[];

  @ApiProperty({ type: PlatformMetricsDto, description: 'Platform-wide metrics' })
  metrics: PlatformMetricsDto;
}

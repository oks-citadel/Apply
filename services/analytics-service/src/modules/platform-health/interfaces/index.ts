/**
 * Platform Health Interfaces
 * Type definitions for platform-wide health monitoring
 */

/**
 * Status type for individual health checks
 */
export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded' | 'unknown';

/**
 * Individual service health information
 */
export interface ServiceHealthInfo {
  name: string;
  status: HealthStatus;
  responseTime?: number;
  lastCheck: string;
  version?: string;
  uptime?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Health check result for a single service
 */
export interface ServiceHealthCheckResult {
  status: HealthStatus;
  responseTime: number;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Aggregated services health response
 */
export interface ServicesHealthResponse {
  overallStatus: HealthStatus;
  timestamp: string;
  services: ServiceHealthInfo[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
    unknown: number;
  };
}

/**
 * Queue health information
 */
export interface QueueInfo {
  name: string;
  status: HealthStatus;
  messageCount?: number;
  consumerCount?: number;
  publishRate?: number;
  consumeRate?: number;
  lag?: number;
  error?: string;
}

/**
 * Queue health response for RabbitMQ/Redis
 */
export interface QueueHealthResponse {
  overallStatus: HealthStatus;
  timestamp: string;
  rabbitmq?: {
    connected: boolean;
    status: HealthStatus;
    queues: QueueInfo[];
    totalMessages?: number;
    error?: string;
  };
  redis?: {
    connected: boolean;
    status: HealthStatus;
    memoryUsedMB?: number;
    memoryMaxMB?: number;
    connectedClients?: number;
    uptime?: number;
    keyCount?: number;
    error?: string;
  };
}

/**
 * Database connection health information
 */
export interface DatabaseConnectionInfo {
  name: string;
  status: HealthStatus;
  responseTime?: number;
  activeConnections?: number;
  maxConnections?: number;
  waitingConnections?: number;
  error?: string;
}

/**
 * Database health response
 */
export interface DatabaseHealthResponse {
  overallStatus: HealthStatus;
  timestamp: string;
  connections: DatabaseConnectionInfo[];
  poolStats?: {
    activeConnections: number;
    idleConnections: number;
    maxConnections: number;
    waitingRequests: number;
  };
  replicationLag?: number;
  queryPerformance?: {
    avgQueryTime: number;
    slowQueries: number;
    totalQueries: number;
  };
}

/**
 * Latency percentile data point
 */
export interface LatencyPercentile {
  percentile: number;
  value: number;
}

/**
 * Endpoint latency metrics
 */
export interface EndpointLatencyMetrics {
  endpoint: string;
  method: string;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  percentiles: LatencyPercentile[];
  requestCount: number;
  errorCount: number;
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
}

/**
 * Service latency metrics
 */
export interface ServiceLatencyMetrics {
  serviceName: string;
  avgLatency: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  endpoints: EndpointLatencyMetrics[];
}

/**
 * API latency metrics response
 */
export interface ApiLatencyMetricsResponse {
  timestamp: string;
  timeRange: {
    start: string;
    end: string;
  };
  globalMetrics: {
    avgLatency: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    totalRequests: number;
  };
  serviceMetrics: ServiceLatencyMetrics[];
  slowestEndpoints: EndpointLatencyMetrics[];
}

/**
 * Error rate information for an endpoint
 */
export interface EndpointErrorRate {
  endpoint: string;
  method: string;
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  lastError?: {
    message: string;
    timestamp: string;
    statusCode?: number;
  };
}

/**
 * Service error rates
 */
export interface ServiceErrorRate {
  serviceName: string;
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  endpoints: EndpointErrorRate[];
  errorsByStatusCode: Record<string, number>;
}

/**
 * Error rates response
 */
export interface ErrorRatesResponse {
  timestamp: string;
  timeRange: {
    start: string;
    end: string;
  };
  globalErrorRate: {
    totalRequests: number;
    errorCount: number;
    errorRate: number;
    errorsByType: Record<string, number>;
  };
  serviceErrorRates: ServiceErrorRate[];
  criticalErrors: Array<{
    service: string;
    endpoint: string;
    message: string;
    count: number;
    lastOccurrence: string;
  }>;
}

/**
 * Component status for health report
 */
export interface ComponentStatus {
  name: string;
  status: HealthStatus;
  message?: string;
  lastCheck: string;
}

/**
 * Alert information
 */
export interface HealthAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

/**
 * Overall platform health report
 */
export interface PlatformHealthReport {
  status: HealthStatus;
  timestamp: string;
  generatedAt: string;
  reportPeriod: {
    start: string;
    end: string;
  };
  summary: {
    score: number; // 0-100 health score
    services: {
      total: number;
      healthy: number;
      issues: number;
    };
    queues: {
      status: HealthStatus;
      messageBacklog: number;
    };
    database: {
      status: HealthStatus;
      connectionPoolHealth: number; // percentage
    };
    latency: {
      avgMs: number;
      p99Ms: number;
    };
    errorRate: {
      percentage: number;
      trend: 'improving' | 'stable' | 'degrading';
    };
  };
  components: ComponentStatus[];
  alerts: HealthAlert[];
  recommendations: string[];
  metrics: {
    uptime: number; // percentage
    availability: number; // percentage
    throughput: number; // requests per second
    activeUsers: number;
  };
}

/**
 * Query parameters for health report
 */
export interface HealthReportQuery {
  startDate?: string;
  endDate?: string;
  includeMetrics?: boolean;
  includeAlerts?: boolean;
}

/**
 * Query parameters for latency metrics
 */
export interface LatencyMetricsQuery {
  startDate?: string;
  endDate?: string;
  serviceName?: string;
  endpoint?: string;
}

/**
 * Query parameters for error rates
 */
export interface ErrorRatesQuery {
  startDate?: string;
  endDate?: string;
  serviceName?: string;
  minErrorRate?: number;
}

/**
 * Service configuration for health checks
 */
export interface ServiceConfig {
  name: string;
  url: string;
  healthEndpoint?: string;
  timeout?: number;
  critical?: boolean;
}

/**
 * Queue configuration for health checks
 */
export interface QueueConfig {
  name: string;
  type: 'rabbitmq' | 'redis' | 'bull';
  connectionString?: string;
}

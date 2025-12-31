/**
 * Client-side logger utility for Next.js web app
 * Provides structured logging with different log levels
 * Integrates with Application Insights and Sentry for production monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type SeverityLevel = 0 | 1 | 2 | 3 | 4;

interface LogContext {
  [key: string]: unknown;
}

// Application Insights severity levels
const SEVERITY_LEVELS: Record<LogLevel, SeverityLevel> = {
  debug: 0, // Verbose
  info: 1,  // Information
  warn: 2,  // Warning
  error: 3, // Error
};

// Extend window interface for Application Insights
declare global {
  interface Window {
    appInsights?: {
      trackTrace: (trace: { message: string; severityLevel: SeverityLevel; properties?: Record<string, unknown> }) => void;
      trackException: (exception: { exception: Error; severityLevel?: SeverityLevel; properties?: Record<string, unknown> }) => void;
      trackEvent: (event: { name: string; properties?: Record<string, unknown> }) => void;
      trackPageView: (pageView: { name?: string; uri?: string; properties?: Record<string, unknown> }) => void;
      flush: () => void;
    };
    Sentry?: {
      captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => void;
      captureException: (error: Error, context?: { extra?: Record<string, unknown>; tags?: Record<string, string> }) => void;
      setContext: (name: string, context: Record<string, unknown>) => void;
      setUser: (user: { id?: string; email?: string; username?: string } | null) => void;
    };
  }
}

/**
 * Telemetry configuration for the web app
 */
interface TelemetryConfig {
  applicationInsightsEnabled: boolean;
  sentryEnabled: boolean;
  sampleRate: number;
}

// Default telemetry configuration
const telemetryConfig: TelemetryConfig = {
  applicationInsightsEnabled: typeof window !== 'undefined' && !!window.appInsights,
  sentryEnabled: typeof window !== 'undefined' && !!window.Sentry,
  sampleRate: 1.0, // 100% sampling by default
};

/**
 * Check if telemetry should be sampled (for high-volume logs)
 */
function shouldSample(): boolean {
  return Math.random() < telemetryConfig.sampleRate;
}

class Logger {
  private isDevelopment: boolean;
  private isClient: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isClient = typeof window !== 'undefined';
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Send logs to Application Insights
   */
  private sendToApplicationInsights(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.isClient || !window.appInsights) return;

    const properties = {
      ...context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      window.appInsights.trackException({
        exception: error,
        severityLevel: SEVERITY_LEVELS[level],
        properties,
      });
    } else {
      window.appInsights.trackTrace({
        message,
        severityLevel: SEVERITY_LEVELS[level],
        properties,
      });
    }
  }

  /**
   * Send logs to Sentry
   */
  private sendToSentry(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.isClient || !window.Sentry) return;

    if (context) {
      window.Sentry.setContext('logContext', context);
    }

    if (error) {
      window.Sentry.captureException(error, {
        extra: context,
      });
    } else {
      const sentryLevel = level === 'warn' ? 'warning' : level === 'debug' ? 'info' : level;
      window.Sentry.captureMessage(message, sentryLevel as 'info' | 'warning' | 'error');
    }
  }

  /**
   * Send logs to monitoring services in production
   */
  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Skip in development or on server
    if (this.isDevelopment || !this.isClient) return;

    // Apply sampling for info/debug level logs
    if ((level === 'info' || level === 'debug') && !shouldSample()) return;

    // Send to Application Insights
    if (telemetryConfig.applicationInsightsEnabled) {
      this.sendToApplicationInsights(level, message, context, error);
    }

    // Send to Sentry (primarily for errors)
    if (telemetryConfig.sentryEnabled && (level === 'error' || level === 'warn')) {
      this.sendToSentry(level, message, context, error);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
    this.sendToMonitoring('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('info', message, context);
    if (this.isDevelopment) {
      console.info(formatted);
    }
    this.sendToMonitoring('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('warn', message, context);
    console.warn(formatted);
    this.sendToMonitoring('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error?.message,
      stack: error?.stack,
    };
    const formatted = this.formatMessage('error', message, errorContext);
    console.error(formatted);
    this.sendToMonitoring('error', message, errorContext, error);
  }

  /**
   * Track a custom event (useful for analytics)
   */
  trackEvent(eventName: string, properties?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', `Event: ${eventName}`, properties));
    }

    if (!this.isDevelopment && this.isClient && window.appInsights) {
      window.appInsights.trackEvent({
        name: eventName,
        properties: properties as Record<string, unknown>,
      });
    }
  }

  /**
   * Track a page view
   */
  trackPageView(pageName?: string, uri?: string, properties?: LogContext): void {
    if (!this.isClient || !window.appInsights) return;

    window.appInsights.trackPageView({
      name: pageName,
      uri: uri || window.location.href,
      properties: properties as Record<string, unknown>,
    });
  }

  /**
   * Set user context for telemetry
   */
  setUser(userId?: string, email?: string, username?: string): void {
    if (!this.isClient) return;

    if (window.Sentry) {
      window.Sentry.setUser(userId ? { id: userId, email, username } : null);
    }
  }

  /**
   * Flush pending telemetry data
   */
  flush(): void {
    if (!this.isClient) return;

    if (window.appInsights?.flush) {
      window.appInsights.flush();
    }
  }

  /**
   * Create a child logger with a specific context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalMethods = {
      debug: childLogger.debug.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      error: childLogger.error.bind(childLogger),
      trackEvent: childLogger.trackEvent.bind(childLogger),
    };

    childLogger.debug = (message: string, context?: LogContext) => {
      originalMethods.debug(message, { ...defaultContext, ...context });
    };

    childLogger.info = (message: string, context?: LogContext) => {
      originalMethods.info(message, { ...defaultContext, ...context });
    };

    childLogger.warn = (message: string, context?: LogContext) => {
      originalMethods.warn(message, { ...defaultContext, ...context });
    };

    childLogger.error = (message: string, error?: Error, context?: LogContext) => {
      originalMethods.error(message, error, { ...defaultContext, ...context });
    };

    childLogger.trackEvent = (eventName: string, properties?: LogContext) => {
      originalMethods.trackEvent(eventName, { ...defaultContext, ...properties });
    };

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory function for creating child loggers
export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}

/**
 * Configure telemetry settings
 */
export function configureTelemetry(config: Partial<TelemetryConfig>): void {
  Object.assign(telemetryConfig, config);
}

/**
 * Initialize global error handlers for unhandled errors
 */
export function initializeErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
      type: 'unhandledrejection',
    });
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    logger.error('Unhandled Error', event.error instanceof Error ? event.error : new Error(event.message), {
      type: 'error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}

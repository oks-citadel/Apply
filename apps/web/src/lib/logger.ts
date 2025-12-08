/**
 * Client-side logger utility for Next.js web app
 * Provides structured logging with different log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
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
   * Send logs to monitoring service in production
   */
  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext): void {
    // In production, send to monitoring service (e.g., Application Insights, Sentry)
    if (!this.isDevelopment && this.isClient) {
      // TODO: Integrate with monitoring service
      // Example: window.appInsights?.trackTrace({ message, severityLevel: level, properties: context });
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
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
    this.sendToMonitoring('error', message, errorContext);
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

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory function for creating child loggers
export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}

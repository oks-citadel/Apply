import { createNamespace, getNamespace, Namespace } from 'cls-hooked';
import { v4 as uuidv4 } from 'uuid';

const NAMESPACE_NAME = 'applyforus-logging-context';

export interface LoggingContext {
  correlationId: string;
  operationId?: string;
  operationName?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  [key: string]: any;
}

export class LoggerContext {
  private static namespace: Namespace;

  static initialize(): Namespace {
    if (!this.namespace) {
      this.namespace = getNamespace(NAMESPACE_NAME) || createNamespace(NAMESPACE_NAME);
    }
    return this.namespace;
  }

  static getNamespace(): Namespace | undefined {
    return this.namespace || getNamespace(NAMESPACE_NAME);
  }

  static setContext(context: Partial<LoggingContext>): void {
    const ns = this.initialize();

    const existingContext = ns.get('context') || {};
    const updatedContext = {
      ...existingContext,
      ...context,
    };

    ns.set('context', updatedContext);
  }

  static getContext(): LoggingContext | undefined {
    const ns = this.getNamespace();
    if (!ns) return undefined;

    return ns.get('context');
  }

  static getCorrelationId(): string | undefined {
    const context = this.getContext();
    return context?.correlationId;
  }

  static setCorrelationId(correlationId: string): void {
    this.setContext({ correlationId });
  }

  static generateCorrelationId(): string {
    const correlationId = uuidv4();
    this.setCorrelationId(correlationId);
    return correlationId;
  }

  static getOperationId(): string | undefined {
    const context = this.getContext();
    return context?.operationId;
  }

  static setOperationId(operationId: string): void {
    this.setContext({ operationId });
  }

  static getUserId(): string | undefined {
    const context = this.getContext();
    return context?.userId;
  }

  static setUserId(userId: string): void {
    this.setContext({ userId });
  }

  static getRequestId(): string | undefined {
    const context = this.getContext();
    return context?.requestId;
  }

  static setRequestId(requestId: string): void {
    this.setContext({ requestId });
  }

  static clear(): void {
    const ns = this.getNamespace();
    if (ns) {
      ns.set('context', undefined);
    }
  }

  static run<T>(fn: (...args: any[]) => T, ...args: any[]): T {
    const ns = this.initialize();
    return ns.runAndReturn(() => {
      // Generate a new correlation ID for this execution context
      this.generateCorrelationId();
      return fn(...args);
    });
  }

  static async runAsync<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    const ns = this.initialize();
    return new Promise((resolve, reject) => {
      ns.runAndReturn(async () => {
        try {
          // Generate a new correlation ID for this execution context
          this.generateCorrelationId();
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  static bindEmitter(emitter: NodeJS.EventEmitter): void {
    const ns = this.initialize();
    ns.bindEmitter(emitter);
  }

  static bind<F extends Function>(fn: F): F {
    const ns = this.initialize();
    return ns.bind(fn);
  }

  static bindCallback<T extends (...args: any[]) => any>(callback: T): T {
    const ns = this.initialize();
    return ns.bind(callback);
  }
}

// Express middleware integration
export function correlationIdMiddleware(headerName: string = 'X-Correlation-ID') {
  return (req: any, res: any, next: any) => {
    LoggerContext.run(() => {
      // Try to get correlation ID from request header
      const correlationId = req.get(headerName) || uuidv4();

      // Set correlation ID in context
      LoggerContext.setCorrelationId(correlationId);

      // Also set request ID
      const requestId = req.get('X-Request-ID') || uuidv4();
      LoggerContext.setRequestId(requestId);

      // Set user ID if available (from auth middleware)
      if (req.user?.id) {
        LoggerContext.setUserId(req.user.id);
      }

      // Add correlation ID to response headers
      res.setHeader(headerName, correlationId);
      res.setHeader('X-Request-ID', requestId);

      next();
    });
  };
}

// NestJS interceptor helper
export function setupLoggingContext(
  correlationId?: string,
  requestId?: string,
  userId?: string,
): void {
  const ns = LoggerContext.initialize();

  ns.run(() => {
    LoggerContext.setContext({
      correlationId: correlationId || uuidv4(),
      requestId: requestId || uuidv4(),
      ...(userId && { userId }),
    });
  });
}

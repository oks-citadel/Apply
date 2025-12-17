import { Namespace } from 'cls-hooked';
export interface LoggingContext {
    correlationId: string;
    operationId?: string;
    operationName?: string;
    userId?: string;
    requestId?: string;
    sessionId?: string;
    [key: string]: any;
}
export declare class LoggerContext {
    private static namespace;
    static initialize(): Namespace;
    static getNamespace(): Namespace | undefined;
    static setContext(context: Partial<LoggingContext>): void;
    static getContext(): LoggingContext | undefined;
    static getCorrelationId(): string | undefined;
    static setCorrelationId(correlationId: string): void;
    static generateCorrelationId(): string;
    static getOperationId(): string | undefined;
    static setOperationId(operationId: string): void;
    static getUserId(): string | undefined;
    static setUserId(userId: string): void;
    static getRequestId(): string | undefined;
    static setRequestId(requestId: string): void;
    static clear(): void;
    static run<T>(fn: (...args: any[]) => T, ...args: any[]): T;
    static runAsync<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T>;
    static bindEmitter(emitter: NodeJS.EventEmitter): void;
    static bind<F extends Function>(fn: F): F;
    static bindCallback<T extends (...args: any[]) => any>(callback: T): T;
}
export declare function correlationIdMiddleware(headerName?: string): (req: any, res: any, next: any) => void;
export declare function setupLoggingContext(correlationId?: string, requestId?: string, userId?: string): void;

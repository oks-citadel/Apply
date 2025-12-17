import { SpanKind, Span, Context } from '@opentelemetry/api';
import type { Attributes, Link } from '@opentelemetry/api';
export interface SpanOptions {
    kind?: SpanKind;
    attributes?: Attributes;
    parentContext?: Context;
    links?: Link[];
}
export declare function createSpan(name: string, options?: SpanOptions): Span;
export declare function withSpan<T>(name: string, fn: (span: Span) => Promise<T>, options?: SpanOptions): Promise<T>;
export declare function withSpanSync<T>(name: string, fn: (span: Span) => T, options?: SpanOptions): T;
export declare function createChildSpan(name: string, attributes?: Attributes): Span;
export declare function addBusinessContext(contextAttrs: Attributes): void;
export declare function addUserContext(userId: string, email?: string, role?: string): void;
export declare function addTenantContext(tenantId: string, organizationId?: string): void;
export declare function recordEvent(name: string, attributes?: Attributes): void;
export declare function recordError(error: Error | string, attributes?: Attributes): void;
export declare function createDatabaseSpan(operation: string, table: string, attributes?: Attributes): Span;
export declare function createHttpClientSpan(method: string, url: string, attributes?: Attributes): Span;
export declare function createQueueSpan(operation: 'SEND' | 'RECEIVE' | 'PROCESS', queueName: string, attributes?: Attributes): Span;
export declare function createCacheSpan(operation: 'GET' | 'SET' | 'DELETE', key: string, attributes?: Attributes): Span;
export declare function propagateTraceContext(headers?: Record<string, string>): Record<string, string>;
export declare function extractSpanMetrics(span: Span): {
    name: string;
    duration?: number;
    attributes: Attributes;
};

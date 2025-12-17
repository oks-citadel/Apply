import { SpanKind } from '@opentelemetry/api';
import type { Attributes } from '@opentelemetry/api';
export interface TraceOptions {
    name?: string;
    kind?: SpanKind;
    attributes?: Attributes;
    recordArguments?: boolean;
    recordResult?: boolean;
    attributeExtractor?: (...args: any[]) => Attributes;
}
export declare function Trace(options?: TraceOptions): MethodDecorator;
export declare function TraceDatabase(operation: string, table: string): MethodDecorator;
export declare function TraceHttp(method: string, urlOrExtractor?: string | ((...args: any[]) => string)): MethodDecorator;
export declare function TraceCache(operation: 'GET' | 'SET' | 'DELETE', keyExtractor: (...args: any[]) => string): MethodDecorator;
export declare function TraceQueue(operation: 'SEND' | 'RECEIVE' | 'PROCESS', queueName: string): MethodDecorator;
export declare function TraceClass(options?: Omit<TraceOptions, 'name'>): ClassDecorator;
export declare function TraceTransaction(transactionName: string, options?: Omit<TraceOptions, 'name'>): MethodDecorator;
export declare function TraceError(errorHandler?: (error: Error) => void): MethodDecorator;

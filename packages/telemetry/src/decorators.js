"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trace = Trace;
exports.TraceDatabase = TraceDatabase;
exports.TraceHttp = TraceHttp;
exports.TraceCache = TraceCache;
exports.TraceQueue = TraceQueue;
exports.TraceClass = TraceClass;
exports.TraceTransaction = TraceTransaction;
exports.TraceError = TraceError;
const api_1 = require("@opentelemetry/api");
function Trace(options = {}) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const className = target.constructor.name;
        const methodName = String(propertyKey);
        descriptor.value = async function (...args) {
            const tracer = api_1.trace.getTracer('applyforus-tracer');
            const spanName = options.name || `${className}.${methodName}`;
            const attributes = {
                'code.function': methodName,
                'code.namespace': className,
                ...options.attributes,
            };
            if (options.attributeExtractor) {
                try {
                    const extractedAttrs = options.attributeExtractor(...args);
                    Object.assign(attributes, extractedAttrs);
                }
                catch (error) {
                    console.error('[Telemetry] Error extracting attributes:', error);
                }
            }
            if (options.recordArguments && args.length > 0) {
                try {
                    attributes['method.arguments'] = JSON.stringify(args);
                }
                catch (error) {
                    attributes['method.arguments'] = '[Circular or non-serializable]';
                }
            }
            return tracer.startActiveSpan(spanName, {
                kind: options.kind || api_1.SpanKind.INTERNAL,
                attributes,
            }, async (span) => {
                try {
                    const result = await originalMethod.apply(this, args);
                    if (options.recordResult && result !== undefined) {
                        try {
                            const resultStr = typeof result === 'object'
                                ? JSON.stringify(result)
                                : String(result);
                            span.setAttribute('method.result', resultStr);
                        }
                        catch (error) {
                        }
                    }
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                    return result;
                }
                catch (error) {
                    span.recordException(error);
                    span.setStatus({
                        code: api_1.SpanStatusCode.ERROR,
                        message: error instanceof Error ? error.message : 'Unknown error',
                    });
                    throw error;
                }
                finally {
                    span.end();
                }
            });
        };
        return descriptor;
    };
}
function TraceDatabase(operation, table) {
    return Trace({
        name: `db.${operation.toLowerCase()}`,
        kind: api_1.SpanKind.CLIENT,
        attributes: {
            'db.operation': operation,
            'db.table': table,
            'db.system': 'postgresql',
        },
    });
}
function TraceHttp(method, urlOrExtractor) {
    return function (target, propertyKey, descriptor) {
        const options = {
            name: `http.client.${method.toLowerCase()}`,
            kind: api_1.SpanKind.CLIENT,
            attributes: {
                'http.method': method,
            },
        };
        if (typeof urlOrExtractor === 'string') {
            options.attributes['http.url'] = urlOrExtractor;
        }
        else if (typeof urlOrExtractor === 'function') {
            options.attributeExtractor = (...args) => ({
                'http.url': urlOrExtractor(...args),
            });
        }
        return Trace(options)(target, propertyKey, descriptor);
    };
}
function TraceCache(operation, keyExtractor) {
    return Trace({
        name: `cache.${operation.toLowerCase()}`,
        kind: api_1.SpanKind.CLIENT,
        attributes: {
            'cache.operation': operation,
            'cache.system': 'redis',
        },
        attributeExtractor: (...args) => ({
            'cache.key': keyExtractor(...args),
        }),
    });
}
function TraceQueue(operation, queueName) {
    const kind = operation === 'SEND' ? api_1.SpanKind.PRODUCER : api_1.SpanKind.CONSUMER;
    return Trace({
        name: `messaging.${operation.toLowerCase()}`,
        kind,
        attributes: {
            'messaging.operation': operation,
            'messaging.destination': queueName,
            'messaging.system': 'redis',
        },
    });
}
function TraceClass(options = {}) {
    return function (target) {
        const className = target.name;
        const methodNames = Object.getOwnPropertyNames(target.prototype).filter((name) => {
            if (name === 'constructor')
                return false;
            const descriptor = Object.getOwnPropertyDescriptor(target.prototype, name);
            return descriptor && typeof descriptor.value === 'function';
        });
        methodNames.forEach((methodName) => {
            const descriptor = Object.getOwnPropertyDescriptor(target.prototype, methodName);
            if (descriptor) {
                const tracedDescriptor = Trace({
                    ...options,
                    name: `${className}.${methodName}`,
                })(target.prototype, methodName, descriptor);
                if (tracedDescriptor) {
                    Object.defineProperty(target.prototype, methodName, tracedDescriptor);
                }
            }
        });
        return target;
    };
}
function TraceTransaction(transactionName, options = {}) {
    return Trace({
        ...options,
        name: transactionName,
        attributes: {
            'transaction.type': 'business',
            ...options.attributes,
        },
    });
}
function TraceError(errorHandler) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            try {
                return await originalMethod.apply(this, args);
            }
            catch (error) {
                const span = api_1.trace.getActiveSpan();
                if (span) {
                    span.recordException(error);
                    span.setStatus({
                        code: api_1.SpanStatusCode.ERROR,
                        message: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
                if (errorHandler) {
                    errorHandler(error);
                }
                throw error;
            }
        };
        return descriptor;
    };
}
//# sourceMappingURL=decorators.js.map
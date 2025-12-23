"use strict";
/**
 * Decorators for automatic tracing of methods and classes
 */
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
/**
 * Method decorator to automatically trace method execution
 *
 * @param options - Trace configuration options
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Trace({ name: 'user.create', attributes: { 'service': 'user-service' } })
 *   async createUser(userData: CreateUserDto) {
 *     // Method implementation
 *   }
 *
 *   @Trace({
 *     attributeExtractor: (userId) => ({ 'user.id': userId })
 *   })
 *   async getUserById(userId: string) {
 *     // Method implementation
 *   }
 * }
 * ```
 */
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
            // Extract attributes from arguments if extractor is provided
            if (options.attributeExtractor) {
                try {
                    const extractedAttrs = options.attributeExtractor(...args);
                    Object.assign(attributes, extractedAttrs);
                }
                catch (error) {
                    console.error('[Telemetry] Error extracting attributes:', error);
                }
            }
            // Record arguments if enabled
            if (options.recordArguments && args.length > 0) {
                try {
                    attributes['method.arguments'] = JSON.stringify(args);
                }
                catch (error) {
                    // Ignore circular reference errors
                    attributes['method.arguments'] = '[Circular or non-serializable]';
                }
            }
            return tracer.startActiveSpan(spanName, {
                kind: options.kind || api_1.SpanKind.INTERNAL,
                attributes,
            }, async (span) => {
                try {
                    const result = await originalMethod.apply(this, args);
                    // Record result if enabled
                    if (options.recordResult && result !== undefined) {
                        try {
                            const resultStr = typeof result === 'object'
                                ? JSON.stringify(result)
                                : String(result);
                            span.setAttribute('method.result', resultStr);
                        }
                        catch (error) {
                            // Ignore serialization errors
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
/**
 * Decorator for tracing database operations
 *
 * @param operation - Database operation type (SELECT, INSERT, UPDATE, DELETE)
 * @param table - Table name
 *
 * @example
 * ```typescript
 * class UserRepository {
 *   @TraceDatabase('SELECT', 'users')
 *   async findUserById(id: string) {
 *     return this.userRepository.findOne({ where: { id } });
 *   }
 *
 *   @TraceDatabase('INSERT', 'users')
 *   async createUser(userData: User) {
 *     return this.userRepository.save(userData);
 *   }
 * }
 * ```
 */
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
/**
 * Decorator for tracing HTTP client calls
 *
 * @param method - HTTP method
 * @param urlOrExtractor - Static URL or function to extract URL from arguments
 *
 * @example
 * ```typescript
 * class ApiClient {
 *   @TraceHttp('GET', 'https://api.example.com/users')
 *   async getUsers() {
 *     return this.httpClient.get('/users');
 *   }
 *
 *   @TraceHttp('POST', (userId) => `https://api.example.com/users/${userId}`)
 *   async updateUser(userId: string, data: UpdateUserDto) {
 *     return this.httpClient.post(`/users/${userId}`, data);
 *   }
 * }
 * ```
 */
function TraceHttp(method, urlOrExtractor) {
    return function (target, propertyKey, descriptor) {
        const options = {
            name: `http.client.${method.toLowerCase()}`,
            kind: api_1.SpanKind.CLIENT,
            attributes: {
                'http.method': method,
            },
        };
        // Add URL attribute if static URL provided
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
/**
 * Decorator for tracing cache operations
 *
 * @param operation - Cache operation (GET, SET, DELETE)
 * @param keyExtractor - Function to extract cache key from method arguments
 *
 * @example
 * ```typescript
 * class CacheService {
 *   @TraceCache('GET', (key) => key)
 *   async get(key: string) {
 *     return this.redis.get(key);
 *   }
 *
 *   @TraceCache('SET', (key) => key)
 *   async set(key: string, value: any, ttl?: number) {
 *     return this.redis.set(key, value, 'EX', ttl || 3600);
 *   }
 * }
 * ```
 */
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
/**
 * Decorator for tracing message queue operations
 *
 * @param operation - Queue operation (SEND, RECEIVE, PROCESS)
 * @param queueName - Queue name
 *
 * @example
 * ```typescript
 * class EmailService {
 *   @TraceQueue('SEND', 'email-notifications')
 *   async sendEmail(emailData: EmailDto) {
 *     await this.queue.add('send-email', emailData);
 *   }
 *
 *   @TraceQueue('PROCESS', 'email-notifications')
 *   async processEmailJob(job: Job) {
 *     // Process email job
 *   }
 * }
 * ```
 */
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
/**
 * Class decorator to automatically trace all methods in a class
 *
 * @param options - Default trace options for all methods
 *
 * @example
 * ```typescript
 * @TraceClass({ attributes: { 'service': 'user-service' } })
 * class UserService {
 *   async createUser(userData: CreateUserDto) {
 *     // Automatically traced
 *   }
 *
 *   async getUserById(userId: string) {
 *     // Automatically traced
 *   }
 * }
 * ```
 */
function TraceClass(options = {}) {
    return function (target) {
        const className = target.name;
        // Get all method names
        const methodNames = Object.getOwnPropertyNames(target.prototype).filter((name) => {
            if (name === 'constructor')
                return false;
            const descriptor = Object.getOwnPropertyDescriptor(target.prototype, name);
            return descriptor && typeof descriptor.value === 'function';
        });
        // Apply @Trace decorator to each method
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
/**
 * Decorator for business transaction tracing
 *
 * Creates a span with business context attributes
 *
 * @param transactionName - Business transaction name
 * @param options - Additional trace options
 *
 * @example
 * ```typescript
 * class JobApplicationService {
 *   @TraceTransaction('job.apply', {
 *     attributeExtractor: (jobId, userId) => ({
 *       'job.id': jobId,
 *       'user.id': userId
 *     })
 *   })
 *   async applyForJob(jobId: string, userId: string, resumeData: ResumeDto) {
 *     // Business logic
 *   }
 * }
 * ```
 */
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
/**
 * Decorator to add error handling and tracking to methods
 *
 * @param errorHandler - Optional custom error handler
 *
 * @example
 * ```typescript
 * class PaymentService {
 *   @TraceError((error) => {
 *     if (error instanceof PaymentError) {
 *       // Custom error handling
 *     }
 *   })
 *   async processPayment(paymentData: PaymentDto) {
 *     // Payment processing logic
 *   }
 * }
 * ```
 */
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
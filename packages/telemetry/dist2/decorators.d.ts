/**
 * Decorators for automatic tracing of methods and classes
 */
import { SpanKind } from '@opentelemetry/api';
import type { Attributes } from '@opentelemetry/api';
/**
 * Options for the @Trace decorator
 */
export interface TraceOptions {
    /**
     * Custom span name (defaults to className.methodName)
     */
    name?: string;
    /**
     * Span kind
     */
    kind?: SpanKind;
    /**
     * Static attributes to add to the span
     */
    attributes?: Attributes;
    /**
     * Whether to record method arguments as span attributes
     */
    recordArguments?: boolean;
    /**
     * Whether to record return value as span attribute
     */
    recordResult?: boolean;
    /**
     * Custom attribute extractor from method arguments
     */
    attributeExtractor?: (...args: any[]) => Attributes;
}
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
export declare function Trace(options?: TraceOptions): MethodDecorator;
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
export declare function TraceDatabase(operation: string, table: string): MethodDecorator;
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
export declare function TraceHttp(method: string, urlOrExtractor?: string | ((...args: any[]) => string)): MethodDecorator;
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
export declare function TraceCache(operation: 'GET' | 'SET' | 'DELETE', keyExtractor: (...args: any[]) => string): MethodDecorator;
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
export declare function TraceQueue(operation: 'SEND' | 'RECEIVE' | 'PROCESS', queueName: string): MethodDecorator;
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
export declare function TraceClass(options?: Omit<TraceOptions, 'name'>): ClassDecorator;
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
export declare function TraceTransaction(transactionName: string, options?: Omit<TraceOptions, 'name'>): MethodDecorator;
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
export declare function TraceError(errorHandler?: (error: Error) => void): MethodDecorator;
//# sourceMappingURL=decorators.d.ts.map
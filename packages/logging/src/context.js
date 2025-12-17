"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerContext = void 0;
exports.correlationIdMiddleware = correlationIdMiddleware;
exports.setupLoggingContext = setupLoggingContext;
const cls_hooked_1 = require("cls-hooked");
const uuid_1 = require("uuid");
const NAMESPACE_NAME = 'applyforus-logging-context';
class LoggerContext {
    static initialize() {
        if (!this.namespace) {
            this.namespace = (0, cls_hooked_1.getNamespace)(NAMESPACE_NAME) || (0, cls_hooked_1.createNamespace)(NAMESPACE_NAME);
        }
        return this.namespace;
    }
    static getNamespace() {
        return this.namespace || (0, cls_hooked_1.getNamespace)(NAMESPACE_NAME);
    }
    static setContext(context) {
        const ns = this.initialize();
        if (!ns.active) {
            return;
        }
        try {
            const existingContext = ns.get('context') || {};
            const updatedContext = {
                ...existingContext,
                ...context,
            };
            ns.set('context', updatedContext);
        }
        catch {
        }
    }
    static getContext() {
        const ns = this.getNamespace();
        if (!ns)
            return undefined;
        return ns.get('context');
    }
    static getCorrelationId() {
        const context = this.getContext();
        return context?.correlationId;
    }
    static setCorrelationId(correlationId) {
        this.setContext({ correlationId });
    }
    static generateCorrelationId() {
        const correlationId = (0, uuid_1.v4)();
        this.setCorrelationId(correlationId);
        return correlationId;
    }
    static getOperationId() {
        const context = this.getContext();
        return context?.operationId;
    }
    static setOperationId(operationId) {
        this.setContext({ operationId });
    }
    static getUserId() {
        const context = this.getContext();
        return context?.userId;
    }
    static setUserId(userId) {
        this.setContext({ userId });
    }
    static getRequestId() {
        const context = this.getContext();
        return context?.requestId;
    }
    static setRequestId(requestId) {
        this.setContext({ requestId });
    }
    static clear() {
        const ns = this.getNamespace();
        if (ns) {
            ns.set('context', undefined);
        }
    }
    static run(fn, ...args) {
        const ns = this.initialize();
        return ns.runAndReturn(() => {
            this.generateCorrelationId();
            return fn(...args);
        });
    }
    static async runAsync(fn, ...args) {
        const ns = this.initialize();
        return new Promise((resolve, reject) => {
            ns.runAndReturn(async () => {
                try {
                    this.generateCorrelationId();
                    const result = await fn(...args);
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    static bindEmitter(emitter) {
        const ns = this.initialize();
        ns.bindEmitter(emitter);
    }
    static bind(fn) {
        const ns = this.initialize();
        return ns.bind(fn);
    }
    static bindCallback(callback) {
        const ns = this.initialize();
        return ns.bind(callback);
    }
}
exports.LoggerContext = LoggerContext;
function correlationIdMiddleware(headerName = 'X-Correlation-ID') {
    return (req, res, next) => {
        LoggerContext.run(() => {
            const correlationId = req.get(headerName) || (0, uuid_1.v4)();
            LoggerContext.setCorrelationId(correlationId);
            const requestId = req.get('X-Request-ID') || (0, uuid_1.v4)();
            LoggerContext.setRequestId(requestId);
            if (req.user?.id) {
                LoggerContext.setUserId(req.user.id);
            }
            res.setHeader(headerName, correlationId);
            res.setHeader('X-Request-ID', requestId);
            next();
        });
    };
}
function setupLoggingContext(correlationId, requestId, userId) {
    const ns = LoggerContext.initialize();
    ns.run(() => {
        LoggerContext.setContext({
            correlationId: correlationId || (0, uuid_1.v4)(),
            requestId: requestId || (0, uuid_1.v4)(),
            ...(userId && { userId }),
        });
    });
}
//# sourceMappingURL=context.js.map
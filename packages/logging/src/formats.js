"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStructuredFormat = createStructuredFormat;
exports.filterSensitiveData = filterSensitiveData;
exports.isSensitiveField = isSensitiveField;
exports.createRequestLogFormat = createRequestLogFormat;
exports.formatDuration = formatDuration;
exports.formatBytes = formatBytes;
exports.formatRequestLog = formatRequestLog;
exports.formatErrorLog = formatErrorLog;
const winston = require("winston");
const { combine, timestamp, errors, printf, colorize, json } = winston.format;
function createStructuredFormat(serviceName, environment) {
    const isDevelopment = environment === 'development' || environment === 'local';
    if (isDevelopment) {
        return combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), errors({ stack: true }), printf((info) => {
            const { timestamp, level, message, correlationId, operationId, errorStack, ...metadata } = info;
            let log = `${timestamp} [${level}] [${serviceName}]`;
            if (correlationId && typeof correlationId === 'string') {
                log += ` [CID: ${correlationId.substring(0, 8)}]`;
            }
            if (operationId && typeof operationId === 'string') {
                log += ` [OID: ${operationId.substring(0, 8)}]`;
            }
            log += `: ${message}`;
            const metadataKeys = Object.keys(metadata);
            if (metadataKeys.length > 0) {
                const filteredMetadata = filterSensitiveData(metadata);
                log += ` ${JSON.stringify(filteredMetadata, null, 2)}`;
            }
            if (errorStack) {
                log += `\n${errorStack}`;
            }
            return log;
        }));
    }
    else {
        return combine(timestamp({ format: 'iso' }), errors({ stack: true }), json({
            replacer: (key, value) => {
                if (isSensitiveField(key)) {
                    return '[REDACTED]';
                }
                return value;
            },
        }));
    }
}
function filterSensitiveData(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    const filtered = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (isSensitiveField(key)) {
                filtered[key] = '[REDACTED]';
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                filtered[key] = filterSensitiveData(obj[key]);
            }
            else {
                filtered[key] = obj[key];
            }
        }
    }
    return filtered;
}
function isSensitiveField(fieldName) {
    const sensitivePatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /api[_-]?key/i,
        /auth/i,
        /credential/i,
        /private[_-]?key/i,
        /access[_-]?key/i,
        /session/i,
        /cookie/i,
        /ssn/i,
        /social[_-]?security/i,
        /credit[_-]?card/i,
        /cvv/i,
        /pin/i,
    ];
    return sensitivePatterns.some((pattern) => pattern.test(fieldName));
}
function createRequestLogFormat() {
    return 'HTTP Request: :method :url - Status: :status - Duration: :response-time ms - Size: :res[content-length] bytes';
}
function formatDuration(milliseconds) {
    if (milliseconds < 1000) {
        return `${milliseconds.toFixed(2)}ms`;
    }
    else if (milliseconds < 60000) {
        return `${(milliseconds / 1000).toFixed(2)}s`;
    }
    else {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = ((milliseconds % 60000) / 1000).toFixed(2);
        return `${minutes}m ${seconds}s`;
    }
}
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
function formatRequestLog(metadata) {
    const { method, url, statusCode, duration, userAgent, ip, userId, requestId, correlationId, contentLength, } = metadata;
    let log = `${method} ${url} - ${statusCode} - ${formatDuration(duration)}`;
    if (contentLength) {
        log += ` - ${formatBytes(contentLength)}`;
    }
    if (userId) {
        log += ` - User: ${userId}`;
    }
    if (ip) {
        log += ` - IP: ${ip}`;
    }
    if (requestId) {
        log += ` - ReqID: ${requestId.substring(0, 8)}`;
    }
    if (correlationId) {
        log += ` - CorrID: ${correlationId.substring(0, 8)}`;
    }
    return log;
}
function formatErrorLog(metadata) {
    const { errorName, errorMessage, errorStack, statusCode, path, method, userId, correlationId, } = metadata;
    let log = `Error: ${errorName} - ${errorMessage}`;
    if (statusCode) {
        log += ` - Status: ${statusCode}`;
    }
    if (method && path) {
        log += ` - ${method} ${path}`;
    }
    if (userId) {
        log += ` - User: ${userId}`;
    }
    if (correlationId) {
        log += ` - CorrID: ${correlationId.substring(0, 8)}`;
    }
    if (errorStack) {
        log += `\n${errorStack}`;
    }
    return log;
}
//# sourceMappingURL=formats.js.map
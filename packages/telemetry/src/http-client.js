"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracedHttpClient = void 0;
exports.createHttpClient = createHttpClient;
exports.injectTraceContext = injectTraceContext;
exports.extractTraceContext = extractTraceContext;
const api_1 = require("@opentelemetry/api");
class TracedHttpClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || '';
        this.defaultTimeout = config.timeout || 30000;
        this.defaultHeaders = config.headers || {};
        this.serviceName = config.serviceName || 'unknown-service';
    }
    async get(url, headers) {
        return this.request({
            method: 'GET',
            url,
            headers,
        });
    }
    async post(url, body, headers) {
        return this.request({
            method: 'POST',
            url,
            body,
            headers,
        });
    }
    async put(url, body, headers) {
        return this.request({
            method: 'PUT',
            url,
            body,
            headers,
        });
    }
    async patch(url, body, headers) {
        return this.request({
            method: 'PATCH',
            url,
            body,
            headers,
        });
    }
    async delete(url, headers) {
        return this.request({
            method: 'DELETE',
            url,
            headers,
        });
    }
    async request(config) {
        const tracer = api_1.trace.getTracer('applyforus-tracer');
        const fullURL = this.resolveURL(config.url);
        return tracer.startActiveSpan(`HTTP ${config.method} ${this.extractPath(fullURL)}`, {
            kind: api_1.SpanKind.CLIENT,
            attributes: {
                'http.method': config.method,
                'http.url': fullURL,
                'http.target': this.extractPath(fullURL),
                'http.scheme': this.extractScheme(fullURL),
                'http.host': this.extractHost(fullURL),
                'service.name': this.serviceName,
            },
        }, async (span) => {
            try {
                const headers = this.prepareHeaders(config.headers);
                const carrier = {};
                api_1.propagation.inject(api_1.context.active(), carrier);
                Object.assign(headers, carrier);
                const response = await this.executeRequest({
                    ...config,
                    headers,
                    url: fullURL,
                    timeout: config.timeout || this.defaultTimeout,
                });
                span.setAttribute('http.status_code', response.status);
                span.setAttribute('http.response.size', JSON.stringify(response.data).length);
                if (response.status >= 200 && response.status < 400) {
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                }
                else if (response.status >= 400 && response.status < 500) {
                    span.setStatus({
                        code: api_1.SpanStatusCode.ERROR,
                        message: `Client error: ${response.status}`,
                    });
                }
                else {
                    span.setStatus({
                        code: api_1.SpanStatusCode.ERROR,
                        message: `Server error: ${response.status}`,
                    });
                }
                return response;
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
    }
    async executeRequest(config) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        try {
            const fetchConfig = {
                method: config.method,
                headers: config.headers,
                signal: controller.signal,
            };
            if (config.body) {
                fetchConfig.body = JSON.stringify(config.body);
                if (!config.headers?.['Content-Type']) {
                    config.headers = config.headers || {};
                    config.headers['Content-Type'] = 'application/json';
                }
            }
            const response = await fetch(config.url, fetchConfig);
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                data = await response.json();
            }
            else {
                data = (await response.text());
            }
            const headers = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
            return {
                status: response.status,
                statusText: response.statusText,
                headers,
                data,
            };
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    prepareHeaders(headers) {
        return {
            ...this.defaultHeaders,
            ...headers,
        };
    }
    resolveURL(url) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        if (this.baseURL) {
            const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
            const path = url.startsWith('/') ? url : `/${url}`;
            return `${base}${path}`;
        }
        return url;
    }
    extractPath(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname + urlObj.search;
        }
        catch {
            return url;
        }
    }
    extractScheme(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol.replace(':', '');
        }
        catch {
            return 'http';
        }
    }
    extractHost(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.host;
        }
        catch {
            return 'unknown';
        }
    }
}
exports.TracedHttpClient = TracedHttpClient;
function createHttpClient(config) {
    return new TracedHttpClient(config);
}
function injectTraceContext(headers = {}) {
    const carrier = { ...headers };
    api_1.propagation.inject(api_1.context.active(), carrier);
    return carrier;
}
function extractTraceContext(headers) {
    return api_1.propagation.extract(api_1.context.active(), headers);
}
//# sourceMappingURL=http-client.js.map
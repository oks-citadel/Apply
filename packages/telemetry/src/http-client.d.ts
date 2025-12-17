export interface HttpClientConfig {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
    serviceName?: string;
}
export interface HttpRequestConfig {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}
export interface HttpResponse<T = any> {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: T;
}
export declare class TracedHttpClient {
    private baseURL;
    private defaultTimeout;
    private defaultHeaders;
    private serviceName;
    constructor(config?: HttpClientConfig);
    get<T = any>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    patch<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    delete<T = any>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
    private executeRequest;
    private prepareHeaders;
    private resolveURL;
    private extractPath;
    private extractScheme;
    private extractHost;
}
export declare function createHttpClient(config?: HttpClientConfig): TracedHttpClient;
export declare function injectTraceContext(headers?: Record<string, string>): Record<string, string>;
export declare function extractTraceContext(headers: Record<string, string>): import("@opentelemetry/api").Context;

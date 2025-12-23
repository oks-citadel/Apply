"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusController = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const prometheus_metrics_service_1 = require("./prometheus-metrics.service");
/**
 * Prometheus Metrics Controller
 * Exposes /metrics endpoint for Prometheus scraping
 */
let PrometheusController = class PrometheusController {
    constructor(metricsService) {
        this.metricsService = metricsService;
    }
    async getMetrics() {
        return this.metricsService.getMetrics();
    }
    async getMetricsHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.PrometheusController = PrometheusController;
tslib_1.__decorate([
    (0, common_1.Get)('/metrics'),
    (0, common_1.Header)('Content-Type', 'text/plain; version=0.0.4; charset=utf-8'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], PrometheusController.prototype, "getMetrics", null);
tslib_1.__decorate([
    (0, common_1.Get)('/health/metrics'),
    (0, common_1.Header)('Content-Type', 'application/json'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], PrometheusController.prototype, "getMetricsHealth", null);
exports.PrometheusController = PrometheusController = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [prometheus_metrics_service_1.PrometheusMetricsService])
], PrometheusController);
//# sourceMappingURL=prometheus.controller.js.map
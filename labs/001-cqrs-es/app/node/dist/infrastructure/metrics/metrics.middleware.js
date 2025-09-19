"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsMiddleware = void 0;
exports.getRegistry = getRegistry;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let MetricsMiddleware = class MetricsMiddleware {
    registry;
    httpHistogram;
    constructor() {
        this.registry = new prom_client_1.Registry();
        // export default process metrics too
        (0, prom_client_1.collectDefaultMetrics)({ register: this.registry });
        this.httpHistogram = new prom_client_1.Histogram({
            name: 'http_server_request_duration_seconds',
            help: 'HTTP server request duration (seconds)',
            labelNames: ['method', 'route', 'status'],
            buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
        });
        this.registry.registerMetric(this.httpHistogram);
        // Expose registry globally via (req as any) to avoid singletons
        global.__metricsRegistry = this.registry;
        global.__httpHistogram = this.httpHistogram;
    }
    use(req, res, next) {
        const start = process.hrtime.bigint();
        res.on('finish', () => {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1e9; // seconds
            const method = req.method.toUpperCase();
            // Nest sets route later; if not available, fallback to req.path
            const route = req.route?.path || req.path || 'unknown';
            const status = res.statusCode.toString();
            this.httpHistogram
                .labels({ method, route, status })
                .observe(duration);
        });
        next();
    }
};
exports.MetricsMiddleware = MetricsMiddleware;
exports.MetricsMiddleware = MetricsMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MetricsMiddleware);
// Helpers for controllers
function getRegistry() {
    return global.__metricsRegistry;
}

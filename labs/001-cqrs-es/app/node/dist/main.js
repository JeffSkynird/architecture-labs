"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const metrics_middleware_1 = require("./infrastructure/metrics/metrics.middleware");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { abortOnError: true });
    // Global validation (DTOs en fases siguientes)
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true
    }));
    // HTTP Metrics for all paths
    const metricsMiddleware = new metrics_middleware_1.MetricsMiddleware();
    app.use(metricsMiddleware.use.bind(metricsMiddleware));
    const PORT = Number(process.env.PORT || 8080);
    await app.listen(PORT);
    // eslint-disable-next-line no-console
    console.log(`[lab001] up on http://localhost:${PORT}  (/healthz, /metrics)`);
}
bootstrap();

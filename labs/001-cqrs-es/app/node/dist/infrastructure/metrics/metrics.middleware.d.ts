import type { NestMiddleware } from '@nestjs/common';
import { Registry } from 'prom-client';
import type { Request, Response, NextFunction } from 'express';
export declare class MetricsMiddleware implements NestMiddleware {
    private readonly registry;
    private readonly httpHistogram;
    constructor();
    use(req: Request, res: Response, next: NextFunction): void;
}
export declare function getRegistry(): Registry;

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AppMetricsService } from './app-metrics.service';

const SKIP_PREFIXES = ['/metrics', '/swagger', '/api-json', '/api-yaml'];

function resolveModule(routePath: string, urlPath: string): string {
  const source = routePath || urlPath;
  const clean = source.split('?')[0].replace(/^\//, '');
  if (!clean) return 'app';
  const first = clean.split('/')[0];
  if (
    [
      'auth',
      'users',
      'companies',
      'projects',
      'project-stages',
      'tasks',
      'subtasks',
      'to-do',
    ].includes(first)
  ) {
    return first;
  }
  return 'app';
}

function resolveRoute(req: Request): string {
  const routePath = (req.route as { path?: string } | undefined)?.path;
  if (routePath) {
    const base = req.baseUrl || '';
    const combined = `${base}${routePath}`.replace(/\/+/g, '/') || '/';
    return combined;
  }
  // Fallback: strip query; avoid high-cardinality IDs when possible
  const path = (req.originalUrl || req.url || '/').split('?')[0];
  return path.replace(/\/[0-9a-fA-F-]{8,}(?=\/|$)/g, '/:id') || '/';
}

function shouldSkip(path: string): boolean {
  return SKIP_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: AppMetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const path = (req.originalUrl || req.url || '/').split('?')[0];

    if (shouldSkip(path)) {
      return next.handle();
    }

    const started = process.hrtime.bigint();
    const method = (req.method || 'GET').toUpperCase();

    return next.handle().pipe(
      tap({
        next: () => this.record(req, res, method, started),
        error: (err: { status?: number; statusCode?: number }) => {
          const status =
            err?.status ?? err?.statusCode ?? res.statusCode ?? 500;
          this.record(req, res, method, started, status);
        },
      }),
    );
  }

  private record(
    req: Request,
    res: Response,
    method: string,
    started: bigint,
    statusOverride?: number,
  ) {
    const durationNs = Number(process.hrtime.bigint() - started);
    const durationSeconds = durationNs / 1e9;
    const route = resolveRoute(req);
    const module = resolveModule(route, req.originalUrl || req.url || '/');
    const statusCode = statusOverride ?? res.statusCode ?? 200;
    this.metrics.observeHttp(module, method, route, statusCode, durationSeconds);
  }
}

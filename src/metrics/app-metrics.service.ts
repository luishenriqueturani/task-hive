import { Injectable } from '@nestjs/common';
import {
  InjectMetric,
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

export type OperationResult = 'success' | 'failure';

export const HTTP_REQUESTS_TOTAL = 'http_requests_total';
export const HTTP_REQUEST_DURATION_SECONDS = 'http_request_duration_seconds';
export const TASKHIVE_OPERATIONS_TOTAL = 'taskhive_operations_total';
export const WEBSOCKET_CONNECTIONS = 'websocket_connections';
export const WEBSOCKET_EVENTS_TOTAL = 'websocket_events_total';

export const httpRequestsTotalProvider = makeCounterProvider({
  name: HTTP_REQUESTS_TOTAL,
  help: 'Total HTTP requests handled by the API',
  labelNames: ['module', 'method', 'route', 'status_code'] as const,
});

export const httpRequestDurationProvider = makeHistogramProvider({
  name: HTTP_REQUEST_DURATION_SECONDS,
  help: 'HTTP request duration in seconds',
  labelNames: ['module', 'method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const taskhiveOperationsTotalProvider = makeCounterProvider({
  name: TASKHIVE_OPERATIONS_TOTAL,
  help: 'Domain operations by module',
  labelNames: ['module', 'operation', 'result'] as const,
});

export const websocketConnectionsProvider = makeGaugeProvider({
  name: WEBSOCKET_CONNECTIONS,
  help: 'Active WebSocket connections',
});

export const websocketEventsTotalProvider = makeCounterProvider({
  name: WEBSOCKET_EVENTS_TOTAL,
  help: 'WebSocket events',
  labelNames: ['event'] as const,
});

@Injectable()
export class AppMetricsService {
  constructor(
    @InjectMetric(HTTP_REQUESTS_TOTAL)
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric(HTTP_REQUEST_DURATION_SECONDS)
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric(TASKHIVE_OPERATIONS_TOTAL)
    private readonly operationsTotal: Counter<string>,
    @InjectMetric(WEBSOCKET_CONNECTIONS)
    private readonly websocketConnections: Gauge<string>,
    @InjectMetric(WEBSOCKET_EVENTS_TOTAL)
    private readonly websocketEventsTotal: Counter<string>,
  ) {}

  observeHttp(
    module: string,
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ) {
    const labels = {
      module,
      method,
      route,
      status_code: String(statusCode),
    };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, durationSeconds);
  }

  incOperation(
    module: string,
    operation: string,
    result: OperationResult,
  ) {
    this.operationsTotal.inc({ module, operation, result });
  }

  /**
   * Runs `fn` and records success/failure for the domain operation.
   */
  async track<T>(
    module: string,
    operation: string,
    fn: () => Promise<T> | T,
  ): Promise<T> {
    try {
      const result = await fn();
      this.incOperation(module, operation, 'success');
      return result;
    } catch (error) {
      this.incOperation(module, operation, 'failure');
      throw error;
    }
  }

  websocketConnected() {
    this.websocketConnections.inc();
    this.websocketEventsTotal.inc({ event: 'connect' });
  }

  websocketDisconnected() {
    this.websocketConnections.dec();
    this.websocketEventsTotal.inc({ event: 'disconnect' });
  }

  websocketEvent(event: string) {
    this.websocketEventsTotal.inc({ event });
  }
}

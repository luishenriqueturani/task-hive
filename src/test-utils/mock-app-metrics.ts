import { AppMetricsService } from 'src/metrics/app-metrics.service';

/** Minimal AppMetricsService stub for unit tests. */
export const mockAppMetricsProvider = {
  provide: AppMetricsService,
  useValue: {
    observeHttp: jest.fn(),
    incOperation: jest.fn(),
    track: jest.fn(
      async (_module: string, _operation: string, fn: () => unknown) => fn(),
    ),
    websocketConnected: jest.fn(),
    websocketDisconnected: jest.fn(),
    websocketEvent: jest.fn(),
  },
};

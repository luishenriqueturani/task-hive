import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {
  AppMetricsService,
  httpRequestDurationProvider,
  httpRequestsTotalProvider,
  taskhiveOperationsTotalProvider,
  websocketConnectionsProvider,
  websocketEventsTotalProvider,
} from './app-metrics.service';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    httpRequestsTotalProvider,
    httpRequestDurationProvider,
    taskhiveOperationsTotalProvider,
    websocketConnectionsProvider,
    websocketEventsTotalProvider,
    AppMetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
  exports: [AppMetricsService, PrometheusModule],
})
export class MetricsModule {}

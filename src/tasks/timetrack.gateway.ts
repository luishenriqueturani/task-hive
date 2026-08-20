import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AppMetricsService } from 'src/metrics/app-metrics.service';

export const TIMETRACK_EVENTS = {
  STARTED: 'timetrack:started',
  STOPPED: 'timetrack:stopped',
  UPDATED: 'timetrack:updated',
  DELETED: 'timetrack:deleted',
} as const;

@WebSocketGateway({ cors: true })
export class TimetrackGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TimetrackGateway.name);

  constructor(private readonly metrics: AppMetricsService) {}

  handleConnection() {
    this.logger.debug('Client connected');
    this.metrics.websocketConnected();
  }

  handleDisconnect() {
    this.logger.debug('Client disconnected');
    this.metrics.websocketDisconnected();
  }

  @SubscribeMessage('joinTask')
  handleJoinTask(
    @MessageBody() payload: { taskId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (payload?.taskId) {
      client.join(`task:${payload.taskId}`);
      this.metrics.websocketEvent('joinTask');
    }
  }

  private room(taskId: bigint | string): string {
    return `task:${taskId}`;
  }

  emitStarted(taskId: bigint | string, data: unknown) {
    this.server.to(this.room(taskId)).emit(TIMETRACK_EVENTS.STARTED, data);
    this.metrics.websocketEvent('timetrack:started');
  }

  emitStopped(taskId: bigint | string, data: unknown) {
    this.server.to(this.room(taskId)).emit(TIMETRACK_EVENTS.STOPPED, data);
    this.metrics.websocketEvent('timetrack:stopped');
  }

  emitUpdated(taskId: bigint | string, data: unknown) {
    this.server.to(this.room(taskId)).emit(TIMETRACK_EVENTS.UPDATED, data);
    this.metrics.websocketEvent('timetrack:updated');
  }

  emitDeleted(taskId: bigint | string, data: unknown) {
    this.server.to(this.room(taskId)).emit(TIMETRACK_EVENTS.DELETED, data);
    this.metrics.websocketEvent('timetrack:deleted');
  }
}

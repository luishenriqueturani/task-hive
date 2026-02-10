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

  handleConnection() {
    this.logger.debug('Client connected');
  }

  handleDisconnect() {
    this.logger.debug('Client disconnected');
  }

  @SubscribeMessage('joinTask')
  handleJoinTask(
    @MessageBody() payload: { taskId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (payload?.taskId) {
      client.join(`task:${payload.taskId}`);
    }
  }

  private room(taskId: bigint | string): string {
    return `task:${taskId}`;
  }

  emitStarted(taskId: bigint | string, data: unknown) {
    this.server.to(this.room(taskId)).emit(TIMETRACK_EVENTS.STARTED, data);
  }

  emitStopped(taskId: bigint | string, data: unknown) {
    this.server.to(this.room(taskId)).emit(TIMETRACK_EVENTS.STOPPED, data);
  }

  emitUpdated(taskId: bigint | string, data: unknown) {
    this.server.to(this.room(taskId)).emit(TIMETRACK_EVENTS.UPDATED, data);
  }

  emitDeleted(taskId: bigint | string, data: unknown) {
    this.server.to(this.room(taskId)).emit(TIMETRACK_EVENTS.DELETED, data);
  }
}

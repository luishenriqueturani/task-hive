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
import { AuthService } from 'src/auth/auth.service';
import { TasksService } from './tasks.service';
import { User } from 'src/users/entities/User.entity';

export const TIMETRACK_EVENTS = {
  STARTED: 'timetrack:started',
  STOPPED: 'timetrack:stopped',
  UPDATED: 'timetrack:updated',
  DELETED: 'timetrack:deleted',
} as const;

const SESSION_COOKIE = 'th_session';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class TimetrackGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TimetrackGateway.name);

  constructor(
    private readonly metrics: AppMetricsService,
    private readonly authService: AuthService,
    private readonly tasksService: TasksService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('missing token');
      const user = await this.authService.authenticateAccessToken(token);
      client.data.user = user;
      this.logger.debug(`Client connected (${user.id})`);
      this.metrics.websocketConnected();
    } catch {
      this.logger.debug('Client rejected (unauthenticated)');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.logger.debug('Client disconnected');
      this.metrics.websocketDisconnected();
    }
  }

  @SubscribeMessage('joinTask')
  async handleJoinTask(
    @MessageBody() payload: { taskId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User | undefined;
    if (!user?.id || !payload?.taskId) return;

    const allowed = await this.tasksService.userCanAccessTask(payload.taskId, user);
    if (!allowed) return;

    client.join(`task:${payload.taskId}`);
    this.metrics.websocketEvent('joinTask');
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }

    const cookieHeader = client.handshake.headers.cookie;
    if (typeof cookieHeader === 'string') {
      const match = cookieHeader.match(
        new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`),
      );
      if (match?.[1]) return decodeURIComponent(match[1]);
    }

    return null;
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

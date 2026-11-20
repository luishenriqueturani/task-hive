import { Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { isAdmin } from 'src/projects/project-permissions.helper';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { User } from 'src/users/entities/User.entity';
import { SupportTicket } from './entities/SupportTicket.entity';

export const SUPPORT_EVENTS = {
  MESSAGE: 'support:message',
} as const;

const SESSION_COOKIE = 'th_session';

@WebSocketGateway({
  namespace: '/support',
  cors: { origin: true, credentials: true },
})
export class SupportGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportGateway.name);

  constructor(
    @Inject(PostgreSQLTokens.SUPPORT_TICKET_REPOSITORY)
    private readonly tickets: Repository<SupportTicket>,
    private readonly metrics: AppMetricsService,
    private readonly authService: AuthService,
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

  @SubscribeMessage('joinTicket')
  async handleJoinTicket(
    @MessageBody() payload: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User | undefined;
    if (!user?.id || !payload?.ticketId) return;

    const allowed = await this.userCanAccessTicket(payload.ticketId, user);
    if (!allowed) return;

    client.join(this.room(payload.ticketId));
    this.metrics.websocketEvent('joinTicket');
  }

  emitMessage(ticketId: string, data: unknown) {
    this.server.to(this.room(ticketId)).emit(SUPPORT_EVENTS.MESSAGE, data);
    this.metrics.websocketEvent(SUPPORT_EVENTS.MESSAGE);
  }

  private async userCanAccessTicket(ticketId: string, user: User) {
    const ticket = await this.tickets.findOne({
      where: { id: ticketId },
      relations: ['createdBy'],
    });
    if (!ticket) return false;
    return isAdmin(user) || ticket.createdBy?.id === user.id;
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

  private room(ticketId: string): string {
    return `ticket:${ticketId}`;
  }
}

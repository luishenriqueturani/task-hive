import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { isAdmin } from 'src/projects/project-permissions.helper';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { User } from 'src/users/entities/User.entity';
import { CreateSupportMessageDto } from './dto/create-message.dto';
import { CreateSupportTicketDto } from './dto/create-ticket.dto';
import { ListSupportTicketsQueryDto } from './dto/list-tickets-query.dto';
import { PatchSupportTicketDto } from './dto/patch-ticket.dto';
import { SupportMessage } from './entities/SupportMessage.entity';
import { SupportTicket } from './entities/SupportTicket.entity';
import { SupportGateway } from './support.gateway';
import { SupportTicketStatus } from './support.enums';

type PublicUser = { id: string; name: string | null; email: string };

@Injectable()
export class SupportService {
  constructor(
    @Inject(PostgreSQLTokens.SUPPORT_TICKET_REPOSITORY)
    private readonly tickets: Repository<SupportTicket>,
    @Inject(PostgreSQLTokens.SUPPORT_MESSAGE_REPOSITORY)
    private readonly messages: Repository<SupportMessage>,
    private readonly gateway: SupportGateway,
    private readonly metrics: AppMetricsService,
  ) {}

  list(actor: User, query: ListSupportTicketsQueryDto) {
    return this.metrics.track('support', 'list', async () => {
      const where: Record<string, unknown> = {};
      if (!isAdmin(actor)) {
        where.createdBy = { id: actor.id };
      }
      if (query.status) where.status = query.status;
      if (query.q) {
        where.subject = ILike(`%${escapeLike(query.q.trim())}%`);
      }

      const rows = await this.tickets.find({
        where,
        relations: ['createdBy', 'assignedTo'],
        order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
        take: 100,
      });
      return rows.map((ticket) => this.ticketView(ticket));
    });
  }

  async create(actor: User, dto: CreateSupportTicketDto) {
    return this.metrics.track('support', 'create', async () => {
      const now = new Date();
      const saved = await this.tickets.save(
        this.tickets.create({
          subject: dto.subject.trim(),
          status: SupportTicketStatus.OPEN,
          createdBy: actor,
          assignedTo: null,
          lastMessageAt: now,
        }),
      );

      if (dto.body) {
        await this.postMessage(saved.id, actor, { body: dto.body });
      }

      const ticket = await this.loadAccessible(saved.id, actor);
      return this.ticketView(ticket);
    });
  }

  findOne(id: string, actor: User) {
    return this.metrics.track('support', 'findOne', async () => {
      const ticket = await this.loadAccessible(id, actor);
      return this.ticketView(ticket);
    });
  }

  async patch(id: string, actor: User, dto: PatchSupportTicketDto) {
    return this.metrics.track('support', 'patch', async () => {
      if (!dto.status && dto.assignToMe !== true) {
        throw new BadRequestException(
          'Indique status ou assignToMe para actualizar o ticket.',
        );
      }

      const ticket = await this.loadAccessible(id, actor);
      const isAuthor = ticket.createdBy?.id === actor.id;

      if (dto.assignToMe === true) {
        if (!isAdmin(actor)) {
          throw new ForbiddenException('Só o suporte pode assumir o ticket.');
        }
        ticket.assignedTo = actor;
      }

      if (dto.status) {
        this.applyStatus(ticket, actor, isAuthor, dto.status);
      }

      await this.tickets.save(ticket);
      const fresh = await this.loadAccessible(id, actor);
      return this.ticketView(fresh);
    });
  }

  listMessages(id: string, actor: User) {
    return this.metrics.track('support', 'messages', async () => {
      await this.loadAccessible(id, actor);
      const rows = await this.messages.find({
        where: { ticket: { id } },
        relations: ['author'],
        order: { createdAt: 'ASC' },
      });
      return rows.map((message) => this.messageView(message));
    });
  }

  async postMessage(id: string, actor: User, dto: CreateSupportMessageDto) {
    return this.metrics.track('support', 'message', async () => {
      const ticket = await this.loadAccessible(id, actor);
      if (ticket.status === SupportTicketStatus.CLOSED) {
        throw new BadRequestException(
          'Não é possível enviar mensagens num ticket encerrado.',
        );
      }

      const saved = await this.messages.save(
        this.messages.create({
          body: dto.body.trim(),
          ticket,
          author: actor,
        }),
      );
      const isAuthor = ticket.createdBy?.id === actor.id;
      ticket.lastMessageAt = saved.createdAt ?? new Date();
      ticket.status = isAuthor
        ? SupportTicketStatus.PENDING_ADMIN
        : SupportTicketStatus.PENDING_USER;
      await this.tickets.save(ticket);

      const payload = this.messageView({
        ...saved,
        author: actor,
      } as SupportMessage);
      this.gateway.emitMessage(ticket.id, payload);
      return payload;
    });
  }

  private applyStatus(
    ticket: SupportTicket,
    actor: User,
    isAuthor: boolean,
    status: SupportTicketStatus,
  ) {
    if (status === SupportTicketStatus.CLOSED) {
      ticket.status = SupportTicketStatus.CLOSED;
      return;
    }

    if (
      status === SupportTicketStatus.OPEN &&
      ticket.status === SupportTicketStatus.CLOSED
    ) {
      if (!isAuthor) {
        throw new ForbiddenException('Só o autor pode reabrir o ticket.');
      }
      ticket.status = SupportTicketStatus.OPEN;
      return;
    }

    if (!isAdmin(actor)) {
      throw new ForbiddenException('Não pode alterar este estado.');
    }
    ticket.status = status;
  }

  private async loadAccessible(id: string, actor: User) {
    const ticket = await this.tickets.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo'],
    });
    if (!ticket || !this.canAccess(ticket, actor)) {
      throw new NotFoundException('Ticket não encontrado.');
    }
    return ticket;
  }

  private canAccess(ticket: SupportTicket, actor: User) {
    return isAdmin(actor) || ticket.createdBy?.id === actor.id;
  }

  private ticketView(ticket: SupportTicket) {
    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      lastMessageAt: ticket.lastMessageAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      createdBy: publicUser(ticket.createdBy),
      assignedTo: publicUser(ticket.assignedTo),
    };
  }

  private messageView(message: SupportMessage) {
    return {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      author: publicUser(message.author),
    };
  }
}

function publicUser(user: User | null | undefined): PublicUser | null {
  if (!user) return null;
  return { id: user.id, name: user.name ?? null, email: user.email };
}

function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, '\\$&');
}

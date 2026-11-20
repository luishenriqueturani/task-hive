import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';
import {
  mockSupportMessageRepositoryProvider,
  mockSupportTicketRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { UserRole } from 'src/users/user-role.enum';
import { User } from 'src/users/entities/User.entity';
import { SupportGateway } from './support.gateway';
import { SupportService } from './support.service';
import { SupportTicketStatus } from './support.enums';

describe('SupportService', () => {
  let service: SupportService;
  let tickets: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let messages: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let gateway: { emitMessage: jest.Mock };

  const client = {
    id: 'user-client',
    name: 'Ana',
    email: 'ana@example.com',
    role: UserRole.CLIENT,
  } as User;
  const other = {
    id: 'user-other',
    name: 'Bruno',
    email: 'bruno@example.com',
    role: UserRole.CLIENT,
  } as User;
  const admin = {
    id: 'user-admin',
    name: 'Admin',
    email: 'admin@example.com',
    role: UserRole.ADMIN_GOD,
  } as User;

  const ticketRow = {
    id: 't1',
    subject: 'Erro no login',
    status: SupportTicketStatus.OPEN,
    lastMessageAt: new Date('2026-11-20T12:00:00.000Z'),
    createdAt: new Date('2026-11-20T12:00:00.000Z'),
    updatedAt: null,
    createdBy: client,
    assignedTo: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        SupportService,
        mockSupportTicketRepositoryProvider,
        mockSupportMessageRepositoryProvider,
        { provide: SupportGateway, useValue: { emitMessage: jest.fn() } },
      ],
    }).compile();

    service = module.get(SupportService);
    tickets = module.get(PostgreSQLTokens.SUPPORT_TICKET_REPOSITORY);
    messages = module.get(PostgreSQLTokens.SUPPORT_MESSAGE_REPOSITORY);
    gateway = module.get(SupportGateway);
    tickets.create.mockImplementation((row) => row);
    tickets.save.mockImplementation(async (row) => ({ id: 't1', ...row }));
    messages.create.mockImplementation((row) => row);
    messages.save.mockImplementation(async (row) => ({
      id: 'm1',
      createdAt: new Date('2026-11-20T12:01:00.000Z'),
      ...row,
    }));
  });

  it('cria ticket e primeira mensagem, fica à espera do suporte', async () => {
    tickets.findOne.mockResolvedValue({
      ...ticketRow,
      status: SupportTicketStatus.PENDING_ADMIN,
    });

    const created = await service.create(client, {
      subject: 'Erro no login',
      body: 'Não consigo entrar.',
    });

    expect(messages.save).toHaveBeenCalled();
    expect(gateway.emitMessage).toHaveBeenCalled();
    expect(created.id).toBe('t1');
    expect(created.status).toBe(SupportTicketStatus.PENDING_ADMIN);
  });

  it('lista só os tickets do cliente', async () => {
    tickets.find.mockResolvedValue([ticketRow]);
    await service.list(client, {});
    expect(tickets.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdBy: { id: client.id } },
      }),
    );
  });

  it('admin lista a fila global', async () => {
    tickets.find.mockResolvedValue([ticketRow]);
    await service.list(admin, { status: SupportTicketStatus.OPEN });
    expect(tickets.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: SupportTicketStatus.OPEN },
      }),
    );
  });

  it('esconde ticket alheio com 404', async () => {
    tickets.findOne.mockResolvedValue(ticketRow);
    await expect(service.findOne('t1', other)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('mensagem do cliente passa a PENDING_ADMIN e emite WS', async () => {
    tickets.findOne.mockResolvedValue({
      ...ticketRow,
      status: SupportTicketStatus.OPEN,
    });
    const message = await service.postMessage('t1', client, {
      body: 'Ainda falha.',
    });
    expect(message.body).toBe('Ainda falha.');
    expect(tickets.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: SupportTicketStatus.PENDING_ADMIN }),
    );
    expect(gateway.emitMessage).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ body: 'Ainda falha.' }),
    );
  });

  it('mensagem do admin passa a PENDING_USER', async () => {
    tickets.findOne.mockResolvedValue({ ...ticketRow });
    await service.postMessage('t1', admin, { body: 'Já estamos a ver.' });
    expect(tickets.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: SupportTicketStatus.PENDING_USER }),
    );
  });

  it('recusa mensagem em ticket encerrado', async () => {
    tickets.findOne.mockResolvedValue({
      ...ticketRow,
      status: SupportTicketStatus.CLOSED,
    });
    await expect(
      service.postMessage('t1', client, { body: 'Olá' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('autor fecha o ticket', async () => {
    tickets.findOne.mockResolvedValue({ ...ticketRow });
    await service.patch('t1', client, { status: SupportTicketStatus.CLOSED });
    expect(tickets.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: SupportTicketStatus.CLOSED }),
    );
  });

  it('autor reabre ticket encerrado', async () => {
    tickets.findOne.mockResolvedValue({
      ...ticketRow,
      status: SupportTicketStatus.CLOSED,
    });
    await service.patch('t1', client, { status: SupportTicketStatus.OPEN });
    expect(tickets.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: SupportTicketStatus.OPEN }),
    );
  });

  it('admin não reabre no lugar do autor', async () => {
    tickets.findOne.mockResolvedValue({
      ...ticketRow,
      status: SupportTicketStatus.CLOSED,
    });
    await expect(
      service.patch('t1', admin, { status: SupportTicketStatus.OPEN }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('só admin assume o ticket', async () => {
    tickets.findOne.mockResolvedValue({ ...ticketRow });
    await expect(
      service.patch('t1', client, { assignToMe: true }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await service.patch('t1', admin, { assignToMe: true });
    expect(tickets.save).toHaveBeenCalledWith(
      expect.objectContaining({ assignedTo: admin }),
    );
  });
});

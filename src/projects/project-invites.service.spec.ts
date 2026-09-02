import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, HttpException } from '@nestjs/common';
import { ProjectInvitesService } from './project-invites.service';
import { User } from 'src/users/entities/User.entity';
import { UserRole } from 'src/users/user-role.enum';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { ProjectInviteStatus } from './project-invite-status.enum';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';
import {
  mockProjectInviteRepositoryProvider,
  mockProjectRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';

describe('ProjectInvitesService', () => {
  let service: ProjectInvitesService;
  let invites: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  let projects: { findOne: jest.Mock };

  const owner = {
    id: 'owner-1',
    email: 'ana@example.com',
    role: UserRole.CLIENT,
  } as User;

  const project = {
    id: '1',
    name: 'Backlog',
    userOwner: owner,
    participants: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        ProjectInvitesService,
        mockProjectInviteRepositoryProvider,
        mockProjectRepositoryProvider,
      ],
    }).compile();

    service = module.get(ProjectInvitesService);
    invites = module.get(PostgreSQLTokens.PROJECT_INVITE_REPOSITORY);
    projects = module.get(PostgreSQLTokens.PROJECT_REPOSITORY);
    projects.findOne.mockResolvedValue(project);
    invites.update.mockResolvedValue({ affected: 0 });
    invites.count.mockResolvedValue(0);
    invites.findOne.mockResolvedValue(null);
    invites.find.mockResolvedValue([]);
  });

  it('cria convite pendente com token', async () => {
    const saved = {
      id: 'inv-1',
      email: 'bob@example.com',
      token: 'th_inv_abc',
      status: ProjectInviteStatus.PENDING,
      expiresAt: new Date(),
      createdAt: new Date(),
    };
    invites.save.mockResolvedValue(saved);

    const result = await service.create(1n, '  Bob@Example.com ', owner);
    expect(invites.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'bob@example.com',
        status: ProjectInviteStatus.PENDING,
      }),
    );
    expect(result.token).toBe('th_inv_abc');
    expect(result.email).toBe('bob@example.com');
  });

  it('recusa quem não gere o projeto', async () => {
    await expect(
      service.create(1n, 'bob@example.com', {
        id: 'other',
        role: UserRole.CLIENT,
      } as User),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('preview público do token', async () => {
    invites.findOne.mockResolvedValue({
      email: 'bob@example.com',
      status: ProjectInviteStatus.PENDING,
      expiresAt: new Date(Date.now() + 60_000),
      project: { name: 'Backlog' },
    });
    await expect(service.previewByToken('tok')).resolves.toEqual({
      email: 'bob@example.com',
      projectName: 'Backlog',
    });
  });

  it('recusa convite no tecto de convidados', async () => {
    invites.count.mockResolvedValue(2);
    await expect(service.create(1n, 'bob@example.com', owner)).rejects.toBeInstanceOf(
      HttpException,
    );
    try {
      await service.create(1n, 'bob@example.com', owner);
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(402);
    }
  });

  it('add por userId não consome vaga extra se já há pending', async () => {
    invites.findOne.mockResolvedValue({ id: 'inv-1' });
    invites.count.mockResolvedValue(2);
    await expect(
      service.assertCanAddParticipant(project as never, owner, 'bob@example.com'),
    ).resolves.toBeUndefined();
  });
});

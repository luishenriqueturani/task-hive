import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';
import {
  mockPersonalAccessTokenRepositoryProvider,
  mockPlanRepositoryProvider,
  mockProjectRepositoryProvider,
  mockTodoRepositoryProvider,
  mockUserRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { AccountKind } from 'src/users/account-kind.enum';
import { UserRole } from 'src/users/user-role.enum';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let users: { createQueryBuilder: jest.Mock; findOne: jest.Mock };
  let plans: { findOne: jest.Mock };
  let projects: { createQueryBuilder: jest.Mock };
  let todos: { count: jest.Mock };
  let pats: { count: jest.Mock };
  let subscriptions: {
    findLiveForSubjects: jest.Mock;
    findLiveForUser: jest.Mock;
    toPublic: jest.Mock;
  };
  let qb: Record<string, jest.Mock>;

  const ana = {
    id: 'u1',
    name: 'Ana',
    email: 'ana@example.com',
    role: UserRole.CLIENT,
    accountKind: AccountKind.INDIVIDUAL,
    createdAt: new Date('2026-01-01'),
    document: null,
    ownedCompany: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        AdminUsersService,
        mockUserRepositoryProvider,
        mockPlanRepositoryProvider,
        mockProjectRepositoryProvider,
        mockTodoRepositoryProvider,
        mockPersonalAccessTokenRepositoryProvider,
        {
          provide: SubscriptionsService,
          useValue: {
            findLiveForSubjects: jest.fn(),
            findLiveForUser: jest.fn(),
            toPublic: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminUsersService);
    users = module.get(PostgreSQLTokens.USER_REPOSITORY);
    plans = module.get(PostgreSQLTokens.PLAN_REPOSITORY);
    projects = module.get(PostgreSQLTokens.PROJECT_REPOSITORY);
    todos = module.get(PostgreSQLTokens.TODO_REPOSITORY);
    pats = module.get(PostgreSQLTokens.PERSONAL_ACCESS_TOKEN_REPOSITORY);
    subscriptions = module.get(SubscriptionsService);
    qb = users.createQueryBuilder();
  });

  it('lista paginado com plano trial implícito', async () => {
    qb.getManyAndCount.mockResolvedValue([[ana], 1]);
    subscriptions.findLiveForSubjects.mockResolvedValue([]);

    const result = await service.list({ page: 1, pageSize: 20 });

    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(20);
    expect(result.total).toBe(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 'u1',
        email: 'ana@example.com',
        plan: {
          id: null,
          slug: 'free-trial',
          name: 'Free Trial',
          status: 'TRIAL',
        },
      }),
    );
  });

  it('filtra por q e planSlug', async () => {
    qb.getManyAndCount.mockResolvedValue([[], 0]);
    subscriptions.findLiveForSubjects.mockResolvedValue([]);

    await service.list({
      page: 2,
      pageSize: 10,
      q: 'ana',
      planSlug: 'starter',
      accountKind: AccountKind.INDIVIDUAL,
      role: UserRole.CLIENT,
    });

    expect(qb.andWhere).toHaveBeenCalled();
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
  });

  it('detalhe junta usage e projectos', async () => {
    users.findOne.mockResolvedValue(ana);
    subscriptions.findLiveForUser.mockResolvedValue(null);
    plans.findOne.mockResolvedValue({
      slug: 'free-trial',
      isSystem: true,
      maxProjects: 3,
      maxApiKeys: 1,
      maxStandaloneTasks: 15,
      maxProjectGuests: 2,
    });
    const projectQb = projects.createQueryBuilder();
    projectQb.getCount.mockResolvedValue(2);
    projectQb.getMany.mockResolvedValue([
      { id: 'p1', name: 'Kanban', createdAt: new Date('2026-02-01') },
    ]);
    pats.count.mockResolvedValue(1);
    todos.count.mockResolvedValue(4);
    subscriptions.toPublic.mockReturnValue(null);

    const detail = await service.findOne('u1');

    expect(detail.usage).toEqual({
      projects: 2,
      apiKeys: 1,
      standaloneTasks: 4,
      projectGuests: null,
    });
    expect(detail.projects).toEqual([
      expect.objectContaining({ id: 'p1', name: 'Kanban' }),
    ]);
    expect(detail.limits.maxProjects).toBe(3);
  });

  it('detalhe 404', async () => {
    users.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

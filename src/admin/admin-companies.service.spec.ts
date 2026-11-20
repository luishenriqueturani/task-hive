import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';
import {
  mockCompanyRepositoryProvider,
  mockPlanRepositoryProvider,
  mockProjectRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { AdminCompaniesService } from './admin-companies.service';

describe('AdminCompaniesService', () => {
  let service: AdminCompaniesService;
  let companies: { createQueryBuilder: jest.Mock; findOne: jest.Mock };
  let plans: { findOne: jest.Mock };
  let projects: { createQueryBuilder: jest.Mock };
  let subscriptions: {
    findLiveForSubjects: jest.Mock;
    toPublic: jest.Mock;
  };
  let qb: Record<string, jest.Mock>;

  const acme = {
    id: 'c1',
    name: 'Acme',
    legalName: 'Acme Tecnologia Ltda',
    tradeName: 'Acme',
    document: '11444777000161',
    createdAt: new Date('2026-03-01'),
    owner: { id: 'u1', name: 'Ana', email: 'ana@acme.test', deletedAt: null },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        AdminCompaniesService,
        mockCompanyRepositoryProvider,
        mockPlanRepositoryProvider,
        mockProjectRepositoryProvider,
        {
          provide: SubscriptionsService,
          useValue: {
            findLiveForSubjects: jest.fn(),
            toPublic: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminCompaniesService);
    companies = module.get(PostgreSQLTokens.COMPANY_REPOSITORY);
    plans = module.get(PostgreSQLTokens.PLAN_REPOSITORY);
    projects = module.get(PostgreSQLTokens.PROJECT_REPOSITORY);
    subscriptions = module.get(SubscriptionsService);
    qb = companies.createQueryBuilder();
  });

  it('lista paginado com plano trial implícito', async () => {
    qb.getManyAndCount.mockResolvedValue([[acme], 1]);
    subscriptions.findLiveForSubjects.mockResolvedValue([]);

    const result = await service.list({ page: 1, pageSize: 20 });

    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(20);
    expect(result.total).toBe(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 'c1',
        legalName: 'Acme Tecnologia Ltda',
        document: '11444777000161',
        owner: { id: 'u1', name: 'Ana', email: 'ana@acme.test' },
        plan: {
          id: null,
          slug: 'free-trial',
          name: 'Free Trial',
          status: 'TRIAL',
        },
      }),
    );
  });

  it('filtra por q, document e planSlug', async () => {
    qb.getManyAndCount.mockResolvedValue([[], 0]);
    subscriptions.findLiveForSubjects.mockResolvedValue([]);

    await service.list({
      page: 1,
      pageSize: 20,
      q: 'acme',
      document: '11.444.777/0001-61',
      planSlug: 'starter',
    });

    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('detalhe junta owner, usage e projectos', async () => {
    companies.findOne.mockResolvedValue(acme);
    subscriptions.findLiveForSubjects.mockResolvedValue([]);
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
    subscriptions.toPublic.mockReturnValue(null);

    const detail = await service.findOne('c1');

    expect(detail.owner?.email).toBe('ana@acme.test');
    expect(detail.usage.projects).toBe(2);
    expect(detail.projects).toEqual([
      expect.objectContaining({ id: 'p1', name: 'Kanban' }),
    ]);
  });

  it('detalhe 404', async () => {
    companies.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

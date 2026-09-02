import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';
import {
  mockPlanBenefitRepositoryProvider,
  mockPlanRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { PlansService } from './plans.service';

describe('PlansService', () => {
  let service: PlansService;
  let plans: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
  };
  let benefits: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  const trial = {
    id: 'trial',
    slug: 'free-trial',
    name: 'Free Trial',
    isActive: true,
    isSystem: true,
    sortOrder: 0,
    maxProjects: 3,
    benefits: [],
  };
  const starter = {
    id: 'starter',
    slug: 'starter',
    name: 'Starter',
    description: null,
    accountKind: 'BOTH',
    interval: 'MONTHLY',
    priceCents: 2900,
    currency: 'BRL',
    isActive: true,
    isSystem: false,
    sortOrder: 1,
    maxProjects: 5,
    maxApiKeys: 2,
    maxStandaloneTasks: 30,
    maxProjectGuests: 3,
    benefits: [{ id: 'b1', title: 'Kanban', body: null, icon: null, sortOrder: 0 }],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        PlansService,
        mockPlanRepositoryProvider,
        mockPlanBenefitRepositoryProvider,
      ],
    }).compile();

    service = module.get(PlansService);
    plans = module.get(PostgreSQLTokens.PLAN_REPOSITORY);
    benefits = module.get(PostgreSQLTokens.PLAN_BENEFIT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findPublic só devolve planos activos que não são de sistema', async () => {
    plans.find.mockResolvedValue([starter]);
    const result = await service.findPublic();
    expect(plans.find).toHaveBeenCalledWith({
      where: { isActive: true, isSystem: false },
      relations: { benefits: true },
      order: { sortOrder: 'ASC', benefits: { sortOrder: 'ASC' } },
    });
    expect(result).toEqual([
      expect.objectContaining({
        slug: 'starter',
        name: 'Starter',
        priceCents: 2900,
        benefits: [{ id: 'b1', title: 'Kanban', body: null, icon: null, sortOrder: 0 }],
      }),
    ]);
    expect(result[0]).not.toHaveProperty('isSystem');
  });

  it('update altera quotas e devolve o plano admin', async () => {
    plans.findOne
      .mockResolvedValueOnce({ ...starter })
      .mockResolvedValueOnce({ ...starter, maxProjects: 9, benefits: [] });
    plans.save.mockImplementation(async (row) => row);

    const updated = await service.update('starter', { maxProjects: 9 });
    expect(plans.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'starter', maxProjects: 9 }),
    );
    expect(updated.maxProjects).toBe(9);
  });

  it('remove recusa plano de sistema', async () => {
    plans.findOne.mockResolvedValue(trial);
    await expect(service.remove('trial')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(plans.softDelete).not.toHaveBeenCalled();
  });

  it('remove faz soft delete de plano comercial', async () => {
    plans.findOne.mockResolvedValue({ ...starter });
    plans.softDelete.mockResolvedValue({ affected: 1 });
    await expect(service.remove('starter')).resolves.toEqual({ id: 'starter' });
    expect(plans.softDelete).toHaveBeenCalledWith('starter');
  });

  it('removeBenefit apaga e recarrega o plano', async () => {
    benefits.findOne.mockResolvedValue({ id: 'b1' });
    benefits.delete.mockResolvedValue({ affected: 1 });
    plans.findOne.mockResolvedValue({ ...starter, benefits: [] });
    await service.removeBenefit('starter', 'b1');
    expect(benefits.delete).toHaveBeenCalledWith('b1');
  });

  it('findOneAdmin lança 404', async () => {
    plans.findOne.mockResolvedValue(null);
    await expect(service.findOneAdmin('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

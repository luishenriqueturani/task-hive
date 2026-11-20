import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';
import {
  mockCompanyRepositoryProvider,
  mockDataSourceProvider,
  mockPlanRepositoryProvider,
  mockSubscriptionRepositoryProvider,
  mockUserRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { AccountKind } from 'src/users/account-kind.enum';
import { CouponsService } from 'src/coupons/coupons.service';
import { Subscription } from './entities/Subscription.entity';
import { SubscriptionStatus } from './subscription.enums';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptions: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let plans: { findOne: jest.Mock };
  let users: { findOne: jest.Mock };
  let companies: { findOne: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let coupons: {
    assertRedeemable: jest.Mock;
    recordRedemption: jest.Mock;
  };

  const actor = { id: 'admin-1', email: 'admin@taskhive.test' };
  const starter = {
    id: 'plan-starter',
    slug: 'starter',
    name: 'Starter',
    isSystem: false,
  };
  const pfUser = {
    id: 'u1',
    name: 'Ana',
    email: 'ana@example.com',
    accountKind: AccountKind.INDIVIDUAL,
    ownedCompany: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        SubscriptionsService,
        mockSubscriptionRepositoryProvider,
        mockPlanRepositoryProvider,
        mockUserRepositoryProvider,
        mockCompanyRepositoryProvider,
        mockDataSourceProvider,
        {
          provide: CouponsService,
          useValue: {
            assertRedeemable: jest.fn(),
            recordRedemption: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
    subscriptions = module.get(PostgreSQLTokens.SUBSCRIPTION_REPOSITORY);
    plans = module.get(PostgreSQLTokens.PLAN_REPOSITORY);
    users = module.get(PostgreSQLTokens.USER_REPOSITORY);
    companies = module.get(PostgreSQLTokens.COMPANY_REPOSITORY);
    dataSource = module.get(PostgreSQLTokens.DATA_SOURCE);
    coupons = module.get(CouponsService);
    subscriptions.create.mockImplementation((row) => row);
    subscriptions.save.mockImplementation(async (row) => ({
      id: row.id ?? 'sub-new',
      ...row,
    }));
    dataSource.transaction.mockImplementation(async (fn: (m: unknown) => unknown) =>
      fn({
        getRepository: (entity: unknown) => {
          if (entity === Subscription) return subscriptions;
          return {};
        },
      }),
    );
  });

  it('recusa XOR inválido', async () => {
    await expect(
      service.assign({ planId: starter.id }, actor as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.assign(
        { planId: starter.id, userId: 'u1', companyId: 'c1' },
        actor as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('atribui plano pago a PF e cancela o trial anterior', async () => {
    plans.findOne.mockResolvedValue(starter);
    users.findOne.mockResolvedValue(pfUser);
    const previous = {
      id: 'sub-old',
      status: SubscriptionStatus.TRIAL,
    };
    subscriptions.find.mockResolvedValue([previous]);
    subscriptions.findOne.mockResolvedValue({
      id: 'sub-new',
      status: SubscriptionStatus.ACTIVE,
      startsAt: new Date(),
      endsAt: null,
      canceledAt: null,
      plan: starter,
      coupon: null,
      user: pfUser,
      company: null,
    });

    const result = await service.assign(
      { userId: 'u1', planId: starter.id },
      actor as never,
    );

    expect(previous.status).toBe(SubscriptionStatus.CANCELED);
    expect(subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: SubscriptionStatus.ACTIVE,
        plan: starter,
        user: pfUser,
        company: null,
      }),
    );
    expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    expect(coupons.recordRedemption).not.toHaveBeenCalled();
  });

  it('aplica cupom e grava redemption', async () => {
    const coupon = { id: 'c1', code: 'WELCOME10' };
    plans.findOne.mockResolvedValue(starter);
    users.findOne.mockResolvedValue(pfUser);
    coupons.assertRedeemable.mockResolvedValue(coupon);
    subscriptions.find.mockResolvedValue([]);
    subscriptions.findOne.mockResolvedValue({
      id: 'sub-new',
      status: SubscriptionStatus.ACTIVE,
      startsAt: new Date(),
      endsAt: null,
      canceledAt: null,
      plan: starter,
      coupon,
      user: pfUser,
      company: null,
    });

    await service.assign(
      { userId: 'u1', planId: starter.id, couponCode: 'welcome10' },
      actor as never,
    );

    expect(coupons.assertRedeemable).toHaveBeenCalledWith('welcome10', starter);
    expect(coupons.recordRedemption).toHaveBeenCalledWith(
      expect.anything(),
      coupon,
      'sub-new',
      actor,
    );
  });

  it('404 se o plano não existe', async () => {
    plans.findOne.mockResolvedValue(null);
    await expect(
      service.assign({ userId: 'u1', planId: 'missing' }, actor as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

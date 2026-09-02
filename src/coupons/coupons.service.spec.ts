import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';
import {
  mockCouponRedemptionRepositoryProvider,
  mockCouponRepositoryProvider,
  mockPlanRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { CouponType } from './coupon.enums';
import { CouponsService } from './coupons.service';

describe('CouponsService', () => {
  let service: CouponsService;
  let coupons: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
  };
  let plans: { find: jest.Mock };

  const starter = {
    id: 'plan-starter',
    slug: 'starter',
    name: 'Starter',
    isSystem: false,
  };
  const trial = {
    id: 'plan-trial',
    slug: 'free-trial',
    name: 'Free Trial',
    isSystem: true,
  };
  const savedCoupon = {
    id: 'c1',
    code: 'WELCOME10',
    type: CouponType.PERCENT,
    value: 10,
    maxRedemptions: 50,
    redeemedCount: 1,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    applicablePlans: [starter],
    redemptions: [
      {
        id: 'r1',
        createdAt: new Date('2026-09-01T12:00:00.000Z'),
        subscriptionId: null,
        user: { id: 'u1', name: 'Ana', email: 'ana@example.com' },
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        CouponsService,
        mockCouponRepositoryProvider,
        mockCouponRedemptionRepositoryProvider,
        mockPlanRepositoryProvider,
      ],
    }).compile();

    service = module.get(CouponsService);
    coupons = module.get(PostgreSQLTokens.COUPON_REPOSITORY);
    plans = module.get(PostgreSQLTokens.PLAN_REPOSITORY);
    coupons.create.mockImplementation((row) => row);
    coupons.save.mockImplementation(async (row) => ({ id: 'c1', ...row }));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('cria cupom com código em maiúsculas e planos pagos', async () => {
    coupons.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(savedCoupon);
    plans.find.mockResolvedValue([starter]);

    const result = await service.create({
      code: 'welcome10',
      type: CouponType.PERCENT,
      value: 10,
      maxRedemptions: 50,
      planIds: ['plan-starter'],
    });

    expect(coupons.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'WELCOME10',
        type: CouponType.PERCENT,
        value: 10,
        applicablePlans: [starter],
      }),
    );
    expect(result.code).toBe('WELCOME10');
    expect(result.redemptions).toEqual([
      expect.objectContaining({
        id: 'r1',
        user: { id: 'u1', name: 'Ana', email: 'ana@example.com' },
      }),
    ]);
  });

  it('recusa percentual fora de 1–100', async () => {
    coupons.findOne.mockResolvedValue(null);
    await expect(
      service.create({
        code: 'BAD',
        type: CouponType.PERCENT,
        value: 150,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(coupons.save).not.toHaveBeenCalled();
  });

  it('recusa plano de sistema (trial)', async () => {
    coupons.findOne.mockResolvedValue(null);
    plans.find.mockResolvedValue([trial]);
    await expect(
      service.create({
        code: 'TRIAL',
        type: CouponType.PERCENT,
        value: 10,
        planIds: ['plan-trial'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recusa código duplicado', async () => {
    coupons.findOne.mockResolvedValue({ id: 'other', code: 'WELCOME10' });
    await expect(
      service.create({
        code: 'welcome10',
        type: CouponType.FIXED_CENTS,
        value: 1000,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('findAllAdmin devolve redemptions', async () => {
    coupons.find.mockResolvedValue([savedCoupon]);
    const list = await service.findAllAdmin();
    expect(list[0].redemptions).toHaveLength(1);
    expect(list[0].applicablePlans).toEqual([
      { id: 'plan-starter', slug: 'starter', name: 'Starter' },
    ]);
  });

  it('remove faz soft delete', async () => {
    coupons.findOne.mockResolvedValue(savedCoupon);
    coupons.softDelete.mockResolvedValue({ affected: 1 });
    await expect(service.remove('c1')).resolves.toEqual({ id: 'c1' });
    expect(coupons.softDelete).toHaveBeenCalledWith('c1');
  });

  it('findOneAdmin 404', async () => {
    coupons.findOne.mockResolvedValue(null);
    await expect(service.findOneAdmin('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

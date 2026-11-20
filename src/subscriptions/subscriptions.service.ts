import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { Company } from 'src/companies/entities/Company.entity';
import { CouponsService } from 'src/coupons/coupons.service';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { Plan } from 'src/plans/entities/Plan.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { AccountKind } from 'src/users/account-kind.enum';
import { User } from 'src/users/entities/User.entity';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { Subscription } from './entities/Subscription.entity';
import {
  LIVE_SUBSCRIPTION_STATUSES,
  SubscriptionStatus,
} from './subscription.enums';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(PostgreSQLTokens.SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: Repository<Subscription>,
    @Inject(PostgreSQLTokens.PLAN_REPOSITORY)
    private readonly plans: Repository<Plan>,
    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private readonly users: Repository<User>,
    @Inject(PostgreSQLTokens.COMPANY_REPOSITORY)
    private readonly companies: Repository<Company>,
    @Inject(PostgreSQLTokens.DATA_SOURCE)
    private readonly dataSource: DataSource,
    private readonly coupons: CouponsService,
    private readonly metrics: AppMetricsService,
  ) {}

  async assign(dto: AssignSubscriptionDto, actor: User) {
    return this.metrics.track('subscriptions', 'assign', async () => {
      if (Boolean(dto.userId) === Boolean(dto.companyId)) {
        throw new BadRequestException(
          'Indique userId ou companyId, não ambos.',
        );
      }

      const plan = await this.plans.findOne({ where: { id: dto.planId } });
      if (!plan) throw new NotFoundException('Plano não encontrado.');

      const coupon = dto.couponCode
        ? await this.coupons.assertRedeemable(dto.couponCode, plan)
        : null;

      const { user, company } = await this.resolveTarget(dto);

      return this.dataSource.transaction(async (manager) => {
        const subRepo = manager.getRepository(Subscription);
        const live = await subRepo.find({
          where: company
            ? {
                company: { id: company.id },
                status: In([...LIVE_SUBSCRIPTION_STATUSES]),
              }
            : {
                user: { id: user!.id },
                status: In([...LIVE_SUBSCRIPTION_STATUSES]),
              },
        });
        const now = new Date();
        for (const current of live) {
          current.status = SubscriptionStatus.CANCELED;
          current.canceledAt = now;
          await subRepo.save(current);
        }

        const saved = await subRepo.save(
          subRepo.create({
            status: plan.isSystem
              ? SubscriptionStatus.TRIAL
              : SubscriptionStatus.ACTIVE,
            plan,
            user: company ? null : user,
            company,
            coupon,
            startsAt: now,
            endsAt: null,
            canceledAt: null,
          }),
        );

        if (coupon) {
          await this.coupons.recordRedemption(
            manager,
            coupon,
            saved.id,
            actor,
          );
        }

        return this.findOneAdmin(saved.id, manager.getRepository(Subscription));
      });
    });
  }

  async findLiveForUser(userId: string, companyId?: string | null) {
    const where = companyId
      ? [
          {
            user: { id: userId },
            status: In([...LIVE_SUBSCRIPTION_STATUSES]),
          },
          {
            company: { id: companyId },
            status: In([...LIVE_SUBSCRIPTION_STATUSES]),
          },
        ]
      : {
          user: { id: userId },
          status: In([...LIVE_SUBSCRIPTION_STATUSES]),
        };
    return this.subscriptions.findOne({
      where,
      relations: { plan: true, coupon: true, user: true, company: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findLiveForSubjects(userIds: string[], companyIds: string[]) {
    if (userIds.length === 0 && companyIds.length === 0) return [];
    const where = [
      ...(userIds.length
        ? [
            {
              user: { id: In(userIds) },
              status: In([...LIVE_SUBSCRIPTION_STATUSES]),
            },
          ]
        : []),
      ...(companyIds.length
        ? [
            {
              company: { id: In(companyIds) },
              status: In([...LIVE_SUBSCRIPTION_STATUSES]),
            },
          ]
        : []),
    ];
    return this.subscriptions.find({
      where,
      relations: { plan: true, user: true, company: true, coupon: true },
    });
  }

  toPublic(sub: Subscription | null) {
    if (!sub?.plan) return null;
    return {
      id: sub.id,
      status: sub.status,
      startsAt: sub.startsAt,
      endsAt: sub.endsAt,
      coupon: sub.coupon
        ? { id: sub.coupon.id, code: sub.coupon.code }
        : null,
      plan: {
        id: sub.plan.id,
        slug: sub.plan.slug,
        name: sub.plan.name,
        status: sub.status,
      },
    };
  }

  private async findOneAdmin(
    id: string,
    repo: Repository<Subscription> = this.subscriptions,
  ) {
    const sub = await repo.findOne({
      where: { id },
      relations: { plan: true, coupon: true, user: true, company: true },
    });
    if (!sub) throw new NotFoundException('Assinatura não encontrada.');
    return {
      id: sub.id,
      status: sub.status,
      startsAt: sub.startsAt,
      endsAt: sub.endsAt,
      canceledAt: sub.canceledAt,
      user: sub.user
        ? { id: sub.user.id, name: sub.user.name, email: sub.user.email }
        : null,
      company: sub.company
        ? { id: sub.company.id, legalName: sub.company.legalName }
        : null,
      coupon: sub.coupon
        ? { id: sub.coupon.id, code: sub.coupon.code }
        : null,
      plan: {
        id: sub.plan.id,
        slug: sub.plan.slug,
        name: sub.plan.name,
        isSystem: sub.plan.isSystem,
      },
    };
  }

  private async resolveTarget(dto: AssignSubscriptionDto): Promise<{
    user: User | null;
    company: Company | null;
  }> {
    if (dto.companyId) {
      const company = await this.companies.findOne({
        where: { id: dto.companyId },
      });
      if (!company) throw new NotFoundException('Empresa não encontrada.');
      return { user: null, company };
    }

    const user = await this.users.findOne({
      where: { id: dto.userId },
      relations: { ownedCompany: true },
    });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');

    if (
      user.accountKind === AccountKind.COMPANY &&
      user.ownedCompany &&
      !user.ownedCompany.deletedAt
    ) {
      return { user, company: user.ownedCompany };
    }
    return { user, company: null };
  }
}

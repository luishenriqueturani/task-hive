import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import {
  CreatePlanBenefitDto,
  UpdatePlanBenefitDto,
  UpdatePlanDto,
} from './dto/plan.dto';
import { Plan } from './entities/Plan.entity';
import { PlanBenefit } from './entities/PlanBenefit.entity';

@Injectable()
export class PlansService {
  constructor(
    @Inject(PostgreSQLTokens.PLAN_REPOSITORY)
    private readonly plans: Repository<Plan>,
    @Inject(PostgreSQLTokens.PLAN_BENEFIT_REPOSITORY)
    private readonly benefits: Repository<PlanBenefit>,
    private readonly metrics: AppMetricsService,
  ) {}

  findPublic() {
    return this.metrics.track('plans', 'find_public', async () => {
      const plans = await this.plans.find({
        where: { isActive: true, isSystem: false },
        relations: { benefits: true },
        order: { sortOrder: 'ASC', benefits: { sortOrder: 'ASC' } },
      });
      return plans.map((plan) => this.toPublic(plan));
    });
  }

  findAllAdmin() {
    return this.metrics.track('plans', 'find_all_admin', () =>
      this.plans.find({
        relations: { benefits: true },
        order: { sortOrder: 'ASC', benefits: { sortOrder: 'ASC' } },
      }),
    );
  }

  async findOneAdmin(id: string) {
    return this.metrics.track('plans', 'find_one_admin', async () => {
      const plan = await this.plans.findOne({
        where: { id },
        relations: { benefits: true },
        order: { benefits: { sortOrder: 'ASC' } },
      });
      if (!plan) throw new NotFoundException('Plano não encontrado.');
      return plan;
    });
  }

  async update(id: string, dto: UpdatePlanDto) {
    return this.metrics.track('plans', 'update', async () => {
      const plan = await this.plans.findOne({ where: { id } });
      if (!plan) throw new NotFoundException('Plano não encontrado.');
      Object.assign(plan, dto);
      await this.plans.save(plan);
      return this.findOneAdmin(id);
    });
  }

  async remove(id: string) {
    return this.metrics.track('plans', 'remove', async () => {
      const plan = await this.findOneAdmin(id);
      if (plan.isSystem) {
        throw new ForbiddenException(
          'Não é possível apagar um plano de sistema.',
        );
      }
      await this.plans.softDelete(id);
      return { id };
    });
  }

  async addBenefit(planId: string, dto: CreatePlanBenefitDto) {
    return this.metrics.track('plans', 'add_benefit', async () => {
      const plan = await this.findOneAdmin(planId);
      const benefit = this.benefits.create({
        plan,
        title: dto.title,
        body: dto.body ?? null,
        icon: dto.icon ?? null,
        sortOrder: dto.sortOrder ?? plan.benefits.length,
      });
      await this.benefits.save(benefit);
      return this.findOneAdmin(planId);
    });
  }

  async updateBenefit(
    planId: string,
    benefitId: string,
    dto: UpdatePlanBenefitDto,
  ) {
    return this.metrics.track('plans', 'update_benefit', async () => {
      const benefit = await this.benefits.findOne({
        where: { id: benefitId, plan: { id: planId } },
      });
      if (!benefit) throw new NotFoundException('Benefício não encontrado.');
      Object.assign(benefit, dto);
      await this.benefits.save(benefit);
      return this.findOneAdmin(planId);
    });
  }

  async removeBenefit(planId: string, benefitId: string) {
    return this.metrics.track('plans', 'remove_benefit', async () => {
      const benefit = await this.benefits.findOne({
        where: { id: benefitId, plan: { id: planId } },
      });
      if (!benefit) throw new NotFoundException('Benefício não encontrado.');
      await this.benefits.delete(benefitId);
      return this.findOneAdmin(planId);
    });
  }

  private toPublic(plan: Plan) {
    return {
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      accountKind: plan.accountKind,
      interval: plan.interval,
      priceCents: plan.priceCents,
      currency: plan.currency,
      sortOrder: plan.sortOrder,
      maxProjects: plan.maxProjects,
      maxApiKeys: plan.maxApiKeys,
      maxStandaloneTasks: plan.maxStandaloneTasks,
      maxProjectGuests: plan.maxProjectGuests,
      benefits: [...(plan.benefits ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((benefit) => ({
          id: benefit.id,
          title: benefit.title,
          body: benefit.body,
          icon: benefit.icon,
          sortOrder: benefit.sortOrder,
        })),
    };
  }
}

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Plan } from 'src/plans/entities/Plan.entity';
import { CouponType } from './coupon.enums';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';
import { Coupon } from './entities/Coupon.entity';

@Injectable()
export class CouponsService {
  constructor(
    @Inject(PostgreSQLTokens.COUPON_REPOSITORY)
    private readonly coupons: Repository<Coupon>,
    @Inject(PostgreSQLTokens.PLAN_REPOSITORY)
    private readonly plans: Repository<Plan>,
    private readonly metrics: AppMetricsService,
  ) {}

  findAllAdmin() {
    return this.metrics.track('coupons', 'find_all_admin', async () => {
      const list = await this.coupons.find({
        relations: { applicablePlans: true, redemptions: { user: true } },
        order: { createdAt: 'DESC', redemptions: { createdAt: 'DESC' } },
      });
      return list.map((coupon) => this.toAdmin(coupon));
    });
  }

  async findOneAdmin(id: string) {
    return this.metrics.track('coupons', 'find_one_admin', async () => {
      const coupon = await this.load(id);
      return this.toAdmin(coupon);
    });
  }

  async create(dto: CreateCouponDto) {
    return this.metrics.track('coupons', 'create', async () => {
      const code = this.normalizeCode(dto.code);
      await this.assertCodeAvailable(code);
      this.assertValue(dto.type, dto.value);
      const applicablePlans = await this.resolvePlans(dto.planIds);
      const coupon = this.coupons.create({
        code,
        type: dto.type,
        value: dto.value,
        maxRedemptions: dto.maxRedemptions ?? null,
        redeemedCount: 0,
        startsAt: this.parseDate(dto.startsAt),
        expiresAt: this.parseDate(dto.expiresAt),
        isActive: dto.isActive ?? true,
        applicablePlans,
      });
      const saved = await this.coupons.save(coupon);
      return this.findOneAdmin(saved.id);
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    return this.metrics.track('coupons', 'update', async () => {
      const coupon = await this.load(id);
      if (dto.code !== undefined) {
        const code = this.normalizeCode(dto.code);
        await this.assertCodeAvailable(code, id);
        coupon.code = code;
      }
      const type = dto.type ?? coupon.type;
      const value = dto.value ?? coupon.value;
      this.assertValue(type, value);
      coupon.type = type;
      coupon.value = value;
      if (dto.maxRedemptions !== undefined) {
        coupon.maxRedemptions = dto.maxRedemptions;
      }
      if (dto.startsAt !== undefined) coupon.startsAt = this.parseDate(dto.startsAt);
      if (dto.expiresAt !== undefined) {
        coupon.expiresAt = this.parseDate(dto.expiresAt);
      }
      if (dto.isActive !== undefined) coupon.isActive = dto.isActive;
      if (dto.planIds !== undefined) {
        coupon.applicablePlans = await this.resolvePlans(dto.planIds);
      }
      await this.coupons.save(coupon);
      return this.findOneAdmin(id);
    });
  }

  async remove(id: string) {
    return this.metrics.track('coupons', 'remove', async () => {
      await this.load(id);
      await this.coupons.softDelete(id);
      return { id };
    });
  }

  private async load(id: string): Promise<Coupon> {
    const coupon = await this.coupons.findOne({
      where: { id },
      relations: { applicablePlans: true, redemptions: { user: true } },
      order: { redemptions: { createdAt: 'DESC' } },
    });
    if (!coupon) throw new NotFoundException('Cupom não encontrado.');
    return coupon;
  }

  private async assertCodeAvailable(code: string, ignoreId?: string) {
    const existing = await this.coupons.findOne({ where: { code } });
    if (existing && existing.id !== ignoreId) {
      throw new ConflictException('Já existe um cupom com este código.');
    }
  }

  private assertValue(type: CouponType, value: number) {
    if (type === CouponType.PERCENT && (value < 1 || value > 100)) {
      throw new BadRequestException(
        'Desconto percentual deve estar entre 1 e 100.',
      );
    }
    if (type === CouponType.FIXED_CENTS && value < 1) {
      throw new BadRequestException(
        'Desconto fixo deve ser pelo menos 1 cêntimo.',
      );
    }
  }

  private async resolvePlans(planIds?: string[]): Promise<Plan[]> {
    if (!planIds?.length) return [];
    const unique = [...new Set(planIds)];
    const plans = await this.plans.find({ where: { id: In(unique) } });
    if (plans.length !== unique.length) {
      throw new NotFoundException('Um ou mais planos não foram encontrados.');
    }
    if (plans.some((plan) => plan.isSystem)) {
      throw new BadRequestException(
        'Cupons não se aplicam ao plano de sistema (trial).',
      );
    }
    return plans;
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Data inválida.');
    }
    return date;
  }

  private toAdmin(coupon: Coupon) {
    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxRedemptions: coupon.maxRedemptions,
      redeemedCount: coupon.redeemedCount,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      isActive: coupon.isActive,
      applicablePlans: (coupon.applicablePlans ?? []).map((plan) => ({
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
      })),
      redemptions: (coupon.redemptions ?? []).map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        subscriptionId: item.subscriptionId,
        user: item.user
          ? { id: item.user.id, name: item.user.name, email: item.user.email }
          : null,
      })),
    };
  }
}

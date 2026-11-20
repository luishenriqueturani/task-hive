import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/Company.entity';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { Plan } from 'src/plans/entities/Plan.entity';
import { Project } from 'src/projects/entities/Project.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Subscription } from 'src/subscriptions/entities/Subscription.entity';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { AdminCompaniesQueryDto } from './dto/admin-companies-query.dto';

const FALLBACK_TRIAL_LIMITS = {
  maxProjects: 3,
  maxApiKeys: 1,
  maxStandaloneTasks: 15,
  maxProjectGuests: 2,
};

const LIVE_SUB_EXISTS = `
  SELECT 1 FROM subscription s
  INNER JOIN plan p ON p.id = s."planId"
  WHERE s."deletedAt" IS NULL
    AND s.status IN ('TRIAL', 'ACTIVE')
    AND s."companyId" = company.id
`;

@Injectable()
export class AdminCompaniesService {
  constructor(
    @Inject(PostgreSQLTokens.COMPANY_REPOSITORY)
    private readonly companies: Repository<Company>,
    @Inject(PostgreSQLTokens.PLAN_REPOSITORY)
    private readonly plans: Repository<Plan>,
    @Inject(PostgreSQLTokens.PROJECT_REPOSITORY)
    private readonly projects: Repository<Project>,
    private readonly subscriptions: SubscriptionsService,
    private readonly metrics: AppMetricsService,
  ) {}

  list(query: AdminCompaniesQueryDto) {
    return this.metrics.track('admin', 'companies_list', async () => {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const qb = this.companies
        .createQueryBuilder('company')
        .leftJoinAndSelect('company.owner', 'owner')
        .where('company.deletedAt IS NULL');

      const q = query.q?.trim();
      if (q) {
        qb.andWhere(
          '(company.name ILIKE :q OR company.legalName ILIKE :q OR company.tradeName ILIKE :q)',
          { q: `%${q}%` },
        );
      }
      const document = query.document?.replace(/\D/g, '') || query.document?.trim();
      if (document) {
        qb.andWhere('company.document ILIKE :document', {
          document: `%${document}%`,
        });
      }
      if (query.planSlug) {
        this.applyPlanSlugFilter(qb, query.planSlug);
      }

      const [rows, total] = await qb
        .orderBy('company.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      const live = await this.subscriptions.findLiveForSubjects(
        [],
        rows.map((row) => row.id),
      );

      return {
        items: rows.map((row) =>
          this.toListItem(row, this.matchLive(row, live)),
        ),
        total,
        page,
        pageSize,
      };
    });
  }

  findOne(id: string) {
    return this.metrics.track('admin', 'companies_detail', async () => {
      const company = await this.companies.findOne({
        where: { id },
        relations: { owner: true },
      });
      if (!company) throw new NotFoundException('Empresa não encontrada.');

      const liveList = await this.subscriptions.findLiveForSubjects([], [company.id]);
      const live = liveList[0] ?? null;
      const trialPlan = await this.plans.findOne({
        where: { slug: 'free-trial', isSystem: true },
      });
      const plan = live?.plan ?? trialPlan;
      const limits = plan
        ? {
            maxProjects: plan.maxProjects,
            maxApiKeys: plan.maxApiKeys,
            maxStandaloneTasks: plan.maxStandaloneTasks,
            maxProjectGuests: plan.maxProjectGuests,
          }
        : FALLBACK_TRIAL_LIMITS;

      const [projectsUsed, projects] = await Promise.all([
        this.countProjects(company.id),
        this.listProjects(company.id),
      ]);

      return {
        ...this.toListItem(company, live),
        usage: {
          projects: projectsUsed,
        },
        limits,
        projects,
        subscription: this.subscriptions.toPublic(live),
      };
    });
  }

  private applyPlanSlugFilter(
    qb: ReturnType<Repository<Company>['createQueryBuilder']>,
    planSlug: string,
  ) {
    if (planSlug === 'free-trial') {
      qb.andWhere(`(NOT EXISTS (${LIVE_SUB_EXISTS} AND p.slug <> :planSlug))`, {
        planSlug,
      });
      return;
    }
    qb.andWhere(`EXISTS (${LIVE_SUB_EXISTS} AND p.slug = :planSlug)`, {
      planSlug,
    });
  }

  private matchLive(company: Company, live: Subscription[]): Subscription | null {
    return live.find((sub) => sub.company?.id === company.id) ?? null;
  }

  private toListItem(company: Company, live: Subscription | null) {
    const owner = company.owner;
    const plan = live?.plan;
    return {
      id: company.id,
      name: company.name,
      legalName: company.legalName || company.name,
      tradeName: company.tradeName ?? null,
      document: company.document ?? null,
      createdAt: company.createdAt,
      owner:
        owner && !owner.deletedAt
          ? { id: owner.id, name: owner.name, email: owner.email }
          : null,
      plan: plan
        ? {
            id: plan.id,
            slug: plan.slug,
            name: plan.name,
            status: live!.status,
          }
        : {
            id: null,
            slug: 'free-trial',
            name: 'Free Trial',
            status: 'TRIAL',
          },
    };
  }

  private countProjects(companyId: string) {
    return this.projects
      .createQueryBuilder('project')
      .where('project.deletedAt IS NULL')
      .andWhere('project.companyOwnerId = :companyId', { companyId })
      .getCount();
  }

  private async listProjects(companyId: string) {
    const rows = await this.projects
      .createQueryBuilder('project')
      .where('project.deletedAt IS NULL')
      .andWhere('project.companyOwnerId = :companyId', { companyId })
      .orderBy('project.createdAt', 'DESC')
      .take(50)
      .getMany();
    return rows.map((project) => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
    }));
  }
}

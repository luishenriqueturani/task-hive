import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MoreThan, Repository } from 'typeorm';
import { PersonalAccessToken } from 'src/auth/entities/PersonalAccessToken.entity';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { Plan } from 'src/plans/entities/Plan.entity';
import { Project } from 'src/projects/entities/Project.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Subscription } from 'src/subscriptions/entities/Subscription.entity';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { ToDo } from 'src/to-do/entities/ToDo.entity';
import { User } from 'src/users/entities/User.entity';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

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
    AND (s."userId" = user.id OR s."companyId" = company.id)
`;

@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private readonly users: Repository<User>,
    @Inject(PostgreSQLTokens.PLAN_REPOSITORY)
    private readonly plans: Repository<Plan>,
    @Inject(PostgreSQLTokens.PROJECT_REPOSITORY)
    private readonly projects: Repository<Project>,
    @Inject(PostgreSQLTokens.TODO_REPOSITORY)
    private readonly todos: Repository<ToDo>,
    @Inject(PostgreSQLTokens.PERSONAL_ACCESS_TOKEN_REPOSITORY)
    private readonly pats: Repository<PersonalAccessToken>,
    private readonly subscriptions: SubscriptionsService,
    private readonly metrics: AppMetricsService,
  ) {}

  list(query: AdminUsersQueryDto) {
    return this.metrics.track('admin', 'users_list', async () => {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const qb = this.users
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.ownedCompany', 'company')
        .where('user.deletedAt IS NULL');

      const q = query.q?.trim();
      if (q) {
        qb.andWhere('(user.name ILIKE :q OR user.email ILIKE :q)', {
          q: `%${q}%`,
        });
      }
      if (query.accountKind) {
        qb.andWhere('user.accountKind = :accountKind', {
          accountKind: query.accountKind,
        });
      }
      if (query.role) {
        qb.andWhere('user.role = :role', { role: query.role });
      }
      if (query.planSlug) {
        this.applyPlanSlugFilter(qb, query.planSlug);
      }

      const [rows, total] = await qb
        .orderBy('user.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      const live = await this.subscriptions.findLiveForSubjects(
        rows.map((row) => row.id),
        rows
          .map((row) => row.ownedCompany?.id)
          .filter((id): id is string => Boolean(id)),
      );

      return {
        items: rows.map((row) => this.toListItem(row, this.matchLive(row, live))),
        total,
        page,
        pageSize,
      };
    });
  }

  findOne(id: string) {
    return this.metrics.track('admin', 'users_detail', async () => {
      const user = await this.users.findOne({
        where: { id },
        relations: { ownedCompany: true },
      });
      if (!user) throw new NotFoundException('Utilizador não encontrado.');

      const companyId = user.ownedCompany?.deletedAt
        ? null
        : user.ownedCompany?.id ?? null;
      const live = await this.subscriptions.findLiveForUser(user.id, companyId);
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

      const [projectsUsed, apiKeys, standaloneTasks, projects] =
        await Promise.all([
          this.countProjects(user.id, companyId),
          this.pats.count({
            where: { user: { id: user.id }, expiresAt: MoreThan(new Date()) },
          }),
          this.todos.count({ where: { user: { id: user.id } } }),
          this.listProjects(user.id, companyId),
        ]);

      return {
        ...this.toListItem(user, live),
        document: user.document ?? null,
        usage: {
          projects: projectsUsed,
          apiKeys,
          standaloneTasks,
          projectGuests: null as number | null,
        },
        limits,
        projects,
        subscription: this.subscriptions.toPublic(live),
      };
    });
  }

  private applyPlanSlugFilter(
    qb: ReturnType<Repository<User>['createQueryBuilder']>,
    planSlug: string,
  ) {
    if (planSlug === 'free-trial') {
      qb.andWhere(
        `(
          NOT EXISTS (${LIVE_SUB_EXISTS} AND p.slug <> :planSlug)
        )`,
        { planSlug },
      );
      return;
    }
    qb.andWhere(`EXISTS (${LIVE_SUB_EXISTS} AND p.slug = :planSlug)`, {
      planSlug,
    });
  }

  private matchLive(user: User, live: Subscription[]): Subscription | null {
    const companyId = user.ownedCompany?.id;
    return (
      live.find(
        (sub) =>
          sub.user?.id === user.id ||
          (companyId && sub.company?.id === companyId),
      ) ?? null
    );
  }

  private toListItem(user: User, live: Subscription | null) {
    const owned = user.ownedCompany;
    const plan = live?.plan;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountKind: user.accountKind,
      createdAt: user.createdAt,
      company:
        owned && !owned.deletedAt
          ? { id: owned.id, legalName: owned.legalName || owned.name }
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

  private countProjects(userId: string, companyId: string | null) {
    const qb = this.projects
      .createQueryBuilder('project')
      .where('project.deletedAt IS NULL');
    if (companyId) {
      qb.andWhere(
        '(project.userOwnerId = :userId OR project.companyOwnerId = :companyId)',
        { userId, companyId },
      );
    } else {
      qb.andWhere('project.userOwnerId = :userId', { userId });
    }
    return qb.getCount();
  }

  private async listProjects(userId: string, companyId: string | null) {
    const qb = this.projects
      .createQueryBuilder('project')
      .where('project.deletedAt IS NULL');
    if (companyId) {
      qb.andWhere(
        '(project.userOwnerId = :userId OR project.companyOwnerId = :companyId)',
        { userId, companyId },
      );
    } else {
      qb.andWhere('project.userOwnerId = :userId', { userId });
    }
    const rows = await qb
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

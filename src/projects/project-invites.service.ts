import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LessThan, Repository } from 'typeorm';
import { ProjectInvite } from './entities/ProjectInvite.entity';
import { Project } from './entities/Project.entity';
import { User } from 'src/users/entities/User.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { canManageProject } from './project-permissions.helper';
import { ProjectInviteStatus } from './project-invite-status.enum';
import { generateProjectInviteToken } from 'src/utils/token-hash';
import {
  GuestUsage,
  guestLimitForUser,
  hasGuestCapacity,
  planLimitGuestsException,
} from './guest-quota';
import { AppMetricsService } from 'src/metrics/app-metrics.service';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function inviteView(invite: ProjectInvite) {
  return {
    id: invite.id,
    email: invite.email,
    token: invite.token,
    status: invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
  };
}

@Injectable()
export class ProjectInvitesService {
  constructor(
    @Inject(PostgreSQLTokens.PROJECT_INVITE_REPOSITORY)
    private inviteRepository: Repository<ProjectInvite>,

    @Inject(PostgreSQLTokens.PROJECT_REPOSITORY)
    private projectsRepository: Repository<Project>,

    private readonly metrics: AppMetricsService,
  ) {}

  async create(projectId: bigint, email: string, actor: User) {
    return this.metrics.track('projects', 'create_invite', async () => {
      const project = await this.requireManageableProject(projectId, actor);
      const normalized = normalizeEmail(email);
      await this.expireStale(project.id);

      if (project.userOwner?.email?.toLowerCase() === normalized) {
        throw new BadRequestException('O dono do projeto já tem acesso total');
      }
      if (
        (project.participants ?? []).some(
          (p) => p.email?.toLowerCase() === normalized,
        )
      ) {
        throw new BadRequestException('Usuário já é participante do projeto');
      }

      const existing = await this.inviteRepository.findOne({
        where: {
          project: { id: project.id },
          email: normalized,
          status: ProjectInviteStatus.PENDING,
        },
      });
      if (existing) {
        throw new BadRequestException('Já existe um convite pendente para este e-mail');
      }

      const usage = await this.guestUsage(project, actor);
      if (!hasGuestCapacity(usage.used, usage.limit)) {
        throw planLimitGuestsException(usage.limit, usage.used);
      }

      const invite = await this.inviteRepository.save({
        project,
        email: normalized,
        token: generateProjectInviteToken(),
        invitedBy: actor,
        status: ProjectInviteStatus.PENDING,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        acceptedBy: null,
      });

      return inviteView(invite);
    });
  }

  async list(projectId: bigint, actor: User) {
    return this.metrics.track('projects', 'list_invites', async () => {
      const project = await this.requireManageableProject(projectId, actor);
      await this.expireStale(project.id);
      const invites = await this.inviteRepository.find({
        where: {
          project: { id: project.id },
          status: ProjectInviteStatus.PENDING,
        },
        order: { createdAt: 'DESC' },
      });
      return {
        invites: invites.map(inviteView),
        guestUsage: await this.guestUsage(project, actor),
      };
    });
  }

  async revoke(projectId: bigint, inviteId: string, actor: User) {
    return this.metrics.track('projects', 'revoke_invite', async () => {
      await this.requireManageableProject(projectId, actor);
      const invite = await this.inviteRepository.findOne({
        where: { id: inviteId, project: { id: String(projectId) } },
      });
      if (!invite || invite.status !== ProjectInviteStatus.PENDING) {
        throw new NotFoundException('Convite não encontrado');
      }
      invite.status = ProjectInviteStatus.REVOKED;
      await this.inviteRepository.save(invite);
      return this.list(projectId, actor);
    });
  }

  async previewByToken(token: string) {
    const invite = await this.inviteRepository.findOne({
      where: { token },
      relations: ['project'],
    });
    if (
      !invite ||
      invite.status !== ProjectInviteStatus.PENDING ||
      invite.expiresAt.getTime() <= Date.now()
    ) {
      throw new NotFoundException('Convite inválido ou expirado.');
    }
    return {
      email: invite.email,
      projectName: invite.project?.name ?? undefined,
    };
  }

  async acceptByToken(token: string, actor: User) {
    return this.metrics.track('projects', 'accept_invite', async () => {
      const invite = await this.inviteRepository.findOne({
        where: { token },
        relations: ['project', 'project.userOwner', 'project.participants'],
      });
      if (
        !invite ||
        invite.status !== ProjectInviteStatus.PENDING ||
        invite.expiresAt.getTime() <= Date.now()
      ) {
        throw new NotFoundException('Convite inválido ou expirado.');
      }
      if (normalizeEmail(actor.email) !== normalizeEmail(invite.email)) {
        throw new ForbiddenException('Este convite é para outro e-mail.');
      }

      const project = invite.project;
      if (!project) {
        throw new NotFoundException('Convite inválido ou expirado.');
      }

      const alreadyMember =
        project.userOwner?.id === actor.id ||
        (project.participants ?? []).some((p) => p.id === actor.id);
      if (!alreadyMember) {
        await this.projectsRepository.save({
          ...project,
          participants: [...(project.participants ?? []), actor],
        });
      }

      invite.status = ProjectInviteStatus.ACCEPTED;
      invite.acceptedBy = actor;
      await this.inviteRepository.save(invite);

      return {
        projectId: project.id,
        projectName: project.name,
      };
    });
  }

  async assertCanAddParticipant(project: Project, actor: User, email: string) {
    await this.expireStale(project.id);
    const pendingForEmail = await this.inviteRepository.findOne({
      where: {
        project: { id: project.id },
        email: normalizeEmail(email),
        status: ProjectInviteStatus.PENDING,
      },
    });
    const usage = await this.guestUsage(project, actor);
    if (pendingForEmail) return;
    if (!hasGuestCapacity(usage.used, usage.limit)) {
      throw planLimitGuestsException(usage.limit, usage.used);
    }
  }

  async acceptPendingForEmail(projectId: string, email: string, acceptedBy: User) {
    const invite = await this.inviteRepository.findOne({
      where: {
        project: { id: projectId },
        email: normalizeEmail(email),
        status: ProjectInviteStatus.PENDING,
      },
    });
    if (!invite) return;
    invite.status = ProjectInviteStatus.ACCEPTED;
    invite.acceptedBy = acceptedBy;
    await this.inviteRepository.save(invite);
  }

  private async guestUsage(project: Project, actor: User): Promise<GuestUsage> {
    const pendingInvites = await this.inviteRepository.count({
      where: {
        project: { id: project.id },
        status: ProjectInviteStatus.PENDING,
      },
    });
    const used = (project.participants ?? []).length + pendingInvites;
    return {
      used,
      limit: guestLimitForUser(actor),
      pendingInvites,
    };
  }

  private async expireStale(projectId: string) {
    await this.inviteRepository.update(
      {
        project: { id: projectId },
        status: ProjectInviteStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      { status: ProjectInviteStatus.EXPIRED },
    );
  }

  private async requireManageableProject(projectId: bigint, actor: User) {
    const project = await this.projectsRepository.findOne({
      where: { id: String(projectId) },
      relations: ['userOwner', 'participants'],
    });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }
    if (!canManageProject(project, actor)) {
      throw new ForbiddenException('Sem permissão para gerir convites deste projeto');
    }
    return project;
  }
}

import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Repository } from 'typeorm';
import { Project } from 'src/projects/entities/Project.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { User } from 'src/users/entities/User.entity';
import { CompaniesService } from 'src/companies/companies.service';
import { Company } from 'src/companies/entities/Company.entity';
import { canManageProject, canAccessProject } from './project-permissions.helper';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { ProjectListScope } from './project-list-scope';

@Injectable()
export class ProjectsService {

  constructor(
    @Inject(PostgreSQLTokens.PROJECT_REPOSITORY)
    private projectsRepository: Repository<Project>,

    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private userRepository: Repository<User>,

    private companiesService: CompaniesService,
    private snowflakeIdService: SnowflakeIdService,
    private readonly metrics: AppMetricsService,
  ) {}


  async create(createProjectDto: CreateProjectDto, user: User) {
    return this.metrics.track('projects', 'create', async () => {
      try {
        let company : Company | undefined

        if(createProjectDto.companyOwnerId) {
          company = await this.companiesService.findOne(createProjectDto.companyOwnerId)
        }

        return await this.projectsRepository.save({
          id: String(this.snowflakeIdService.generateId()),
          name: createProjectDto.name,
          description: createProjectDto.description,
          userOwner: user,
          companyOwner: company,
        })

      } catch (error) {
        if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
        throw new InternalServerErrorException('Erro ao criar o projeto', { cause: error });
      }
    });
  }

  async findAll(user: User, scope: ProjectListScope = 'all') {
    return this.metrics.track('projects', 'find_all', async () => {
      try {
        const qb = this.projectsRepository
          .createQueryBuilder('project')
          .leftJoin('project.userOwner', 'owner')
          .addSelect(['owner.id', 'owner.name', 'owner.email', 'owner.avatar', 'owner.role'])
          .leftJoin('project.participants', 'participants')
          .addSelect(['participants.id', 'participants.name', 'participants.email', 'participants.avatar', 'participants.role']);

        if (scope === 'owned') {
          qb.andWhere('owner.id = :userId', { userId: user.id });
        } else if (scope === 'invited') {
          qb.innerJoin(
            'project.participants',
            'member',
            'member.id = :userId',
            { userId: user.id },
          );
        } else {
          qb.andWhere('(owner.id = :userId OR participants.id = :userId)', {
            userId: user.id,
          });
        }

        return qb.getMany();
      } catch (error) {
        throw new InternalServerErrorException('Erro ao buscar todos os projetos', { cause: error });
      }
    });
  }

  async findOne(id: bigint, user: User) {
    return this.metrics.track('projects', 'find_one', async () => {
      const project = await this.findOneWithOwnerAndParticipants(id);
      if (!project || !canAccessProject(project, user)) {
        throw new NotFoundException('Projeto não encontrado');
      }
      return this.findOneEntity(id);
    });
  }

  /** Internal lookup without domain metric (used by other modules). */
  async findOneWithOwnerAndParticipants(id: bigint) {
    try {
      return this.projectsRepository.findOne({
        where: { id: String(id) },
        relations: ['userOwner', 'participants'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar o projeto', { cause: error });
    }
  }

  async update(id: bigint, updateProjectDto: UpdateProjectDto, user: User) {
    return this.metrics.track('projects', 'update', async () => {
      const project = await this.findOneWithOwnerAndParticipants(id);
      if (!project) {
        throw new NotFoundException('Projeto não encontrado');
      }
      if (!canManageProject(project, user)) {
        throw new ForbiddenException('Sem permissão para editar este projeto');
      }
      try {
        await this.projectsRepository.update(id.toString(), {
          name: updateProjectDto.name,
          description: updateProjectDto.description,
        });
        return this.findOneEntity(id);
      } catch (error) {
        throw new InternalServerErrorException('Erro ao atualizar o projeto', { cause: error });
      }
    });
  }

  async remove(id: bigint, user: User) {
    return this.metrics.track('projects', 'remove', async () => {
      const project = await this.findOneWithOwnerAndParticipants(id);
      if (!project) {
        throw new NotFoundException('Projeto não encontrado');
      }
      if (!canManageProject(project, user)) {
        throw new ForbiddenException('Sem permissão para remover este projeto');
      }
      try {
        await this.projectsRepository.update(id.toString(), {
          deletedAt: new Date(),
        });
        return project;
      } catch (error) {
        throw new InternalServerErrorException('Erro ao remover o projeto', { cause: error });
      }
    });
  }

  async listParticipants(projectId: bigint, user: User) {
    return this.metrics.track('projects', 'list_participants', async () => {
      const project = await this.findOneWithOwnerAndParticipants(projectId);
      if (!project) {
        throw new NotFoundException('Projeto não encontrado');
      }
      if (!canAccessProject(project, user)) {
        throw new ForbiddenException('Sem permissão para listar participantes deste projeto');
      }
      const withParticipants = await this.projectsRepository.findOne({
        where: { id: String(projectId) },
        relations: ['participants'],
      });
      const participants = withParticipants?.participants ?? [];
      return participants.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        role: p.role,
      }));
    });
  }

  async addParticipant(projectId: bigint, userId: string, user: User) {
    return this.metrics.track('projects', 'add_participant', async () => {
      const project = await this.findOneWithOwnerAndParticipants(projectId);
      if (!project) {
        throw new NotFoundException('Projeto não encontrado');
      }
      if (!canManageProject(project, user)) {
        throw new ForbiddenException('Sem permissão para adicionar participantes');
      }
      const userToAdd = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!userToAdd) {
        throw new NotFoundException('Usuário não encontrado');
      }
      const currentIds = (project.participants ?? []).map((p) => p.id);
      if (currentIds.includes(userId)) {
        throw new BadRequestException('Usuário já é participante do projeto');
      }
      if (project.userOwner?.id === userId) {
        throw new BadRequestException('O dono do projeto já tem acesso total');
      }
      const updatedParticipants = [...(project.participants ?? []), userToAdd];
      await this.projectsRepository.save({
        ...project,
        participants: updatedParticipants,
      });
      return this.listParticipantsUntracked(projectId, user);
    });
  }

  async removeParticipant(projectId: bigint, participantUserId: string, user: User) {
    return this.metrics.track('projects', 'remove_participant', async () => {
      const project = await this.findOneWithOwnerAndParticipants(projectId);
      if (!project) {
        throw new NotFoundException('Projeto não encontrado');
      }
      if (!canManageProject(project, user)) {
        throw new ForbiddenException('Sem permissão para remover participantes');
      }
      const updatedParticipants = (project.participants ?? []).filter((p) => p.id !== participantUserId);
      await this.projectsRepository.save({
        ...project,
        participants: updatedParticipants,
      });
      return this.listParticipantsUntracked(projectId, user);
    });
  }

  private async findOneEntity(id: bigint) {
    try {
      return this.projectsRepository.findOne({
        where: { id: String(id) },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar o projeto', { cause: error });
    }
  }

  private async listParticipantsUntracked(projectId: bigint, user: User) {
    const project = await this.findOneWithOwnerAndParticipants(projectId);
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }
    if (!canAccessProject(project, user)) {
      throw new ForbiddenException('Sem permissão para listar participantes deste projeto');
    }
    const withParticipants = await this.projectsRepository.findOne({
      where: { id: String(projectId) },
      relations: ['participants'],
    });
    const participants = withParticipants?.participants ?? [];
    return participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      avatar: p.avatar,
      role: p.role,
    }));
  }
}

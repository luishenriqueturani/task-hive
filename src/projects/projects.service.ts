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
import { canManageProject } from './project-permissions.helper';

@Injectable()
export class ProjectsService {

  constructor(
    @Inject(PostgreSQLTokens.PROJECT_REPOSITORY)
    private projectsRepository: Repository<Project>,

    private companiesService: CompaniesService,
    private snowflakeIdService: SnowflakeIdService,
  ) { }


  async create(createProjectDto: CreateProjectDto, user: User) {
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
      throw new InternalServerErrorException('Erro ao criar o projeto');
    }
  }

  async findAll(user: User) {
    try {
      return this.projectsRepository
        .createQueryBuilder('project')
        .leftJoinAndSelect('project.userOwner', 'owner')
        .leftJoinAndSelect('project.participants', 'participants')
        .where('owner.id = :userId', { userId: user.id })
        .orWhere('participants.id = :userId', { userId: user.id })
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar todos os projetos');
    }
  }

  async findOne(id: bigint) {
    try {
      return this.projectsRepository.findOne({
        where: { id: String(id) },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar o projeto');
    }
  }

  async findOneWithOwnerAndParticipants(id: bigint) {
    try {
      return this.projectsRepository.findOne({
        where: { id: String(id) },
        relations: ['userOwner', 'participants'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar o projeto');
    }
  }

  async update(id: bigint, updateProjectDto: UpdateProjectDto, user: User) {
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
      return this.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao atualizar o projeto');
    }
  }

  async remove(id: bigint, user: User) {
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
      throw new InternalServerErrorException('Erro ao remover o projeto');
    }
  }
}

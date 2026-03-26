import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateProjectStageDto } from './dto/create-project-stage.dto';
import { UpdateProjectStageDto } from './dto/update-project-stage.dto';
import { Repository } from 'typeorm';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { ProjectsService } from 'src/projects/projects.service';
import { ProjectStage } from './entities/ProjectStage.entity';
import { User } from 'src/users/entities/User.entity';
import { canManageProject } from 'src/projects/project-permissions.helper';

@Injectable()
export class ProjectStagesService {

  constructor(
    @Inject(PostgreSQLTokens.PROJECT_STAGE_REPOSITORY)
    private projectStagesRepository: Repository<ProjectStage>,
    private snowflakeIdService: SnowflakeIdService,
    private projectsService: ProjectsService,
  ) { }

  async create(createProjectStageDto: CreateProjectStageDto, user: User) {
    try {
      const project = await this.projectsService.findOneWithOwnerAndParticipants(BigInt(createProjectStageDto.projectId));
      if (!project) {
        throw new BadRequestException('Project not found');
      }
      if (!canManageProject(project, user)) {
        throw new ForbiddenException('Sem permissão para criar coluna neste projeto');
      }

      let nextStage: ProjectStage | undefined;

      if(createProjectStageDto.nextStageId) {
        nextStage = await this.findOne(BigInt(createProjectStageDto.nextStageId))

      }

      let prevStage : ProjectStage | undefined

      if(createProjectStageDto.prevStageId) {
        prevStage = await this.findOne(BigInt(createProjectStageDto.prevStageId))

      }

      const newStage = await this.projectStagesRepository.save({
        id: String(this.snowflakeIdService.generateId()),
        name: createProjectStageDto.name,
        project: project,
        order: createProjectStageDto.order,
        nextStage: nextStage,
        prevStage: prevStage,
      })


      if(nextStage) {
        await this.projectStagesRepository.update(nextStage.id, {
          prevStage: newStage
        })
      }

      if(prevStage) {
        await this.projectStagesRepository.update(prevStage.id, {
          nextStage: newStage
        })
      }

      return newStage

    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao criar coluna do projeto');
    }
  }

  async findAll() {
    try {
      return this.projectStagesRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar colunas');
    }
  }

  async findAllByProject(id: string) {
    try {
      return this.projectStagesRepository.find({
        where: {
          project: { id },
        },
        order: { order: 'ASC' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar colunas do projeto');
    }
  }

  async findOne(id: bigint) {
    try {
      return this.projectStagesRepository.findOne({
        where: { id: String(id) },
        relations: ['project', 'tasks', 'nextStage', 'prevStage'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar coluna');
    }
  }

  async update(id: bigint, updateProjectStageDto: UpdateProjectStageDto, user: User) {
    try {
      const projectStage = await this.findOne(id);
      if (!projectStage) {
        throw new BadRequestException('Project stage not found');
      }
      const project = await this.projectsService.findOneWithOwnerAndParticipants(BigInt(projectStage.project.id));
      if (!project || !canManageProject(project, user)) {
        throw new ForbiddenException('Sem permissão para editar esta coluna');
      }

      let nextStage: ProjectStage | undefined;

      if(updateProjectStageDto.nextStageId) {
        nextStage = await this.findOne(BigInt(updateProjectStageDto.nextStageId))

        if(nextStage) {
          await this.projectStagesRepository.update(nextStage.id, {
            prevStage: projectStage
          })
        }
      }

      let prevStage : ProjectStage | undefined

      if(updateProjectStageDto.prevStageId) {
        prevStage = await this.findOne(BigInt(updateProjectStageDto.prevStageId))

        if(prevStage) {
          await this.projectStagesRepository.update(prevStage.id, {
            nextStage: projectStage
          })
        }
      }

      await this.projectStagesRepository.update(id.toString(), {
        name: updateProjectStageDto.name,
        order: updateProjectStageDto.order,
        nextStage: nextStage,
        prevStage: prevStage,
      });
      return this.findOne(id);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar coluna');
    }
  }

  async remove(id: bigint, user: User) {
    const projectStage = await this.findOne(id);
    if (!projectStage) {
      throw new BadRequestException('Project stage not found');
    }
    const project = await this.projectsService.findOneWithOwnerAndParticipants(BigInt(projectStage.project.id));
    if (!project || !canManageProject(project, user)) {
      throw new ForbiddenException('Sem permissão para remover esta coluna');
    }
    try {
      await this.projectStagesRepository.update(id.toString(), {
        deletedAt: new Date(),
      });
      return projectStage;
    } catch (error) {
      throw new InternalServerErrorException('Erro ao remover coluna');
    }
  }
}

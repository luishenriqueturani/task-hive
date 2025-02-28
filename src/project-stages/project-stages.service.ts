import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateProjectStageDto } from './dto/create-project-stage.dto';
import { UpdateProjectStageDto } from './dto/update-project-stage.dto';
import { ProjectStage } from 'src/repository/entities/ProjectStage.entity';
import { Repository } from 'typeorm';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { ProjectsService } from 'src/projects/projects.service';

@Injectable()
export class ProjectStagesService {

  constructor(
    @Inject(PostgreSQLTokens.PROJECT_STAGE_REPOSITORY)
    private projectStagesRepository: Repository<ProjectStage>,
    private snowflakeIdService: SnowflakeIdService,
    private projectsService: ProjectsService,
  ) { }

  async create(createProjectStageDto: CreateProjectStageDto) {
    try {
      const project = await this.projectsService.findOne(BigInt(createProjectStageDto.projectId))

      if(!project) {
        throw new BadRequestException('Project not found');
      }

      let nextStage : ProjectStage | undefined

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
      console.log(error);
      throw new Error(error);
    }
  }

  findAll() {
    try {
      return this.projectStagesRepository.find();
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  findAllByProject(id: string) {
    try {
      return this.projectStagesRepository.find({
        where: {
          project: {
            id: id,
          },
        },
        order: {
          order: 'ASC',
        }
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  findOne(id: bigint) {
    try {
      return this.projectStagesRepository.findOne({
        where: {
          id: String(id),
        },
        relations: ['project', 'tasks', 'nextStage', 'prevStage']
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async update(id: bigint, updateProjectStageDto: UpdateProjectStageDto) {
    try {
      const projectStage = await this.findOne(id);

      if (!projectStage) {
        throw new BadRequestException('Project stage not found');
      }

      let nextStage : ProjectStage | undefined

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

      return await this.projectStagesRepository.update(id.toString(), {
        name: updateProjectStageDto.name,
        order: updateProjectStageDto.order,
        nextStage: nextStage,
        prevStage: prevStage,
      });

    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async remove(id: bigint) {
    try {
      const projectStage = await this.findOne(id);

      if (!projectStage) {
        throw new BadRequestException('Project stage not found');
      }

      return await this.projectStagesRepository.update(id.toString(), {
        deletedAt: new Date(),
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}

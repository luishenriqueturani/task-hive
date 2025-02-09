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

      return await this.projectStagesRepository.save({
        id: this.snowflakeIdService.generateId(),
        name: createProjectStageDto.name,
        project: project,
        oreder: createProjectStageDto.oreder,
        nextStage: nextStage,
        prevStage: prevStage,
      })

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

  findOne(id: bigint) {
    try {
      return this.projectStagesRepository.findOne({
        where: {
          id,
        },
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

      return await this.projectStagesRepository.update(id.toString(), updateProjectStageDto);

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

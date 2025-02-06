import { Inject, Injectable } from '@nestjs/common';
import { CreateProjectStageDto } from './dto/create-project-stage.dto';
import { UpdateProjectStageDto } from './dto/update-project-stage.dto';
import { ProjectStage } from 'src/repository/entities/ProjectStage.entity';
import { Repository } from 'typeorm';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';

@Injectable()
export class ProjectStagesService {

  constructor(
    @Inject(PostgreSQLTokens.PROJECT_STAGE_REPOSITORY)
    private projectStagesRepository: Repository<ProjectStage>,
    private snowflakeIdService: SnowflakeIdService,
  ) { }

  create(createProjectStageDto: CreateProjectStageDto) {
    return 'This action adds a new projectStage';
  }

  findAll() {
    return `This action returns all projectStages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} projectStage`;
  }

  update(id: number, updateProjectStageDto: UpdateProjectStageDto) {
    return `This action updates a #${id} projectStage`;
  }

  remove(id: number) {
    return `This action removes a #${id} projectStage`;
  }
}

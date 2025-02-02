import { Inject, Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Repository } from 'typeorm';
import { Project } from 'src/repository/entities/Project.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { User } from 'src/repository/entities/User.entity';

@Injectable()
export class ProjectsService {

  constructor(
    @Inject(PostgreSQLTokens.PROJECT_REPOSITORY)
    private projectsRepository: Repository<Project>,

    private snowflakeIdService: SnowflakeIdService,
  ) { }


  async create(createProjectDto: CreateProjectDto, user: User) {
    try {
      let company

      if(createProjectDto.companyOwnerId) {
        company = await this.projectsRepository.findOne({
          where: {
            id: createProjectDto.companyOwnerId,
          },
        })
      }



    } catch (error) {
      console.log(error)
      throw new Error('Erro ao criar o projeto')
    }
  }

  findAll() {
    return `This action returns all projects`;
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  remove(id: number) {
    return `This action removes a #${id} project`;
  }
}

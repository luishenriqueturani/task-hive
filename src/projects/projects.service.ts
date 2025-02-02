import { Inject, Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Repository } from 'typeorm';
import { Project } from 'src/repository/entities/Project.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { User } from 'src/repository/entities/User.entity';
import { CompaniesService } from 'src/companies/companies.service';
import { Company } from 'src/repository/entities/Company.entity';

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
        name: createProjectDto.name,
        description: createProjectDto.description,
        userOwner: user,
        companyOwner: company,
      })

    } catch (error) {
      console.log(error)
      throw new Error('Erro ao criar o projeto')
    }
  }

  findAll() {
    return `This action returns all projects`;
  }

  findOne(id: string) {
    return `This action returns a #${id} project`;
  }

  update(id: string, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  remove(id: string) {
    return `This action removes a #${id} project`;
  }
}

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
        id: this.snowflakeIdService.generateId(),
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
    try {
      return this.projectsRepository.find()
    } catch (error) {
      console.log(error)
      throw new Error('Erro ao buscar todos os projetos')
    }
  }

  findOne(id: bigint) {
    try {
      return this.projectsRepository.findOne({
        where: {
          id: id,
        },
      })
    } catch (error) {
      console.log(error)
      throw new Error('Erro ao buscar o projeto')
    }
  }

  async update(id: bigint, updateProjectDto: UpdateProjectDto) {
    try {
      const project = await this.findOne(id)

      if(!project) {
        throw new BadRequestException('Projeto não encontrado')
      }

      return await this.projectsRepository.update(id.toString(), {
        name: updateProjectDto.name,
        description: updateProjectDto.description,
      })
    } catch (error) {
      console.log(error)
      throw new Error('Erro ao atualizar o projeto')
    }
  }

  async remove(id: bigint) {
    try {
      const project = await this.findOne(id)

      if(!project) {
        throw new BadRequestException('Projeto não encontrado')
      }

      return await this.projectsRepository.update(id.toString(), {
        deletedAt: new Date(),
      })
    } catch (error) {
      console.log(error)
      throw new Error('Erro ao remover o projeto')
    }
  }
}

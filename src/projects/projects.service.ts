import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Repository } from 'typeorm';
import { Project } from 'src/projects/entities/Project.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { User } from 'src/users/entities/User.entity';
import { CompaniesService } from 'src/companies/companies.service';
import { Company } from 'src/companies/entities/Company.entity';

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

  async findAll() {
    try {
      return this.projectsRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar todos os projetos');
    }
  }

  async findOne(id: bigint) {
    try {
      return this.projectsRepository.findOne({
        where: {
          id: String(id),
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar o projeto');
    }
  }

  async update(id: bigint, updateProjectDto: UpdateProjectDto) {
    const project = await this.findOne(id);
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
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

  async remove(id: bigint) {
    const project = await this.findOne(id);
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
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

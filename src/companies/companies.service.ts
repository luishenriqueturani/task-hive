import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/Company.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { AppMetricsService } from 'src/metrics/app-metrics.service';

@Injectable()
export class CompaniesService {

  constructor(
    @Inject(PostgreSQLTokens.COMPANY_REPOSITORY)
    private companyRepository: Repository<Company>,
    private readonly metrics: AppMetricsService,
  ) { }

  async create(createCompanyDto: CreateCompanyDto) {
    return this.metrics.track('companies', 'create', async () => {
      try {
        return this.companyRepository.save({
          name: createCompanyDto.name,
          legalName: createCompanyDto.name,
        });
      } catch (error) {
        throw new InternalServerErrorException('Erro ao criar a Empresa');
      }
    });
  }

  async findAll() {
    return this.metrics.track('companies', 'find_all', async () => {
      try {
        return this.companyRepository.find();
      } catch (error) {
        throw new InternalServerErrorException('Erro ao buscar todas as empresas');
      }
    });
  }

  async findOne(id: string) {
    return this.metrics.track('companies', 'find_one', async () => {
      try {
        return this.companyRepository.findOne({
          where: { id },
        });
      } catch (error) {
        throw new InternalServerErrorException('Erro ao buscar a empresa');
      }
    });
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    return this.metrics.track('companies', 'update', async () => {
      const company = await this.companyRepository.findOne({ where: { id } });
      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }
      try {
        await this.companyRepository.update(id, {
          name: updateCompanyDto.name,
        });
        return this.companyRepository.findOne({ where: { id } });
      } catch (error) {
        throw new InternalServerErrorException('Erro ao atualizar a empresa');
      }
    });
  }

  async remove(id: string) {
    return this.metrics.track('companies', 'remove', async () => {
      const company = await this.companyRepository.findOne({ where: { id } });
      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }
      try {
        await this.companyRepository.update(id, {
          deletedAt: new Date(),
        });
        return company;
      } catch (error) {
        throw new InternalServerErrorException('Erro ao remover a empresa');
      }
    });
  }
}

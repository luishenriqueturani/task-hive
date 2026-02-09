import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/Company.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';

@Injectable()
export class CompaniesService {

  constructor(
    @Inject(PostgreSQLTokens.COMPANY_REPOSITORY)
    private companyRepository: Repository<Company>,
  ) { }

  async create(createCompanyDto: CreateCompanyDto) {
    try {
      return this.companyRepository.save({
        name: createCompanyDto.name,
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar a Empresa');
    }
  }

  async findAll() {
    try {
      return this.companyRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar todas as empresas');
    }
  }

  async findOne(id: string) {
    try {
      return this.companyRepository.findOne({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar a empresa');
    }
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.findOne(id);
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }
    try {
      await this.companyRepository.update(id, {
        name: updateCompanyDto.name,
      });
      return this.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao atualizar a empresa');
    }
  }

  async remove(id: string) {
    const company = await this.findOne(id);
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
  }
}

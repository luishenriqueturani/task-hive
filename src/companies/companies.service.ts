import { Inject, Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Repository } from 'typeorm';
import { Company } from 'src/repository/entities/Company.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';

@Injectable()
export class CompaniesService {

  constructor(
    @Inject(PostgreSQLTokens.COMPANY_REPOSITORY)
    private companyRepository: Repository<Company>,
  ) { }

  create(createCompanyDto: CreateCompanyDto) {
    try {
      return this.companyRepository.save({
        name: createCompanyDto.name,
      })
      
    } catch (error) {
      console.log(error)
      throw new Error('Erro ao criar a Empresa')
    }
  }

  findAll() {
    try {
      return this.companyRepository.find()
    } catch (error) {
      console.log(error)
      throw new Error('Erro ao buscar todas as empresas')
    }
  }

  findOne(id: string) {
    try {
      return this.companyRepository.findOne({
        where: {
          id,
        },
      })
    } catch (error) {
      console.log(error)
      throw new Error('Erro ao buscar a empresa')
    }
  }

  update(id: string, updateCompanyDto: UpdateCompanyDto) {
    try {
      return this.companyRepository.update(id, {
        name: updateCompanyDto.name,
      })
    } catch (error) {
      console.log(error)
      throw new Error('Erro ao atualizar a empresa')
    }
  }

  async remove(id: string) {
    try {
      const company = await this.companyRepository.findOne({
        where: {
          id,
        },
      })

      if(!company) {
        throw new Error('Empresa não encontrada')
      }

      return this.companyRepository.update(id, {
        deletedAt: new Date(),
      })

    } catch (error) {
      console.log(error)
      throw new Error('Erro ao remover a empresa')
    }
  }
}

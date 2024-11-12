import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { Company } from "../entities/Company.entity";


export const companyProvider = [
  {
    provide: PostgreSQLTokens.COMPANY_REPOSITORY,
    useFactory: (datasource: DataSource) => datasource.getRepository(Company),
    inject: [PostgreSQLTokens.DATA_SOURCE]
  }
]
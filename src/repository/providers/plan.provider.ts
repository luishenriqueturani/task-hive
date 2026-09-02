import { DataSource } from 'typeorm';
import { PostgreSQLTokens } from '../postgresql.enums';
import { Plan } from '../../plans/entities/Plan.entity';
import { PlanBenefit } from '../../plans/entities/PlanBenefit.entity';

export const planProviders = [
  {
    provide: PostgreSQLTokens.PLAN_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Plan),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
  {
    provide: PostgreSQLTokens.PLAN_BENEFIT_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(PlanBenefit),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
];

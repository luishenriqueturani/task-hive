import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { Project } from "../entities/Project.entity";

export const projectProviders = [
  {
    provide: PostgreSQLTokens.PROJECT_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Project),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
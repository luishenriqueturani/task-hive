import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { ProjectStage } from "../entities/ProjectStage.entity";

export const projectStageProviders = [
  {
    provide: PostgreSQLTokens.PROJECT_STAGE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ProjectStage),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { Subtask } from "../entities/subtask.entity";

export const subtaskProviders = [
  {
    provide: PostgreSQLTokens.SUBTASK_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Subtask),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
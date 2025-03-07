import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { Task } from "../../tasks/entities/Task.entity";

export const taskProviders = [
  {
    provide: PostgreSQLTokens.TASK_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Task),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
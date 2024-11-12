import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { TaskTimeTrak } from "../entities/TaskTimeTrak.entity";

export const taskTimetrackProviders = [
  {
    provide: PostgreSQLTokens.TASK_TIMETRACK_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(TaskTimeTrak),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { ToDoCompleted } from "../entities/ToDoCompleted.entity";

export const todoCompletedProviders = [
  {
    provide: PostgreSQLTokens.TODO_COMPLETED_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ToDoCompleted),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
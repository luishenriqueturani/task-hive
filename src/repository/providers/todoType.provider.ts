import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { ToDoType } from "../entities/ToDoType.entity";

export const todoTypeProviders = [
  {
    provide: PostgreSQLTokens.TODO_TYPE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ToDoType),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
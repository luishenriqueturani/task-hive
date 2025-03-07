import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { ToDo } from "src/to-do/entities/ToDo.entity";

export const todoProviders = [
  {
    provide: PostgreSQLTokens.TODO_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ToDo),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
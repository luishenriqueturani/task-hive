import { DataSource } from "typeorm";
import { User } from "../entities/user.entity";
import { PostgreSQLTokens } from "../postgresql.enums";

export const userProviders = [
  {
    provide: PostgreSQLTokens.USER_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
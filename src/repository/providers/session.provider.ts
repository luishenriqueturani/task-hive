import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { Session } from "src/auth/entities/Session.entity";


export const sessionProviders = [
  {
    provide: PostgreSQLTokens.SESSION_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Session),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
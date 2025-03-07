import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { UserFriendship } from "src/users/entities/UserFriendship.entity";

export const userFriendshipProviders = [
  {
    provide: PostgreSQLTokens.USER_FRIENDSHIP_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(UserFriendship),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];
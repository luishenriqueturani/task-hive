import { DataSource } from 'typeorm';
import { PersonalAccessToken } from 'src/auth/entities/PersonalAccessToken.entity';
import { PostgreSQLTokens } from '../postgresql.enums';

export const personalAccessTokenProviders = [
  {
    provide: PostgreSQLTokens.PERSONAL_ACCESS_TOKEN_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(PersonalAccessToken),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
];

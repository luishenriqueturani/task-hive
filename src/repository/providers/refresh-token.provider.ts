import { DataSource } from 'typeorm';
import { RefreshToken } from 'src/auth/entities/RefreshToken.entity';
import { PostgreSQLTokens } from '../postgresql.enums';

export const refreshTokenProviders = [
  {
    provide: PostgreSQLTokens.REFRESH_TOKEN_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(RefreshToken),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
];

import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { userProviders } from './providers/user.provider';
import { sessionProviders } from './providers/session.provider';
import { forgetPasswordProviders } from './providers/forgetPassword.provider';
import { refreshTokenProviders } from './providers/refresh-token.provider';
import { personalAccessTokenProviders } from './providers/personal-access-token.provider';

@Module({
  providers: [
    ...databaseProviders,
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
    ...refreshTokenProviders,
    ...personalAccessTokenProviders,
  ],
  exports: [
    ...databaseProviders,
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
    ...refreshTokenProviders,
    ...personalAccessTokenProviders,
  ],
})
export class DatabaseModule {}

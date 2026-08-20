import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { userProviders } from './providers/user.provider';
import { sessionProviders } from './providers/session.provider';
import { forgetPasswordProviders } from './providers/forgetPassword.provider';
import { refreshTokenProviders } from './providers/refresh-token.provider';

@Module({
  providers: [
    ...databaseProviders,
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
    ...refreshTokenProviders,
  ],
  exports: [
    ...databaseProviders,
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
    ...refreshTokenProviders,
  ],
})
export class DatabaseModule {}

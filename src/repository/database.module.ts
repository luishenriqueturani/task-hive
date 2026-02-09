import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { userProviders } from './providers/user.provider';
import { sessionProviders } from './providers/session.provider';
import { forgetPasswordProviders } from './providers/forgetPassword.provider';

@Module({
  providers: [
    ...databaseProviders,
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
  ],
  exports: [
    ...databaseProviders,
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
  ],
})
export class DatabaseModule {}

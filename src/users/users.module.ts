import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/repository/database.module';
import { userProviders } from 'src/repository/providers/user.provider';

@Module({
  controllers: [UsersController],
  imports: [DatabaseModule],
  providers: [
    ...userProviders,
    UsersService
  ],
})
export class UsersModule {}

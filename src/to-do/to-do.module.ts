import { Module } from '@nestjs/common';
import { ToDoService } from './to-do.service';
import { ToDoController } from './to-do.controller';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from 'src/repository/database.module';
import { todoProviders } from 'src/repository/providers/todo.provider';
import { userProviders } from 'src/repository/providers/user.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';
import { forgetPasswordProviders } from 'src/repository/providers/forgetPassword.provider';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';

@Module({
  controllers: [
    ToDoController
  ],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...todoProviders,
    ...forgetPasswordProviders,
    AuthService,
    UsersService,
    SnowflakeIdService,
    ToDoService
  ],
  imports: [
    JwtModule,
    DatabaseModule,
  ],
})
export class ToDoModule { }

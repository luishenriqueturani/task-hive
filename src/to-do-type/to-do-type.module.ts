import { Module } from '@nestjs/common';
import { ToDoTypeService } from './to-do-type.service';
import { ToDoTypeController } from './to-do-type.controller';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from 'src/repository/database.module';
import { todoTypeProviders } from 'src/repository/providers/todoType.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { userProviders } from 'src/repository/providers/user.provider';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';
import { forgetPasswordProviders } from 'src/repository/providers/forgetPassword.provider';

@Module({
  controllers: [
    ToDoTypeController
  ],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...todoTypeProviders,
    ...forgetPasswordProviders,
    AuthService,
    UsersService,
    ToDoTypeService
  ],
  imports: [
    JwtModule,
    DatabaseModule,
  ],
})
export class ToDoTypeModule { }

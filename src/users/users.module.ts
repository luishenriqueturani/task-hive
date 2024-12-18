import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/repository/database.module';
import { userProviders } from 'src/repository/providers/user.provider';
import { AuthService } from 'src/auth/auth.service';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { forgetPasswordProviders } from 'src/repository/providers/forgetPassword.provider';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [UsersController],
  imports: [
    DatabaseModule
  ],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
    JwtService,
    UsersService,
    AuthService
  ],
})
export class UsersModule { }

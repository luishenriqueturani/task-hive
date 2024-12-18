import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { DatabaseModule } from 'src/repository/database.module';
import { userProviders } from 'src/repository/providers/user.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { forgetPasswordProviders } from 'src/repository/providers/forgetPassword.provider';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [AuthController],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
    JwtService,
    UsersService,
    AuthService,
  ],
  imports: [
    DatabaseModule
  ],
})
export class AuthModule { }

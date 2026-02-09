import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { userProviders } from 'src/repository/providers/user.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { forgetPasswordProviders } from 'src/repository/providers/forgetPassword.provider';
import { companyProvider } from 'src/repository/providers/company.provider';
import { DatabaseModule } from 'src/repository/database.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Module({
  controllers: [CompaniesController],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
    ...companyProvider,
    AuthService,
    UsersService,
    AuthGuard,
    CompaniesService,
  ],
  imports: [
    JwtModule,
    DatabaseModule,
  ],
})
export class CompaniesModule { }

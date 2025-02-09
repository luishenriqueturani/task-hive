import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { userProviders } from 'src/repository/providers/user.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { DatabaseModule } from 'src/repository/database.module';
import { projectProviders } from 'src/repository/providers/project.provider';
import { CompaniesService } from 'src/companies/companies.service';
import { companyProvider } from 'src/repository/providers/company.provider';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { forgetPasswordProviders } from 'src/repository/providers/forgetPassword.provider';

@Module({
  controllers: [ProjectsController],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...companyProvider,
    ...projectProviders,
    ...forgetPasswordProviders,
    AuthService,
    UsersService,
    SnowflakeIdService,
    CompaniesService,
    ProjectsService,
  ],
  imports: [
    JwtModule,
    DatabaseModule,
  ],
})
export class ProjectsModule { }

import { Module } from '@nestjs/common';
import { ProjectStagesService } from './project-stages.service';
import { ProjectStagesController } from './project-stages.controller';
import { userProviders } from 'src/repository/providers/user.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { companyProvider } from 'src/repository/providers/company.provider';
import { projectProviders } from 'src/repository/providers/project.provider';
import { forgetPasswordProviders } from 'src/repository/providers/forgetPassword.provider';
import { projectStageProviders } from 'src/repository/providers/projectStage.provider';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { DatabaseModule } from 'src/repository/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ProjectsService } from 'src/projects/projects.service';

@Module({
  controllers: [ProjectStagesController],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...companyProvider,
    ...projectProviders,
    ...forgetPasswordProviders,
    ...projectStageProviders,
    AuthService,
    UsersService,
    SnowflakeIdService,
    ProjectsService,
    ProjectStagesService
  ],
  imports: [
    JwtModule,
    DatabaseModule,

  ]
})
export class ProjectStagesModule { }

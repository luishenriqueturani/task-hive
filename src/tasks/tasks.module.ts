import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { userProviders } from 'src/repository/providers/user.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { forgetPasswordProviders } from 'src/repository/providers/forgetPassword.provider';
import { projectStageProviders } from 'src/repository/providers/projectStage.provider';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { DatabaseModule } from 'src/repository/database.module';
import { JwtModule } from '@nestjs/jwt';
import { taskProviders } from 'src/repository/providers/task.provider';
import { ProjectStagesService } from 'src/project-stages/project-stages.service';
import { ProjectsService } from 'src/projects/projects.service';
import { projectProviders } from 'src/repository/providers/project.provider';
import { CompaniesService } from 'src/companies/companies.service';
import { companyProvider } from 'src/repository/providers/company.provider';

@Module({
  controllers: [TasksController],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
    ...companyProvider,
    ...projectProviders,
    ...projectStageProviders,
    ...taskProviders,
    AuthService,
    UsersService,
    SnowflakeIdService,
    CompaniesService,
    ProjectsService,
    ProjectStagesService,
    TasksService
  ],
  imports: [
    JwtModule,
    DatabaseModule,
  ]
})
export class TasksModule { }

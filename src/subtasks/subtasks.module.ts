import { Module } from '@nestjs/common';
import { SubtasksService } from './subtasks.service';
import { SubtasksController } from './subtasks.controller';
import { forgetPasswordProviders } from 'src/repository/providers/forgetPassword.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { userProviders } from 'src/repository/providers/user.provider';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from 'src/repository/database.module';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';
import { subtaskProviders } from 'src/repository/providers/subtask.provider';
import { TasksService } from 'src/tasks/tasks.service';
import { taskProviders } from 'src/repository/providers/task.provider';
import { ProjectStagesService } from 'src/project-stages/project-stages.service';
import { projectStageProviders } from 'src/repository/providers/projectStage.provider';
import { projectProviders } from 'src/repository/providers/project.provider';
import { ProjectsService } from 'src/projects/projects.service';
import { companyProvider } from 'src/repository/providers/company.provider';
import { CompaniesService } from 'src/companies/companies.service';

@Module({
  controllers: [
    SubtasksController
  ],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
    ...projectProviders,
    ...companyProvider,
    ...taskProviders,
    ...projectStageProviders,
    ...subtaskProviders,
    AuthService,
    UsersService,
    SnowflakeIdService,
    CompaniesService,
    ProjectsService,
    ProjectStagesService,
    TasksService,
    SubtasksService,
  ],
  imports: [
    JwtModule,
    DatabaseModule,
  ]
})
export class SubtasksModule { }

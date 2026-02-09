import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { projectStageProviders } from 'src/repository/providers/projectStage.provider';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { DatabaseModule } from 'src/repository/database.module';
import { taskProviders } from 'src/repository/providers/task.provider';
import { ProjectStagesService } from 'src/project-stages/project-stages.service';
import { ProjectsService } from 'src/projects/projects.service';
import { projectProviders } from 'src/repository/providers/project.provider';
import { CompaniesService } from 'src/companies/companies.service';
import { companyProvider } from 'src/repository/providers/company.provider';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [TasksController],
  providers: [
    ...companyProvider,
    ...projectProviders,
    ...projectStageProviders,
    ...taskProviders,
    SnowflakeIdService,
    CompaniesService,
    ProjectsService,
    ProjectStagesService,
    TasksService,
  ],
  imports: [AuthModule, DatabaseModule],
})
export class TasksModule {}

import { Module } from '@nestjs/common';
import { SubtasksService } from './subtasks.service';
import { SubtasksController } from './subtasks.controller';
import { DatabaseModule } from 'src/repository/database.module';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { subtaskProviders } from 'src/repository/providers/subtask.provider';
import { TasksService } from 'src/tasks/tasks.service';
import { taskProviders } from 'src/repository/providers/task.provider';
import { taskCompletionProviders } from 'src/repository/providers/taskCompletion.provider';
import { ProjectStagesService } from 'src/project-stages/project-stages.service';
import { projectStageProviders } from 'src/repository/providers/projectStage.provider';
import { companyProvider } from 'src/repository/providers/company.provider';
import { CompaniesService } from 'src/companies/companies.service';
import { AuthModule } from 'src/auth/auth.module';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
  controllers: [SubtasksController],
  providers: [
    ...companyProvider,
    ...taskProviders,
    ...taskCompletionProviders,
    ...projectStageProviders,
    ...subtaskProviders,
    SnowflakeIdService,
    CompaniesService,
    ProjectStagesService,
    TasksService,
    SubtasksService,
  ],
  imports: [AuthModule, DatabaseModule, ProjectsModule],
})
export class SubtasksModule {}

import { Module } from '@nestjs/common';
import { ProjectStagesService } from './project-stages.service';
import { ProjectStagesController } from './project-stages.controller';
import { companyProvider } from 'src/repository/providers/company.provider';
import { projectStageProviders } from 'src/repository/providers/projectStage.provider';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { DatabaseModule } from 'src/repository/database.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { CompaniesService } from 'src/companies/companies.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ProjectStagesController],
  providers: [
    ...companyProvider,
    ...projectStageProviders,
    SnowflakeIdService,
    CompaniesService,
    ProjectStagesService,
  ],
  imports: [AuthModule, DatabaseModule, ProjectsModule],
})
export class ProjectStagesModule {}

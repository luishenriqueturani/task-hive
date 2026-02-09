import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { DatabaseModule } from 'src/repository/database.module';
import { projectProviders } from 'src/repository/providers/project.provider';
import { CompaniesService } from 'src/companies/companies.service';
import { companyProvider } from 'src/repository/providers/company.provider';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ProjectsController],
  providers: [
    ...companyProvider,
    ...projectProviders,
    SnowflakeIdService,
    CompaniesService,
    ProjectsService,
  ],
  imports: [AuthModule, DatabaseModule],
  exports: [ProjectsService],
})
export class ProjectsModule {}

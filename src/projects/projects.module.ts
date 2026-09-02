import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { InvitesController } from './invites.controller';
import { ProjectInvitesService } from './project-invites.service';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { DatabaseModule } from 'src/repository/database.module';
import { projectProviders } from 'src/repository/providers/project.provider';
import { projectInviteProviders } from 'src/repository/providers/project-invite.provider';
import { CompaniesService } from 'src/companies/companies.service';
import { companyProvider } from 'src/repository/providers/company.provider';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ProjectsController, InvitesController],
  providers: [
    ...companyProvider,
    ...projectProviders,
    ...projectInviteProviders,
    SnowflakeIdService,
    CompaniesService,
    ProjectInvitesService,
    ProjectsService,
  ],
  imports: [AuthModule, DatabaseModule],
  exports: [ProjectsService, ProjectInvitesService],
})
export class ProjectsModule {}

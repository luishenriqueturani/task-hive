import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { userProviders } from 'src/repository/providers/user.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { DatabaseModule } from 'src/repository/database.module';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [ProjectsController],
  providers: [
    ...userProviders,
    ...sessionProviders,
    SnowflakeIdService,
    ProjectsService
  ],
  imports: [
    DatabaseModule,
  ],
})
export class ProjectsModule { }

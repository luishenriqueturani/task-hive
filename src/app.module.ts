import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import configuration from './config/configuration';
import { SnowflakeIdService } from './snowflakeid/snowflakeid.service';
import { AuthModule } from './auth/auth.module';
import { ToDoModule } from './to-do/to-do.module';
import { ProjectsModule } from './projects/projects.module';
import { CompaniesModule } from './companies/companies.module';
import { ProjectStagesModule } from './project-stages/project-stages.module';
import { TasksModule } from './tasks/tasks.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    UsersModule,
    AuthModule,
    ToDoModule,
    ProjectsModule,
    CompaniesModule,
    ProjectStagesModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    SnowflakeIdService,
    AppService
  ],
})
export class AppModule { }

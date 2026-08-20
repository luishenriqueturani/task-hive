import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { SubtasksModule } from './subtasks/subtasks.module';
import { MetricsModule } from './metrics/metrics.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 120 },
    ]),
    MetricsModule,
    UsersModule,
    AuthModule,
    ToDoModule,
    ProjectsModule,
    CompaniesModule,
    ProjectStagesModule,
    TasksModule,
    SubtasksModule,
  ],
  controllers: [AppController],
  providers: [
    SnowflakeIdService,
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }

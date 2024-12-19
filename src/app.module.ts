import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import configuration from './config/configuration';
import { SnowflakeIdService } from './snowflakeid/snowflakeid.service';
import { AuthModule } from './auth/auth.module';
import { ToDoModule } from './to-do/to-do.module';
import { ToDoTypeModule } from './to-do-type/to-do-type.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    UsersModule,
    AuthModule,
    ToDoModule,
    ToDoTypeModule,
  ],
  controllers: [AppController],
  providers: [
    SnowflakeIdService,
    AppService
  ],
})
export class AppModule { }

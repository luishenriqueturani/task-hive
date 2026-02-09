import { Module } from '@nestjs/common';
import { ToDoService } from './to-do.service';
import { ToDoController } from './to-do.controller';
import { DatabaseModule } from 'src/repository/database.module';
import { todoProviders } from 'src/repository/providers/todo.provider';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ToDoController],
  providers: [...todoProviders, SnowflakeIdService, ToDoService],
  imports: [AuthModule, DatabaseModule],
})
export class ToDoModule {}

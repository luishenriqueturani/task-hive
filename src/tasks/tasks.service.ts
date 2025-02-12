import { Inject, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { Repository } from 'typeorm';
import { Task } from 'src/repository/entities/Task.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { ProjectStagesService } from 'src/project-stages/project-stages.service';

@Injectable()
export class TasksService {

  constructor(
    @Inject(PostgreSQLTokens.TASK_REPOSITORY)
    private readonly tasksRepository: Repository<Task>,
    private snowflakeIdService: SnowflakeIdService,
    private poujectStagesService: ProjectStagesService,
  ) { }

  create(createTaskDto: CreateTaskDto) {
    return 'This action adds a new task';
  }

  findAll() {
    return `This action returns all tasks`;
  }

  findOne(id: bigint) {
    return `This action returns a #${id} task`;
  }

  update(id: bigint, updateTaskDto: UpdateTaskDto) {
    return `This action updates a #${id} task`;
  }

  remove(id: bigint) {
    return `This action removes a #${id} task`;
  }
}

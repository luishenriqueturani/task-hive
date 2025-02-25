import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { Repository } from 'typeorm';
import { Task } from 'src/repository/entities/Task.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { ProjectStagesService } from 'src/project-stages/project-stages.service';
import { User } from 'src/repository/entities/User.entity';

@Injectable()
export class TasksService {

  constructor(
    @Inject(PostgreSQLTokens.TASK_REPOSITORY)
    private readonly tasksRepository: Repository<Task>,
    private snowflakeIdService: SnowflakeIdService,
    private poujectStagesService: ProjectStagesService,
  ) { }

  async create(createTaskDto: CreateTaskDto, user: User) {
    try {
      
      const stage = await this.poujectStagesService.findOne(BigInt(createTaskDto.stageId))

      if (!stage) {
        throw new BadRequestException(`Stage not found`)
      }

      return this.tasksRepository.save({
        id: this.snowflakeIdService.generateId(),
        name: createTaskDto.name,
        user,
        stage
      })

    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  findAll(user: User) {
    try {
      return this.tasksRepository.find({
        where: {
          user: {
            id: user.id
          }
        }
      })
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  findOne(id: bigint) {
    try {
      return this.tasksRepository.findOne({
        where: {
          id: id
        }
      })
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async update(id: bigint, updateTaskDto: UpdateTaskDto, user: User) {
    try {
      const task = await this.tasksRepository.findOne({
        where: {
          id: id
        }
      })

      if (!task) {
        throw new BadRequestException(`Task not found`)
      }

      if (task.user.id !== user.id) {
        throw new UnauthorizedException(`You are not the owner of this task`)
      }

      return this.tasksRepository.update({
        id: id
      }, updateTaskDto)

    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async remove(id: bigint, user: User) {
    try {
      const task = await this.tasksRepository.findOne({
        where: {
          id: id
        }
      })

      if (!task) {
        throw new BadRequestException(`Task not found`)
      }

      if (task.user.id !== user.id) {
        throw new UnauthorizedException(`You are not the owner of this task`)
      }

      return this.tasksRepository.update({
        id: id
      }, {
        deletedAt: new Date()
      })

    } catch (error) {
      console.log(error)
      throw error
    }
  }
}

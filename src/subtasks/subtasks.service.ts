import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Repository } from 'typeorm';
import { Subtask } from 'src/subtasks/entities/subtask.entity';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { User } from 'src/users/entities/User.entity';
import { TasksService } from 'src/tasks/tasks.service';

@Injectable()
export class SubtasksService {

  constructor(
    @Inject(PostgreSQLTokens.SUBTASK_REPOSITORY)
    private readonly subtasksRepository: Repository<Subtask>,
    private snowflakeIdService: SnowflakeIdService,
    private readonly tasksService: TasksService,
  ) { }

  async create(createSubtaskDto: CreateSubtaskDto, user: User) {
    try {
      
      const task = await this.tasksService.findOne(BigInt(createSubtaskDto.taskId))

      if (!task) {
        throw new BadRequestException(`Task not found`)
      }

      return this.subtasksRepository.save({
        id: String(this.snowflakeIdService.generateId()),
        name: createSubtaskDto.name,
        task,
        responsible: user
      })

    } catch (error) {
      throw error;
    }
  }

  findAll() {
    try {
      return this.subtasksRepository.find()
    } catch (error) {
      throw error;
    }
  }

  findOne(id: string) {
    try {
      return this.subtasksRepository.findOne({
        where: {
          id: id
        }
      })
    } catch (error) {
      throw error;
    }
  }

  async findByTaskId(taskId: string) {
    try {

      const task = await this.tasksService.findOne(BigInt(taskId))

      if (!task) {
        throw new BadRequestException(`Task not found`)
      }

      return await this.subtasksRepository.find({
        where: {
          task: {
            id: taskId
          }
        }
      })
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateSubtaskDto: UpdateSubtaskDto, user: User) {
    try {
      
      const subtask = await this.subtasksRepository.findOne({
        where: {
          id: id
        }
      })

      if (!subtask) {
        throw new BadRequestException(`Subtask not found`)
      }

      if (subtask.responsible.id !== user.id) {
        throw new BadRequestException(`You are not the responsible of this subtask`)
      }

      return this.subtasksRepository.update({
        id: id
      }, {
        description: updateSubtaskDto.description,
        name: updateSubtaskDto.name,
        responsible: user
      })

    } catch (error) {
      throw error;
    }
  }

  async remove(id: string, user: User) {
    try {
      
      const subtask = await this.subtasksRepository.findOne({
        where: {
          id: id
        }
      })

      if (!subtask) {
        throw new BadRequestException(`Subtask not found`)
      }

      if (subtask.responsible.id !== user.id) {
        throw new BadRequestException(`You are not the responsible of this subtask`)
      }

      return this.subtasksRepository.update({
        id: id
      }, {
        deletedAt: new Date()
      })

    } catch (error) {
      throw error;
    }
  }
}

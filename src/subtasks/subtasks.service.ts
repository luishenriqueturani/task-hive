import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Repository } from 'typeorm';
import { Subtask } from 'src/subtasks/entities/subtask.entity';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { User } from 'src/users/entities/User.entity';
import { TasksService } from 'src/tasks/tasks.service';
import { AppMetricsService } from 'src/metrics/app-metrics.service';

@Injectable()
export class SubtasksService {

  constructor(
    @Inject(PostgreSQLTokens.SUBTASK_REPOSITORY)
    private readonly subtasksRepository: Repository<Subtask>,
    private snowflakeIdService: SnowflakeIdService,
    private readonly tasksService: TasksService,
    private readonly metrics: AppMetricsService,
  ) { }

  async create(createSubtaskDto: CreateSubtaskDto, user: User) {
    return this.metrics.track('subtasks', 'create', async () => {
      await this.tasksService.assertCanAccessTask(BigInt(createSubtaskDto.taskId), user);
      const task = await this.tasksService.findOne(BigInt(createSubtaskDto.taskId));

      if (!task) {
        throw new NotFoundException('Task not found')
      }

      return this.subtasksRepository.save({
        id: String(this.snowflakeIdService.generateId()),
        name: createSubtaskDto.name,
        task,
        responsible: user
      })
    });
  }

  findAll() {
    return this.metrics.track('subtasks', 'find_all', () => {
      try {
        return this.subtasksRepository.find()
      } catch (error) {
        throw error;
      }
    });
  }

  async findOne(id: string, user: User) {
    return this.metrics.track('subtasks', 'find_one', async () => {
      try {
        const subtask = await this.subtasksRepository.findOne({
          where: { id },
          relations: ['task'],
        });
        if (!subtask?.task?.id) {
          throw new NotFoundException('Subtask not found');
        }
        await this.tasksService.assertCanAccessTask(BigInt(subtask.task.id), user);
        return this.subtasksRepository.findOne({
          where: { id },
        });
      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        throw error;
      }
    });
  }

  async findByTaskId(taskId: string, user: User) {
    return this.metrics.track('subtasks', 'find_by_task', async () => {
      await this.tasksService.assertCanAccessTask(BigInt(taskId), user);

      return await this.subtasksRepository.find({
        where: {
          task: {
            id: taskId
          }
        },
        relations: ['responsible'],
      })
    });
  }

  async update(id: string, updateSubtaskDto: UpdateSubtaskDto, user: User) {
    return this.metrics.track('subtasks', 'update', async () => {
      const subtask = await this.subtasksRepository.findOne({
        where: { id },
        relations: ['responsible'],
      })

      if (!subtask) {
        throw new BadRequestException(`Subtask not found`)
      }

      if (subtask.responsible?.id !== user.id) {
        throw new BadRequestException(`You are not the responsible of this subtask`)
      }

      return this.subtasksRepository.update(
        { id },
        {
          ...(updateSubtaskDto.description !== undefined && {
            description: updateSubtaskDto.description,
          }),
          ...(updateSubtaskDto.name !== undefined && {
            name: updateSubtaskDto.name,
          }),
          ...(updateSubtaskDto.isCompleted !== undefined && {
            isCompleted: updateSubtaskDto.isCompleted,
          }),
          responsible: user,
        },
      );
    });
  }

  async remove(id: string, user: User) {
    return this.metrics.track('subtasks', 'remove', async () => {
      const subtask = await this.subtasksRepository.findOne({
        where: { id },
        relations: ['responsible'],
      })

      if (!subtask) {
        throw new BadRequestException(`Subtask not found`)
      }

      if (subtask.responsible?.id !== user.id) {
        throw new BadRequestException(`You are not the responsible of this subtask`)
      }

      return this.subtasksRepository.update({
        id: id
      }, {
        deletedAt: new Date()
      })
    });
  }
}

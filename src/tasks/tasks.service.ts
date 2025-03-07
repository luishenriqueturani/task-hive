import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { Repository } from 'typeorm';
import { Task } from 'src/tasks/entities/Task.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { ProjectStagesService } from 'src/project-stages/project-stages.service';
import { User } from 'src/users/entities/User.entity';
import { ProjectStage } from 'src/project-stages/entities/ProjectStage.entity';

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
        id: String(this.snowflakeIdService.generateId()),
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

  findByStage(stage: string) {
    try {
      return this.tasksRepository.find({
        where: {
          stage: {
            id: stage
          },
        },
        relations: ['stage']
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
          id: String(id)
        },
        relations: ['stage']
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
          id: String(id)
        },
        relations: ['user']
      })

      if (!task) {
        throw new BadRequestException(`Task not found`)
      }

      if (task.user.id !== user.id) {
        throw new UnauthorizedException(`You are not the owner of this task`)
      }

      let stage : ProjectStage | undefined

      if(updateTaskDto.stageId) {
        stage = await this.poujectStagesService.findOne(BigInt(updateTaskDto.stageId))
        //console.log(stage)
        if(!stage) {
          throw new BadRequestException(`Stage not found`)
        }
      }

      return this.tasksRepository.update({
        id: String(id)
      }, {
        description: updateTaskDto.description,
        finishDate: updateTaskDto.finishDate,
        name: updateTaskDto.name,
        stage: stage
      })

    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async toPreviousStage(id: bigint, user: User) {
    try {
      const task = await this.tasksRepository.findOne({
        where: {
          id: String(id)
        },
        relations: ['user', 'stage']
      })

      if (!task) {
        throw new BadRequestException(`Task not found`)
      }

      if (task.user.id !== user.id) {
        throw new UnauthorizedException(`You are not the owner of this task`)
      }

      const stage = await this.poujectStagesService.findOne(BigInt(task.stage.id))

      if(!stage.prevStage) {
        throw new BadRequestException(`Stage not found`)
      } 

      return this.tasksRepository.update(id.toString(), {
        stage: stage.prevStage
      })
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async toNextStage(id: bigint, user: User) {
    try {
      const task = await this.tasksRepository.findOne({
        where: {
          id: String(id)
        },
        relations: ['user', 'stage']
      })

      if (!task) {
        throw new BadRequestException(`Task not found`)
      }

      if (task.user.id !== user.id) {
        throw new UnauthorizedException(`You are not the owner of this task`)
      }

      const stage = await this.poujectStagesService.findOne(BigInt(task.stage.id))

      if(!stage.nextStage) {
        throw new BadRequestException(`Stage not found`)
      } 

      return this.tasksRepository.update(id.toString(), {
        stage: stage.nextStage
      })
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async remove(id: bigint, user: User) {
    try {
      const task = await this.tasksRepository.findOne({
        where: {
          id: String(id)
        },
        relations: ['user']
      })

      if (!task) {
        throw new BadRequestException(`Task not found`)
      }

      if (task.user.id !== user.id) {
        throw new UnauthorizedException(`You are not the owner of this task`)
      }

      return this.tasksRepository.update({
        id: String(id)
      }, {
        deletedAt: new Date()
      })

    } catch (error) {
      console.log(error)
      throw error
    }
  }
}

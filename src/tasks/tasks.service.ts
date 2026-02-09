import { BadRequestException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { Repository } from 'typeorm';
import { Task } from 'src/tasks/entities/Task.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { ProjectStagesService } from 'src/project-stages/project-stages.service';
import { ProjectsService } from 'src/projects/projects.service';
import { User } from 'src/users/entities/User.entity';
import { ProjectStage } from 'src/project-stages/entities/ProjectStage.entity';
import { canAccessProject, canMoveOrRemoveTask } from 'src/projects/project-permissions.helper';

@Injectable()
export class TasksService {

  constructor(
    @Inject(PostgreSQLTokens.TASK_REPOSITORY)
    private readonly tasksRepository: Repository<Task>,
    private snowflakeIdService: SnowflakeIdService,
    private projectStagesService: ProjectStagesService,
    private projectsService: ProjectsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User) {
    const stage = await this.projectStagesService.findOne(BigInt(createTaskDto.stageId));
    if (!stage) {
      throw new BadRequestException('Stage not found');
    }
    const project = await this.projectsService.findOneWithOwnerAndParticipants(BigInt(stage.project.id));
    if (!project || !canAccessProject(project, user)) {
      throw new ForbiddenException('Sem permissão para criar tarefa neste projeto');
    }
    return this.tasksRepository.save({
      id: String(this.snowflakeIdService.generateId()),
      name: createTaskDto.name,
      user,
      stage,
    });
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
    const task = await this.tasksRepository.findOne({
      where: { id: String(id) },
      relations: ['user', 'stage', 'stage.project'],
    });
    if (!task) {
      throw new BadRequestException('Task not found');
    }
    const project = await this.projectsService.findOneWithOwnerAndParticipants(BigInt(task.stage.project.id));
    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const canMoveOrRemove = canMoveOrRemoveTask(task, user);
    if (canMoveOrRemove) {
      let stage: ProjectStage | undefined;
      if (updateTaskDto.stageId) {
        stage = await this.projectStagesService.findOne(BigInt(updateTaskDto.stageId));
        if (!stage) throw new BadRequestException('Stage not found');
      }
      await this.tasksRepository.update(
        { id: String(id) },
        {
          description: updateTaskDto.description,
          finishDate: updateTaskDto.finishDate,
          name: updateTaskDto.name,
          ...(stage && { stage }),
        },
      );
    } else if (canAccessProject(project, user)) {
      await this.tasksRepository.update(
        { id: String(id) },
        {
          description: updateTaskDto.description,
          finishDate: updateTaskDto.finishDate,
          name: updateTaskDto.name,
        },
      );
    } else {
      throw new ForbiddenException('Sem permissão para editar esta tarefa');
    }
    return this.findOne(id);
  }

  async toPreviousStage(id: bigint, user: User) {
    const task = await this.tasksRepository.findOne({
      where: { id: String(id) },
      relations: ['user', 'stage'],
    });
    if (!task) throw new BadRequestException('Task not found');
    if (!canMoveOrRemoveTask(task, user)) {
      throw new ForbiddenException('Sem permissão para mover esta tarefa');
    }
    const stage = await this.projectStagesService.findOne(BigInt(task.stage.id));
    if (!stage?.prevStage) throw new BadRequestException('Stage not found');
    await this.tasksRepository.update(id.toString(), { stage: stage.prevStage });
    return this.findOne(id);
  }

  async toNextStage(id: bigint, user: User) {
    const task = await this.tasksRepository.findOne({
      where: { id: String(id) },
      relations: ['user', 'stage'],
    });
    if (!task) throw new BadRequestException('Task not found');
    if (!canMoveOrRemoveTask(task, user)) {
      throw new ForbiddenException('Sem permissão para mover esta tarefa');
    }
    const stage = await this.projectStagesService.findOne(BigInt(task.stage.id));
    if (!stage?.nextStage) throw new BadRequestException('Stage not found');
    await this.tasksRepository.update(id.toString(), { stage: stage.nextStage });
    return this.findOne(id);
  }

  async remove(id: bigint, user: User) {
    const task = await this.tasksRepository.findOne({
      where: { id: String(id) },
      relations: ['user'],
    });
    if (!task) throw new BadRequestException('Task not found');
    if (!canMoveOrRemoveTask(task, user)) {
      throw new ForbiddenException('Sem permissão para remover esta tarefa');
    }
    await this.tasksRepository.update({ id: String(id) }, { deletedAt: new Date() });
    return task;
  }
}

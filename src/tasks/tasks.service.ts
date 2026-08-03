import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { Repository } from 'typeorm';
import { Task } from 'src/tasks/entities/Task.entity';
import { TaskCompletion } from 'src/tasks/entities/TaskCompletion.entity';
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
    @Inject(PostgreSQLTokens.TASK_COMPLETION_REPOSITORY)
    private readonly completionsRepository: Repository<TaskCompletion>,
    private snowflakeIdService: SnowflakeIdService,
    private projectStagesService: ProjectStagesService,
    private projectsService: ProjectsService,
  ) {}

  private async nextOrderInStage(stageId: string): Promise<number> {
    const result = await this.tasksRepository
      .createQueryBuilder('task')
      .select('MAX(task.order)', 'max')
      .where('task.stageId = :stageId', { stageId })
      .andWhere('task.deletedAt IS NULL')
      .getRawOne<{ max: string | null }>();
    const max = result?.max != null ? Number(result.max) : -1;
    return Number.isFinite(max) ? max + 1 : 0;
  }

  /**
   * Coloca a task no índice indicado da coluna destino e reindexa 0..n-1.
   * Se mudou de coluna, reindexa também a origem.
   */
  private async placeTask(
    taskId: string,
    targetStageId: string,
    index?: number,
  ): Promise<void> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: ['stage'],
    });
    if (!task) throw new BadRequestException('Task not found');

    const sourceStageId = task.stage?.id ? String(task.stage.id) : null;
    const siblings = await this.tasksRepository.find({
      where: { stage: { id: targetStageId } },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
    const without = siblings.filter((t) => String(t.id) !== String(taskId));
    const insertAt =
      index === undefined || index === null
        ? without.length
        : Math.max(0, Math.min(index, without.length));
    without.splice(insertAt, 0, task);

    for (let i = 0; i < without.length; i++) {
      const id = String(without[i].id);
      if (id === String(taskId)) {
        await this.tasksRepository.query(
          `UPDATE "task" SET "order" = $1, "stageId" = $2 WHERE id = $3`,
          [i, targetStageId, id],
        );
      } else if (without[i].order !== i) {
        await this.tasksRepository.update({ id }, { order: i });
      }
    }

    if (sourceStageId && sourceStageId !== targetStageId) {
      await this.reindexStage(sourceStageId);
    }
  }

  private async reindexStage(stageId: string): Promise<void> {
    const tasks = await this.tasksRepository.find({
      where: { stage: { id: stageId } },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].order !== i) {
        await this.tasksRepository.update(
          { id: String(tasks[i].id) },
          { order: i },
        );
      }
    }
  }

  async create(createTaskDto: CreateTaskDto, user: User) {
    const stage = await this.projectStagesService.findOne(BigInt(createTaskDto.stageId));
    if (!stage) {
      throw new BadRequestException('Stage not found');
    }
    const project = await this.projectsService.findOneWithOwnerAndParticipants(BigInt(stage.project.id));
    if (!project || !canAccessProject(project, user)) {
      throw new ForbiddenException('Sem permissão para criar tarefa neste projeto');
    }
    const order = await this.nextOrderInStage(String(stage.id));
    return this.tasksRepository.save({
      id: String(this.snowflakeIdService.generateId()),
      name: createTaskDto.name,
      user,
      stage,
      order,
      completedAt: null,
    });
  }

  findAll(user: User) {
    try {
      return this.tasksRepository.find({
        where: {
          user: {
            id: user.id
          }
        },
        order: { order: 'ASC', createdAt: 'ASC' },
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
        relations: ['stage'],
        order: { order: 'ASC', createdAt: 'ASC' },
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

  private async loadTaskForAccess(id: bigint) {
    const task = await this.tasksRepository.findOne({
      where: { id: String(id) },
      relations: ['user', 'stage', 'stage.project'],
    });
    if (!task) {
      throw new BadRequestException('Task not found');
    }
    const project = await this.projectsService.findOneWithOwnerAndParticipants(
      BigInt(task.stage.project.id),
    );
    if (!project) {
      throw new BadRequestException('Project not found');
    }
    return { task, project };
  }

  async complete(id: bigint, user: User) {
    const { task, project } = await this.loadTaskForAccess(id);
    if (!canMoveOrRemoveTask(task, user)) {
      throw new ForbiddenException('Sem permissão para concluir esta tarefa');
    }
    if (task.completedAt) {
      throw new BadRequestException('Tarefa já está concluída');
    }
    if (!task.stage) {
      throw new BadRequestException('Tarefa sem coluna');
    }
    const completedAt = new Date();
    await this.tasksRepository.update(
      { id: String(id) },
      { completedAt },
    );
    await this.completionsRepository.save({
      id: String(this.snowflakeIdService.generateId()),
      task: { id: String(id) } as Task,
      stage: { id: String(task.stage.id) } as ProjectStage,
      completedAt,
    });
    void project;
    return this.findOne(id);
  }

  async listCompletions(id: bigint, user: User) {
    const { task, project } = await this.loadTaskForAccess(id);
    if (!canAccessProject(project, user)) {
      throw new ForbiddenException(
        'Sem permissão para ver o histórico desta tarefa',
      );
    }
    void task;
    return this.completionsRepository.find({
      where: { task: { id: String(id) } },
      relations: ['stage'],
      order: { completedAt: 'DESC' },
    });
  }

  async update(id: bigint, updateTaskDto: UpdateTaskDto, user: User) {
    const { task, project } = await this.loadTaskForAccess(id);

    if (
      updateTaskDto.completedAt !== undefined &&
      updateTaskDto.completedAt !== null
    ) {
      throw new BadRequestException(
        'Use POST /tasks/:id/completions para concluir a tarefa',
      );
    }

    const canMoveOrRemove = canMoveOrRemoveTask(task, user);
    if (canMoveOrRemove) {
      const stageChanging =
        updateTaskDto.stageId !== undefined &&
        String(updateTaskDto.stageId) !== String(task.stage.id);
      const orderChanging = updateTaskDto.order !== undefined;
      const clearCompleted = updateTaskDto.completedAt === null;

      if (stageChanging) {
        const stage = await this.projectStagesService.findOne(
          BigInt(updateTaskDto.stageId!),
        );
        if (!stage) throw new BadRequestException('Stage not found');
      }

      await this.tasksRepository.update(
        { id: String(id) },
        {
          ...(updateTaskDto.description !== undefined && {
            description: updateTaskDto.description,
          }),
          ...(updateTaskDto.finishDate !== undefined && {
            finishDate: updateTaskDto.finishDate as unknown as Date,
          }),
          ...(updateTaskDto.name !== undefined && {
            name: updateTaskDto.name,
          }),
          ...(clearCompleted ? { completedAt: null } : {}),
        },
      );

      if (stageChanging || orderChanging) {
        const targetStageId = stageChanging
          ? String(updateTaskDto.stageId)
          : String(task.stage.id);
        await this.placeTask(
          String(id),
          targetStageId,
          orderChanging ? updateTaskDto.order : undefined,
        );
      }
    } else if (canAccessProject(project, user)) {
      if (
        updateTaskDto.stageId !== undefined ||
        updateTaskDto.order !== undefined ||
        updateTaskDto.completedAt !== undefined
      ) {
        throw new ForbiddenException('Sem permissão para editar esta tarefa');
      }
      await this.tasksRepository.update(
        { id: String(id) },
        {
          description: updateTaskDto.description,
          finishDate: updateTaskDto.finishDate as unknown as Date,
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
    await this.placeTask(String(id), String(stage.prevStage.id));
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
    await this.placeTask(String(id), String(stage.nextStage.id));
    return this.findOne(id);
  }

  async remove(id: bigint, user: User) {
    const task = await this.tasksRepository.findOne({
      where: { id: String(id) },
      relations: ['user', 'stage'],
    });
    if (!task) throw new BadRequestException('Task not found');
    if (!canMoveOrRemoveTask(task, user)) {
      throw new ForbiddenException('Sem permissão para remover esta tarefa');
    }
    const stageId = task.stage?.id ? String(task.stage.id) : null;
    await this.tasksRepository.update({ id: String(id) }, { deletedAt: new Date() });
    if (stageId) {
      await this.reindexStage(stageId);
    }
    return task;
  }
}

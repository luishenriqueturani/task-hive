import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { Task } from './entities/Task.entity';
import { TaskTimeTrak } from './entities/TaskTimeTrak.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { ProjectsService } from 'src/projects/projects.service';
import { User } from 'src/users/entities/User.entity';
import { canAccessProject, canManageProject } from 'src/projects/project-permissions.helper';
import { CreateTimetrackDto } from './dto/create-timetrack.dto';
import { UpdateTimetrackDto } from './dto/update-timetrack.dto';
import { TimetrackGateway } from './timetrack.gateway';

@Injectable()
export class TimetrackService {
  constructor(
    @Inject(PostgreSQLTokens.TASK_REPOSITORY)
    private readonly tasksRepository: Repository<Task>,
    @Inject(PostgreSQLTokens.TASK_TIMETRACK_REPOSITORY)
    private readonly timetrackRepository: Repository<TaskTimeTrak>,
    private readonly snowflakeIdService: SnowflakeIdService,
    private readonly projectsService: ProjectsService,
    private readonly timetrackGateway: TimetrackGateway,
  ) {}

  private async getTaskAndProject(taskId: bigint) {
    const task = await this.tasksRepository.findOne({
      where: { id: String(taskId) },
      relations: ['stage', 'stage.project'],
    });
    if (!task?.stage?.project) return { task: null, project: null };
    const project = await this.projectsService.findOneWithOwnerAndParticipants(
      BigInt(task.stage.project.id),
    );
    return { task, project };
  }

  async list(taskId: bigint, user: User) {
    const { task, project } = await this.getTaskAndProject(taskId);
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    if (!project || !canAccessProject(project, user)) {
      throw new ForbiddenException('Sem permissão para listar timetrack desta tarefa');
    }
    const records = await this.timetrackRepository.find({
      where: { task: { id: String(taskId) } },
      relations: ['user'],
      order: { start: 'DESC' },
    });
    return records.map((r) => ({
      id: r.id,
      start: r.start,
      end: r.end,
      userId: r.user?.id,
      userName: r.user?.name,
    }));
  }

  async start(taskId: bigint, user: User, dto?: CreateTimetrackDto) {
    const { task, project } = await this.getTaskAndProject(taskId);
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    if (!project || !canAccessProject(project, user)) {
      throw new ForbiddenException('Sem permissão para registrar timetrack nesta tarefa');
    }
    // Um único timer ativo por usuário: encerrar qualquer outro em aberto deste usuário
    const open = await this.timetrackRepository.find({
      where: { user: { id: user.id }, end: IsNull() },
    });
    for (const r of open) {
      await this.timetrackRepository.update({ id: r.id }, { end: new Date() });
    }
    const startDate = dto?.start ? new Date(dto.start) : new Date();
    const record = await this.timetrackRepository.save({
      id: String(this.snowflakeIdService.generateId()),
      task,
      user,
      start: startDate,
      end: null,
    });
    this.timetrackGateway.emitStarted(taskId, {
      id: record.id,
      taskId: String(taskId),
      userId: user.id,
      userName: user.name,
      start: record.start,
      end: record.end,
    });
    return record;
  }

  async stop(taskId: bigint, recordId: string, user: User) {
    const { task, project } = await this.getTaskAndProject(taskId);
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    if (!project || !canAccessProject(project, user)) {
      throw new ForbiddenException('Sem permissão para editar timetrack desta tarefa');
    }
    const record = await this.timetrackRepository.findOne({
      where: { id: recordId, task: { id: String(taskId) } },
      relations: ['user'],
    });
    if (!record) throw new NotFoundException('Registro de timetrack não encontrado');
    const isOwner = record.user?.id === user.id;
    if (!isOwner && !canManageProject(project, user)) {
      throw new ForbiddenException('Apenas o usuário que iniciou ou quem gerencia o projeto pode encerrar');
    }
    const endDate = new Date();
    await this.timetrackRepository.update({ id: recordId }, { end: endDate });
    const updated = await this.timetrackRepository.findOne({
      where: { id: recordId },
      relations: ['user'],
    });
    this.timetrackGateway.emitStopped(taskId, {
      id: recordId,
      taskId: String(taskId),
      userId: updated?.user?.id,
      userName: updated?.user?.name,
      start: updated?.start,
      end: endDate,
    });
    return updated;
  }

  async update(taskId: bigint, recordId: string, user: User, dto: UpdateTimetrackDto) {
    const { task, project } = await this.getTaskAndProject(taskId);
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    if (!project || !canAccessProject(project, user)) {
      throw new ForbiddenException('Sem permissão para editar timetrack desta tarefa');
    }
    const record = await this.timetrackRepository.findOne({
      where: { id: recordId, task: { id: String(taskId) } },
      relations: ['user'],
    });
    if (!record) throw new NotFoundException('Registro de timetrack não encontrado');
    const isOwner = record.user?.id === user.id;
    if (!isOwner && !canManageProject(project, user)) {
      throw new ForbiddenException('Apenas o dono do registro ou quem gerencia o projeto pode editar');
    }
    if (dto.end != null) {
      await this.timetrackRepository.update({ id: recordId }, { end: new Date(dto.end) });
    }
    const updated = await this.timetrackRepository.findOne({
      where: { id: recordId },
      relations: ['user'],
    });
    this.timetrackGateway.emitUpdated(taskId, {
      id: recordId,
      taskId: String(taskId),
      userId: updated?.user?.id,
      userName: updated?.user?.name,
      start: updated?.start,
      end: updated?.end,
    });
    return updated;
  }

  async remove(taskId: bigint, recordId: string, user: User) {
    const { task, project } = await this.getTaskAndProject(taskId);
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    if (!project || !canAccessProject(project, user)) {
      throw new ForbiddenException('Sem permissão para remover timetrack desta tarefa');
    }
    const record = await this.timetrackRepository.findOne({
      where: { id: recordId, task: { id: String(taskId) } },
      relations: ['user'],
    });
    if (!record) throw new NotFoundException('Registro de timetrack não encontrado');
    const isOwner = record.user?.id === user.id;
    if (!isOwner && !canManageProject(project, user)) {
      throw new ForbiddenException('Apenas o dono do registro ou quem gerencia o projeto pode remover');
    }
    await this.timetrackRepository.delete({ id: recordId });
    this.timetrackGateway.emitDeleted(taskId, {
      id: recordId,
      taskId: String(taskId),
    });
    return { deleted: true };
  }
}

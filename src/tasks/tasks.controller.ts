import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  TaskOpenApiDto,
  TimetrackListItemOpenApiDto,
  TimetrackDetailOpenApiDto,
  DeletedFlagOpenApiDto,
} from './dto/task-openapi.dto';
import { TasksService } from './tasks.service';
import { TimetrackService } from './timetrack.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTimetrackDto } from './dto/create-timetrack.dto';
import { UpdateTimetrackDto } from './dto/update-timetrack.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly timetrackService: TimetrackService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar tarefa', description: 'Cria uma tarefa em uma coluna. Requer acesso ao projeto (dono ou participante). O usuário autenticado será o dono da tarefa.' })
  @ApiBody({ type: CreateTaskDto })
  @ApiCreatedResponse({
    description: 'Tarefa criada (entidade salva com user e stage)',
    type: TaskOpenApiDto,
  })
  @ApiResponse({ status: 400, description: 'Stage não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para criar tarefa neste projeto' })
  @ApiResponse({ status: 422, description: 'Dados inválidos' })
  create(@Body() createTaskDto: CreateTaskDto, @User() user: UserEntity) {
    try {
      return this.tasksService.create(createTaskDto, user);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar minhas tarefas', description: 'Retorna tarefas em que o usuário autenticado é o dono (where user.id).' })
  @ApiOkResponse({ description: 'Lista de tarefas do usuário', type: TaskOpenApiDto, isArray: true })
  findAll(@User() user: UserEntity) {
    try {
      return this.tasksService.findAll(user);
    } catch (error) {
      throw error;
    }
  }

  @Get('stage/:stage')
  @ApiOperation({ summary: 'Tarefas por coluna', description: 'Retorna tarefas de uma coluna (stage), com relation stage carregada.' })
  @ApiParam({ name: 'stage', description: 'ID da coluna (stage)', example: '9876543210987654321' })
  @ApiOkResponse({ description: 'Lista de tarefas da coluna (com stage)', type: TaskOpenApiDto, isArray: true })
  findByStage(@Param('stage') stage: string, @User() user: UserEntity) {
    try {
      return this.tasksService.findByStage(stage);
    } catch (error) {
      throw error;
    }
  }

  @Get(':taskId/timetrack')
  @ApiOperation({ summary: 'Listar timetrack da tarefa', description: 'Lista registros de tempo da tarefa (id, start, end, userId, userName). Quem tem acesso ao projeto pode listar.' })
  @ApiParam({ name: 'taskId', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiOkResponse({
    description: 'Lista de registros (campos seguros, ordenados por start DESC)',
    type: TimetrackListItemOpenApiDto,
    isArray: true,
  })
  @ApiResponse({ status: 403, description: 'Sem permissão para listar timetrack desta tarefa' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  listTimetrack(@Param('taskId') taskId: string, @User() user: UserEntity) {
    return this.timetrackService.list(BigInt(taskId), user);
  }

  @Post(':taskId/timetrack/start')
  @ApiOperation({ summary: 'Iniciar timer', description: 'Inicia um registro de tempo na tarefa. Um único timer ativo por usuário (outros são encerrados). Body opcional: start (ISO 8601).' })
  @ApiParam({ name: 'taskId', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiBody({ type: CreateTimetrackDto })
  @ApiCreatedResponse({
    description: 'Registro de timetrack criado (entidade com task, user, start, end null)',
    type: TimetrackDetailOpenApiDto,
  })
  @ApiResponse({ status: 403, description: 'Sem permissão para registrar timetrack nesta tarefa' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  startTimetrack(
    @Param('taskId') taskId: string,
    @Body() dto: CreateTimetrackDto,
    @User() user: UserEntity,
  ) {
    return this.timetrackService.start(BigInt(taskId), user, dto);
  }

  @Patch(':taskId/timetrack/:id/stop')
  @ApiOperation({ summary: 'Encerrar timer', description: 'Define end = agora no registro. Quem iniciou ou quem gerencia o projeto. Retorna a entidade atualizada.' })
  @ApiParam({ name: 'taskId', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiParam({ name: 'id', description: 'ID do registro de timetrack (bigint)', example: '1234567890123456789' })
  @ApiOkResponse({
    description: 'Registro atualizado (entidade com user, start, end preenchido)',
    type: TimetrackDetailOpenApiDto,
  })
  @ApiResponse({ status: 403, description: 'Apenas quem iniciou ou quem gerencia o projeto pode encerrar' })
  @ApiResponse({ status: 404, description: 'Tarefa ou registro de timetrack não encontrado' })
  stopTimetrack(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @User() user: UserEntity,
  ) {
    return this.timetrackService.stop(BigInt(taskId), id, user);
  }

  @Patch(':taskId/timetrack/:id')
  @ApiOperation({ summary: 'Atualizar timetrack', description: 'Atualiza end do registro (correção manual). Dono do registro ou gestor do projeto. Retorna a entidade atualizada.' })
  @ApiParam({ name: 'taskId', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiParam({ name: 'id', description: 'ID do registro de timetrack (bigint)', example: '1234567890123456789' })
  @ApiBody({ type: UpdateTimetrackDto })
  @ApiOkResponse({
    description: 'Registro atualizado (entidade com user, start, end)',
    type: TimetrackDetailOpenApiDto,
  })
  @ApiResponse({ status: 403, description: 'Apenas dono do registro ou gestor do projeto pode editar' })
  @ApiResponse({ status: 404, description: 'Tarefa ou registro não encontrado' })
  updateTimetrack(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTimetrackDto,
    @User() user: UserEntity,
  ) {
    return this.timetrackService.update(BigInt(taskId), id, user, dto);
  }

  @Delete(':taskId/timetrack/:id')
  @ApiOperation({ summary: 'Remover timetrack', description: 'Remove definitivamente um registro de tempo. Dono do registro ou gestor do projeto.' })
  @ApiParam({ name: 'taskId', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiParam({ name: 'id', description: 'ID do registro de timetrack (bigint)', example: '1234567890123456789' })
  @ApiOkResponse({ description: 'Confirmação de remoção (resposta literal do serviço)', type: DeletedFlagOpenApiDto })
  @ApiResponse({ status: 403, description: 'Apenas dono do registro ou gestor do projeto pode remover' })
  @ApiResponse({ status: 404, description: 'Tarefa ou registro não encontrado' })
  removeTimetrack(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @User() user: UserEntity,
  ) {
    return this.timetrackService.remove(BigInt(taskId), id, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tarefa', description: 'Retorna uma tarefa por ID com relation stage. Se não existir, o serviço retorna null.' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiOkResponse({
    description: 'Tarefa encontrada (com stage). Se não existir, retorna null.',
    type: TaskOpenApiDto,
  })
  findOne(@Param('id') id: string) {
    try {
      return this.tasksService.findOne(BigInt(id));
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tarefa', description: 'Participante pode alterar name, description, finishDate; dono da tarefa ou admin podem também alterar stageId (mover coluna). Retorna findOne(id).' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiBody({
    type: UpdateTaskDto,
    examples: {
      campos: { summary: 'Nome, descrição e data', value: { name: 'Implementar login OAuth', description: 'Descrição', finishDate: '2025-03-01T23:59:59.000Z' } },
      mover: { summary: 'Mover coluna (dono/admin)', value: { stageId: '9876543210987654322' } },
    },
  })
  @ApiOkResponse({ description: 'Tarefa atualizada (entidade com stage)', type: TaskOpenApiDto })
  @ApiResponse({ status: 400, description: 'Tarefa, projeto ou stage não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para editar esta tarefa' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @User() user: UserEntity) {
    try {
      return this.tasksService.update(BigInt(id), updateTaskDto, user);
    } catch (error) {
      throw error;
    }
  }

  @Patch('nextStage/:id')
  @ApiOperation({ summary: 'Mover para próxima coluna', description: 'Move a tarefa para a coluna seguinte (stage.nextStage). Apenas dono da tarefa ou admin. Retorna findOne(id).' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiOkResponse({ description: 'Tarefa movida (entidade com stage atualizado)', type: TaskOpenApiDto })
  @ApiResponse({ status: 400, description: 'Tarefa não encontrada ou stage não tem próxima coluna' })
  @ApiResponse({ status: 403, description: 'Sem permissão para mover esta tarefa' })
  toNextStage(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.tasksService.toNextStage(BigInt(id), user);
    } catch (error) {
      throw error;
    }
  }

  @Patch('previousStage/:id')
  @ApiOperation({ summary: 'Mover para coluna anterior', description: 'Move a tarefa para a coluna anterior (stage.prevStage). Apenas dono da tarefa ou admin. Retorna findOne(id).' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiOkResponse({ description: 'Tarefa movida (entidade com stage atualizado)', type: TaskOpenApiDto })
  @ApiResponse({ status: 400, description: 'Tarefa não encontrada ou stage não tem coluna anterior' })
  @ApiResponse({ status: 403, description: 'Sem permissão para mover esta tarefa' })
  toPreviousStage(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.tasksService.toPreviousStage(BigInt(id), user);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover tarefa', description: 'Soft delete (deletedAt). Apenas dono da tarefa ou admin. Retorna a entidade da tarefa que foi removida.' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiOkResponse({ description: 'Tarefa que foi removida (entidade com user)', type: TaskOpenApiDto })
  @ApiResponse({ status: 400, description: 'Tarefa não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para remover esta tarefa' })
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.tasksService.remove(BigInt(id), user);
    } catch (error) {
      throw error;
    }
  }
}

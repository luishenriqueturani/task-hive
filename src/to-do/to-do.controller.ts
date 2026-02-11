import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ToDoService } from './to-do.service';
import { CreateToDoDto } from './dto/create-to-do.dto';
import { UpdateToDoDto } from './dto/update-to-do.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';
import { ChangeTaskStatusDto } from './dto/changeTaskStatus.dto';

@ApiTags('to-do')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('to-do')
export class ToDoController {
  constructor(private readonly toDoService: ToDoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar tarefa avulsa', description: 'Cria uma tarefa avulsa (pontual ou recorrente). O serviço retorna a entidade criada com id em string.' })
  @ApiBody({ type: CreateToDoDto })
  @ApiResponse({
    status: 200,
    description: 'Tarefa criada (entidade com id.toString())',
    schema: {
      example: {
        id: '1234567890123456789',
        title: 'Reunião semanal',
        description: 'Preparar pauta',
        status: 'CREATED',
        type: 'RECURRING',
        recurringType: 'WEEKLY',
        recurringTimes: null,
        recurringCount: 0,
        recurringNextDate: '2025-02-16T12:00:00.000Z',
        recurringDeadline: null,
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Falha ao criar a tarefa' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 422, description: 'Dados inválidos' })
  create(@Body() createToDoDto: CreateToDoDto, @User() user: UserEntity) {
    try {
      return this.toDoService.create(createToDoDto, user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar tarefas avulsas', description: 'Retorna tarefas avulsas do usuário (select: id, title, description, recurring*, type, user, createdAt, updatedAt; status não vem no select).' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tarefas do usuário',
    schema: {
      example: [
        {
          id: '1234567890123456789',
          title: 'Reunião semanal',
          description: 'Preparar pauta',
          recurringDeadline: null,
          recurringTimes: null,
          recurringType: 'WEEKLY',
          recurringCount: 0,
          recurringNextDate: '2025-02-16T12:00:00.000Z',
          type: 'RECURRING',
          user: { id: 'uuid', name: 'João', email: 'joao@email.com', avatar: null },
          createdAt: '2025-02-09T12:00:00.000Z',
          updatedAt: null,
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Falha ao buscar tarefas' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@User() user: UserEntity) {
    try {
      return this.toDoService.findAll(user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tarefa avulsa', description: 'Retorna uma tarefa avulsa por ID (select: id, title, description, recurring*, type, user, createdAt, updatedAt). Se não existir, retorna null.' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1234567890123456789' })
  @ApiResponse({
    status: 200,
    description: 'Tarefa encontrada (select do serviço; status não vem no select)',
    schema: {
      example: {
        id: '1234567890123456789',
        title: 'Reunião semanal',
        description: 'Preparar pauta',
        recurringDeadline: null,
        recurringTimes: null,
        recurringType: 'WEEKLY',
        recurringCount: 0,
        recurringNextDate: '2025-02-16T12:00:00.000Z',
        type: 'RECURRING',
        user: { id: 'uuid', name: 'João', email: 'joao@email.com', avatar: null },
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Erro ao buscar tarefa' })
  findOne(@Param('id') id: string) {
    try {
      return this.toDoService.findOne(BigInt(id));
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch('end/:id')
  @ApiOperation({ summary: 'Encerrar tarefa', description: 'Marca a tarefa como concluída (status DONE). Retorna TypeORM UpdateResult.' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1234567890123456789' })
  @ApiResponse({
    status: 200,
    description: 'Resultado do update (TypeORM UpdateResult)',
    schema: { example: { raw: [], affected: 1, generatedMaps: [] } },
  })
  @ApiResponse({ status: 400, description: 'Tarefa não encontrada' })
  endTask(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.toDoService.endTask(BigInt(id), user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Alterar status', description: 'Altera o status (TODO, DONE, CANCELLED, PAUSED, CREATED). Retorna TypeORM UpdateResult.' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1234567890123456789' })
  @ApiBody({ type: ChangeTaskStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Resultado do update (TypeORM UpdateResult)',
    schema: { example: { raw: [], affected: 1, generatedMaps: [] } },
  })
  @ApiResponse({ status: 400, description: 'Tarefa não encontrada' })
  @ApiResponse({ status: 422, description: 'Status inválido (enum)' })
  changeTaskStatus(@Param('id') id: string, @Body() changeTaskStatusDto: ChangeTaskStatusDto, @User() user: UserEntity) {
    try {
      return this.toDoService.changeTaskStatus(BigInt(id), changeTaskStatusDto.status, user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch('nextDateRecurring/:id')
  @ApiOperation({ summary: 'Próxima data recorrente', description: 'Avança recurringNextDate e recurringCount. Se count >= recurringTimes, chama endTask. Retorna UpdateResult.' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1234567890123456789' })
  @ApiResponse({
    status: 200,
    description: 'Resultado do update (ou de endTask se atingiu recurringTimes)',
    schema: { example: { raw: [], affected: 1, generatedMaps: [] } },
  })
  @ApiResponse({ status: 400, description: 'Tarefa não encontrada' })
  nextDateRecurringTask(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.toDoService.nextDateRecurringTask(BigInt(id), user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar tarefa avulsa', description: 'Atualiza title, description, recurring*. Retorna TypeORM UpdateResult.' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1234567890123456789' })
  @ApiBody({
    type: UpdateToDoDto,
    examples: {
      parcial: { summary: 'Título e descrição', value: { title: 'Reunião quinzenal', description: 'Nova descrição' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado do update (TypeORM UpdateResult)',
    schema: { example: { raw: [], affected: 1, generatedMaps: [] } },
  })
  @ApiResponse({ status: 400, description: 'Tarefa não encontrada' })
  update(@Param('id') id: string, @Body() updateToDoDto: UpdateToDoDto, @User() user: UserEntity) {
    try {
      return this.toDoService.update(BigInt(id), updateToDoDto, user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Remover tarefa avulsa', description: 'Soft delete (deletedAt). Retorna TypeORM UpdateResult.' })
  @ApiParam({ name: 'id', description: 'ID da tarefa (bigint)', example: '1234567890123456789' })
  @ApiResponse({
    status: 200,
    description: 'Resultado do update (TypeORM UpdateResult)',
    schema: { example: { raw: [], affected: 1, generatedMaps: [] } },
  })
  @ApiResponse({ status: 400, description: 'Tarefa não encontrada' })
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.toDoService.remove(BigInt(id), user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}

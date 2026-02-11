import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';

@ApiTags('subtasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('subtasks')
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Post()
  @ApiOperation({ summary: 'Criar subtarefa', description: 'Cria uma subtarefa vinculada a uma tarefa. O usuário autenticado será o responsável (responsible).' })
  @ApiBody({ type: CreateSubtaskDto })
  @ApiResponse({
    status: 200,
    description: 'Subtarefa criada (entidade com task e responsible)',
    schema: {
      example: {
        id: '2223334445566677889',
        name: 'Revisar código',
        description: null,
        isCompleted: false,
        task: { id: '1112223334455667778' },
        responsible: { id: '550e8400-e29b-41d4-a716-446655440000' },
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Tarefa não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 422, description: 'Dados inválidos' })
  create(@Body() createSubtaskDto: CreateSubtaskDto, @User() user: UserEntity) {
    try {
      return this.subtasksService.create(createSubtaskDto, user);
    } catch (error) {
      throw error
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar subtarefas', description: 'Retorna todas as subtarefas (find sem relations).' })
  @ApiResponse({
    status: 200,
    description: 'Lista de subtarefas',
    schema: {
      example: [
        {
          id: '2223334445566677889',
          name: 'Revisar código',
          description: null,
          isCompleted: false,
          createdAt: '2025-02-09T12:00:00.000Z',
          updatedAt: null,
          deletedAt: null,
        },
      ],
    },
  })
  findAll() {
    try {
      return this.subtasksService.findAll();
    } catch (error) {
      throw error
    }
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Subtarefas por tarefa', description: 'Retorna subtarefas de uma tarefa. Rota específica antes de :id.' })
  @ApiParam({ name: 'taskId', description: 'ID da tarefa (bigint)', example: '1112223334455667778' })
  @ApiResponse({
    status: 200,
    description: 'Lista de subtarefas da tarefa',
    schema: {
      example: [
        {
          id: '2223334445566677889',
          name: 'Revisar código',
          description: null,
          isCompleted: false,
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Tarefa não encontrada' })
  findByTaskId(@Param('taskId') taskId: string) {
    try {
      return this.subtasksService.findByTaskId(taskId);
    } catch (error) {
      throw error
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar subtarefa', description: 'Retorna uma subtarefa por ID (bigint). Se não existir, o serviço retorna null.' })
  @ApiParam({ name: 'id', description: 'ID da subtarefa (bigint)', example: '2223334445566677889' })
  @ApiResponse({
    status: 200,
    description: 'Subtarefa encontrada. Se não existir, retorna null.',
    schema: {
      example: {
        id: '2223334445566677889',
        name: 'Revisar código',
        description: null,
        isCompleted: false,
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  findOne(@Param('id') id: string) {
    try {
      return this.subtasksService.findOne(id);
    } catch (error) {
      throw error
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar subtarefa', description: 'Atualiza name, description e define responsible = usuário autenticado. Apenas o responsável atual da subtarefa pode atualizar.' })
  @ApiParam({ name: 'id', description: 'ID da subtarefa (bigint)', example: '2223334445566677889' })
  @ApiBody({
    type: UpdateSubtaskDto,
    examples: {
      parcial: { summary: 'Só nome', value: { name: 'Revisar código e testes' } },
      comDesc: { summary: 'Nome e descrição', value: { name: 'Revisar código', description: 'Incluir testes unitários' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado do update (TypeORM UpdateResult)',
    schema: {
      example: {
        raw: [],
        affected: 1,
        generatedMaps: [],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Subtarefa não encontrada ou usuário não é o responsável' })
  update(@Param('id') id: string, @Body() updateSubtaskDto: UpdateSubtaskDto, @User() user: UserEntity) {
    try {
      return this.subtasksService.update(id, updateSubtaskDto, user);
    } catch (error) {
      throw error
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover subtarefa', description: 'Soft delete (deletedAt). Apenas o responsável atual da subtarefa pode remover. Retorna TypeORM UpdateResult.' })
  @ApiParam({ name: 'id', description: 'ID da subtarefa (bigint)', example: '2223334445566677889' })
  @ApiResponse({
    status: 200,
    description: 'Resultado do update (TypeORM UpdateResult)',
    schema: {
      example: {
        raw: [],
        affected: 1,
        generatedMaps: [],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Subtarefa não encontrada ou usuário não é o responsável' })
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.subtasksService.remove(id, user);
    } catch (error) {
      throw error
    }
  }
}

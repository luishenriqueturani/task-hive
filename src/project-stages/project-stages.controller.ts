import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ProjectStagesService } from './project-stages.service';
import { CreateProjectStageDto } from './dto/create-project-stage.dto';
import { UpdateProjectStageDto } from './dto/update-project-stage.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';

@ApiTags('project-stages')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('project-stages')
export class ProjectStagesController {
  constructor(private readonly projectStagesService: ProjectStagesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar coluna', description: 'Cria uma nova coluna (stage) em um projeto. Opcionalmente encadeia com nextStageId/prevStageId. Apenas dono ou admin do projeto.' })
  @ApiBody({ type: CreateProjectStageDto })
  @ApiResponse({
    status: 200,
    description: 'Coluna criada (entidade salva com project, nextStage, prevStage quando informados)',
    schema: {
      example: {
        id: '9876543210987654321',
        name: 'To Do',
        order: 0,
        project: { id: '1234567890123456789' },
        nextStage: null,
        prevStage: null,
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Projeto não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para criar coluna neste projeto' })
  @ApiResponse({ status: 422, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro ao criar coluna do projeto' })
  create(@Body() createProjectStageDto: CreateProjectStageDto, @User() user: UserEntity) {
    try {
      return this.projectStagesService.create(createProjectStageDto, user);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar colunas', description: 'Retorna todas as colunas (find sem relations).' })
  @ApiResponse({
    status: 200,
    description: 'Lista de colunas',
    schema: {
      example: [
        {
          id: '9876543210987654321',
          name: 'To Do',
          order: 0,
          createdAt: '2025-02-09T12:00:00.000Z',
          updatedAt: null,
          deletedAt: null,
        },
      ],
    },
  })
  @ApiResponse({ status: 500, description: 'Erro ao buscar colunas' })
  findAll() {
    try {
      return this.projectStagesService.findAll();
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  
  @Get('project/:id')
  @ApiOperation({ summary: 'Colunas por projeto', description: 'Retorna colunas do projeto ordenadas por order ASC.' })
  @ApiParam({ name: 'id', description: 'ID do projeto (bigint)', example: '1234567890123456789' })
  @ApiResponse({
    status: 200,
    description: 'Lista de colunas do projeto',
    schema: {
      example: [
        {
          id: '9876543210987654321',
          name: 'To Do',
          order: 0,
          createdAt: '2025-02-09T12:00:00.000Z',
          updatedAt: null,
          deletedAt: null,
        },
      ],
    },
  })
  @ApiResponse({ status: 500, description: 'Erro ao buscar colunas do projeto' })
  findAllByProject(@Param('id') id: string) {
    try {
      return this.projectStagesService.findAllByProject(id);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar coluna', description: 'Retorna uma coluna por ID com relations: project, tasks, nextStage, prevStage. Se não existir, o serviço retorna null.' })
  @ApiParam({ name: 'id', description: 'ID da coluna (bigint)', example: '9876543210987654321' })
  @ApiResponse({
    status: 200,
    description: 'Coluna encontrada com project, tasks, nextStage, prevStage. Se não existir, retorna null.',
    schema: {
      example: {
        id: '9876543210987654321',
        name: 'To Do',
        order: 0,
        project: { id: '1234567890123456789', name: 'Backlog 2025' },
        tasks: [],
        nextStage: { id: '9876543210987654322', name: 'Doing' },
        prevStage: null,
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Erro ao buscar coluna' })
  findOne(@Param('id') id: string) {
    try {
      return this.projectStagesService.findOne(BigInt(id));
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar coluna', description: 'Atualiza name, order e/ou encadeamento (nextStageId, prevStageId). Apenas dono ou admin do projeto. Retorna findOne(id) após o update.' })
  @ApiParam({ name: 'id', description: 'ID da coluna (bigint)', example: '9876543210987654321' })
  @ApiBody({
    type: UpdateProjectStageDto,
    examples: {
      parcial: { summary: 'Só nome', value: { name: 'Em progresso' } },
      completo: { summary: 'Nome e ordem', value: { name: 'Em progresso', order: 1 } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Coluna atualizada (entidade com project, tasks, nextStage, prevStage)',
    schema: {
      example: {
        id: '9876543210987654321',
        name: 'Em progresso',
        order: 1,
        project: { id: '1234567890123456789' },
        tasks: [],
        nextStage: null,
        prevStage: null,
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: '2025-02-09T14:30:00.000Z',
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Coluna não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para editar esta coluna' })
  @ApiResponse({ status: 500, description: 'Erro ao atualizar coluna' })
  update(@Param('id') id: string, @Body() updateProjectStageDto: UpdateProjectStageDto, @User() user: UserEntity) {
    try {
      return this.projectStagesService.update(BigInt(id), updateProjectStageDto, user);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover coluna', description: 'Soft delete (deletedAt). Apenas dono ou admin do projeto. Retorna a entidade da coluna (com project, tasks, nextStage, prevStage) que foi removida.' })
  @ApiParam({ name: 'id', description: 'ID da coluna (bigint)', example: '9876543210987654321' })
  @ApiResponse({
    status: 200,
    description: 'Coluna que foi removida (entidade com relations)',
    schema: {
      example: {
        id: '9876543210987654321',
        name: 'To Do',
        order: 0,
        project: { id: '1234567890123456789' },
        tasks: [],
        nextStage: null,
        prevStage: null,
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Coluna não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para remover esta coluna' })
  @ApiResponse({ status: 500, description: 'Erro ao remover coluna' })
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.projectStagesService.remove(BigInt(id), user);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

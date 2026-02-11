import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar projeto', description: 'Cria um novo projeto. O usuário autenticado será o dono. Opcionalmente vincula a uma empresa (companyOwnerId).' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 200,
    description: 'Projeto criado (entidade salva com userOwner e companyOwner se informado)',
    schema: {
      example: {
        id: '1234567890123456789',
        name: 'Backlog 2025',
        description: 'Projeto principal do time',
        userOwner: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'João', email: 'joao@email.com' },
        companyOwner: null,
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 422, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro ao criar o projeto' })
  create(@Body() createProjectDto: CreateProjectDto, @User() user: UserEntity) {
    try {
      
      return this.projectsService.create(createProjectDto, user);
  
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar projetos', description: 'Retorna projetos em que o usuário é dono ou participante (query com userOwner e participants).' })
  @ApiResponse({
    status: 200,
    description: 'Lista de projetos com userOwner e participants carregados',
    schema: {
      example: [
        {
          id: '1234567890123456789',
          name: 'Backlog 2025',
          description: 'Projeto principal',
          userOwner: { id: 'uuid', name: 'João', email: 'joao@email.com' },
          participants: [{ id: 'uuid2', name: 'Maria', email: 'maria@email.com' }],
          createdAt: '2025-02-09T12:00:00.000Z',
          updatedAt: null,
          deletedAt: null,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 500, description: 'Erro ao buscar projetos' })
  findAll(@User() user: UserEntity) {
    try {
      return this.projectsService.findAll(user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Listar participantes', description: 'Lista participantes do projeto (dono não entra na lista). Serviço retorna array de { id, name, email, avatar, role }.' })
  @ApiParam({ name: 'id', description: 'ID do projeto (bigint)', example: '1234567890123456789' })
  @ApiResponse({
    status: 200,
    description: 'Lista de participantes (campos seguros, sem password)',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Maria Silva',
          email: 'maria@email.com',
          avatar: null,
          role: 'CLIENT',
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Sem permissão para listar participantes deste projeto' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  listParticipants(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.projectsService.listParticipants(BigInt(id), user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Adicionar participante', description: 'Adiciona um usuário como participante. Apenas dono ou admin. Retorna a lista atualizada de participantes (mesmo formato de GET participants).' })
  @ApiParam({ name: 'id', description: 'ID do projeto (bigint)', example: '1234567890123456789' })
  @ApiBody({ type: AddParticipantDto })
  @ApiResponse({
    status: 200,
    description: 'Lista atualizada de participantes após adicionar',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Maria Silva',
          email: 'maria@email.com',
          avatar: null,
          role: 'CLIENT',
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Usuário já é participante ou é o dono do projeto' })
  @ApiResponse({ status: 403, description: 'Sem permissão para adicionar participantes' })
  @ApiResponse({ status: 404, description: 'Projeto ou usuário não encontrado' })
  addParticipant(@Param('id') id: string, @Body() dto: AddParticipantDto, @User() user: UserEntity) {
    try {
      return this.projectsService.addParticipant(BigInt(id), dto.userId, user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Delete(':id/participants/:userId')
  @ApiOperation({ summary: 'Remover participante', description: 'Remove um usuário dos participantes. Apenas dono ou admin. Retorna a lista atualizada de participantes (mesmo formato de GET participants).' })
  @ApiParam({ name: 'id', description: 'ID do projeto (bigint)', example: '1234567890123456789' })
  @ApiParam({ name: 'userId', description: 'UUID do usuário a remover', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Lista atualizada de participantes após remoção',
    schema: {
      example: [],
    },
  })
  @ApiResponse({ status: 403, description: 'Sem permissão para remover participantes' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  removeParticipant(@Param('id') id: string, @Param('userId') userId: string, @User() user: UserEntity) {
    try {
      return this.projectsService.removeParticipant(BigInt(id), userId, user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar projeto', description: 'Retorna um projeto por ID (findOne sem relations). Se não existir, o serviço retorna null.' })
  @ApiParam({ name: 'id', description: 'ID do projeto (bigint)', example: '1234567890123456789' })
  @ApiResponse({
    status: 200,
    description: 'Projeto encontrado. Se o ID não existir, retorna null.',
    schema: {
      example: {
        id: '1234567890123456789',
        name: 'Backlog 2025',
        description: 'Projeto principal',
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Erro ao buscar projeto' })
  findOne(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.projectsService.findOne(BigInt(id));
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar projeto', description: 'Atualiza name e/ou description. Apenas dono ou admin. Retorna findOne(id) após o update.' })
  @ApiParam({ name: 'id', description: 'ID do projeto (bigint)', example: '1234567890123456789' })
  @ApiBody({
    type: UpdateProjectDto,
    examples: {
      parcial: { summary: 'Só nome', value: { name: 'Backlog 2025 Atualizado' } },
      completo: { summary: 'Nome e descrição', value: { name: 'Backlog 2025', description: 'Nova descrição' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Projeto atualizado (entidade retornada pelo findOne)',
    schema: {
      example: {
        id: '1234567890123456789',
        name: 'Backlog 2025 Atualizado',
        description: 'Nova descrição',
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: '2025-02-09T14:30:00.000Z',
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Sem permissão para editar este projeto' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro ao atualizar projeto' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @User() user: UserEntity) {
    try {
      return this.projectsService.update(BigInt(id), updateProjectDto, user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover projeto', description: 'Soft delete (deletedAt). Apenas dono ou admin. Retorna a entidade do projeto (com userOwner e participants) que foi removida.' })
  @ApiParam({ name: 'id', description: 'ID do projeto (bigint)', example: '1234567890123456789' })
  @ApiResponse({
    status: 200,
    description: 'Projeto que foi removido (entidade com userOwner e participants)',
    schema: {
      example: {
        id: '1234567890123456789',
        name: 'Backlog 2025',
        description: 'Projeto principal',
        userOwner: { id: 'uuid', name: 'João', email: 'joao@email.com' },
        participants: [],
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Sem permissão para remover este projeto' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro ao remover projeto' })
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.projectsService.remove(BigInt(id), user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}

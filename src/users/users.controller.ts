import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar usuário', description: 'Cadastra um novo usuário. Não requer autenticação. Retorna o usuário criado (sem senha).' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Usuário criado (entidade retornada pelo serviço, sem password)',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'João Silva',
        email: 'joao@email.com',
        avatar: null,
        role: 'CLIENT',
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Não foi possível criar o usuário' })
  @ApiResponse({ status: 422, description: 'Email já em uso ou dados inválidos' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'Listar usuários', description: 'Retorna todos os usuários (sem password). Select do serviço: id, name, email, avatar, createdAt, updatedAt, deletedAt. Requer Bearer token.' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários (campos retornados pelo find do serviço)',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'João Silva',
          email: 'joao@email.com',
          avatar: null,
          createdAt: '2025-01-15T10:00:00.000Z',
          updatedAt: null,
          deletedAt: null,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário', description: 'Retorna um usuário por ID (UUID). Apenas usuários não removidos (deletedAt null). Mesmo select do findAll.' })
  @ApiParam({ name: 'id', description: 'UUID do usuário', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado (sem password)',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'João Silva',
        email: 'joao@email.com',
        avatar: null,
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuário', description: 'Atualiza name, email e/ou avatar. Retorna o resultado do update do TypeORM (não a entidade).' })
  @ApiParam({ name: 'id', description: 'UUID do usuário', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      parcial: {
        summary: 'Apenas nome',
        value: { name: 'João Atualizado' },
      },
      completo: {
        summary: 'Nome, email e avatar',
        value: { name: 'João Silva', email: 'joao.novo@email.com', avatar: 'https://example.com/avatar.png' },
      },
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
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 422, description: 'Email já em uso' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete', description: 'Marca o usuário como removido (deletedAt = agora). Retorna TypeORM UpdateResult.' })
  @ApiParam({ name: 'id', description: 'UUID do usuário', example: '550e8400-e29b-41d4-a716-446655440000' })
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
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  softDelete(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuário', description: 'Marca o usuário como removido (deletedAt). Não é permitido remover a própria conta (403). Retorna TypeORM UpdateResult.' })
  @ApiParam({ name: 'id', description: 'UUID do usuário', example: '550e8400-e29b-41d4-a716-446655440000' })
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
  @ApiResponse({ status: 403, description: 'Não é permitido remover a própria conta' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  remove(@Param('id') id: string, @User() user: UserEntity) {
    return this.usersService.remove(id, user?.id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPublicResponseDto } from './dto/user-public-response.dto';
import { TypeormUpdateResultDto } from 'src/common/swagger/typeorm-update-result.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { CsrfOriginGuard } from 'src/guards/csrf-origin.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';
import { UserRole } from './user-role.enum';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @UseGuards(CsrfOriginGuard)
  @Post()
  @ApiOperation({ summary: 'Criar usuário', description: 'Cadastra um novo usuário. Não requer autenticação. Retorna o usuário criado (sem senha).' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'Usuário criado (sem password)',
    type: UserPublicResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Não foi possível criar o usuário' })
  @ApiResponse({ status: 422, description: 'Email já em uso ou dados inválidos' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_GOD, UserRole.ADMIN_COLLABORATOR)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuários', description: 'Retorna todos os usuários (sem password). Apenas administradores.' })
  @ApiOkResponse({
    description: 'Lista de usuários',
    type: UserPublicResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar usuários', description: 'Busca paginada por nome ou e-mail (mín. 2 caracteres). Para adicionar participantes a projetos.' })
  @ApiQuery({ name: 'q', required: true, example: 'maria' })
  @ApiOkResponse({
    description: 'Resultados da busca',
    type: UserPublicResponseDto,
    isArray: true,
  })
  search(@Query('q') q: string) {
    return this.usersService.search(q ?? '');
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar usuário', description: 'Retorna um usuário por ID. Próprio perfil ou admin.' })
  @ApiParam({ name: 'id', description: 'UUID do usuário', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Usuário encontrado (sem password)', type: UserPublicResponseDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findOne(@Param('id') id: string, @User() user: UserEntity) {
    return this.usersService.findOne(id, user);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar usuário', description: 'Atualiza name, email e/ou avatar. Próprio perfil ou admin.' })
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
  @ApiOkResponse({ description: 'Resultado do update (TypeORM UpdateResult)', type: TypeormUpdateResultDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 422, description: 'Email já em uso' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @User() user: UserEntity) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_GOD, UserRole.ADMIN_COLLABORATOR)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete', description: 'Marca o usuário como removido. Apenas administradores.' })
  @ApiParam({ name: 'id', description: 'UUID do usuário', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Resultado do update (TypeORM UpdateResult)', type: TypeormUpdateResultDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  softDelete(@Param('id') id: string, @User() user: UserEntity) {
    return this.usersService.softDelete(id, user);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover usuário', description: 'Soft delete. Apenas admin; não é permitido remover a própria conta.' })
  @ApiParam({ name: 'id', description: 'UUID do usuário', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Resultado do update (TypeORM UpdateResult)', type: TypeormUpdateResultDto })
  @ApiResponse({ status: 403, description: 'Não é permitido remover a própria conta' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  remove(@Param('id') id: string, @User() user: UserEntity) {
    return this.usersService.remove(id, user);
  }
}

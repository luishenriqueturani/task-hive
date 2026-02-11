import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar empresa', description: 'Cadastra uma nova empresa. Retorna a entidade salva. Requer Bearer token.' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({
    status: 200,
    description: 'Empresa criada (entidade retornada pelo save)',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Minha Empresa Ltda',
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 422, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro ao criar a empresa' })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empresas', description: 'Retorna todas as empresas (find sem filtro). Requer Bearer token.' })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas (entidades completas)',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Minha Empresa Ltda',
          createdAt: '2025-02-09T12:00:00.000Z',
          updatedAt: null,
          deletedAt: null,
        },
      ],
    },
  })
  @ApiResponse({ status: 500, description: 'Erro ao buscar empresas' })
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa', description: 'Retorna uma empresa por ID (UUID).' })
  @ApiParam({ name: 'id', description: 'UUID da empresa', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Empresa encontrada. Se o ID não existir, o serviço retorna null (body vazio).',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Minha Empresa Ltda',
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Erro ao buscar empresa' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar empresa', description: 'Atualiza o nome da empresa. O serviço faz update e retorna findOne(id) — a entidade atualizada.' })
  @ApiParam({ name: 'id', description: 'UUID da empresa', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({
    type: UpdateCompanyDto,
    examples: {
      default: {
        summary: 'Novo nome',
        value: { name: 'Empresa Atualizada Ltda' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa atualizada (entidade retornada pelo findOne após update)',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Empresa Atualizada Ltda',
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: '2025-02-09T14:30:00.000Z',
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 500, description: 'Erro ao atualizar empresa' })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover empresa', description: 'Soft delete: marca deletedAt. O serviço retorna a entidade da empresa (como estava antes do update).' })
  @ApiParam({ name: 'id', description: 'UUID da empresa', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Empresa que foi removida (entidade retornada pelo serviço antes do soft delete)',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Minha Empresa Ltda',
        createdAt: '2025-02-09T12:00:00.000Z',
        updatedAt: null,
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 500, description: 'Erro ao remover empresa' })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}

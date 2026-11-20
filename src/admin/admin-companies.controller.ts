import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserRole } from 'src/users/user-role.enum';
import { AdminCompaniesService } from './admin-companies.service';
import { AdminCompaniesQueryDto } from './dto/admin-companies-query.dto';

@ApiTags('admin-companies')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_GOD, UserRole.ADMIN_COLLABORATOR)
@Controller('admin/companies')
export class AdminCompaniesController {
  constructor(private readonly companies: AdminCompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar empresas (paginado)' })
  @ApiOkResponse({ description: 'Página de empresas com plano actual' })
  list(@Query() query: AdminCompaniesQueryDto) {
    return this.companies.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de empresa, owner, projectos e plano' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companies.findOne(id);
  }
}

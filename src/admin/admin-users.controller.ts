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
import { AdminUsersService } from './admin-users.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_GOD, UserRole.ADMIN_COLLABORATOR)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar utilizadores (paginado)' })
  @ApiOkResponse({ description: 'Página de utilizadores com plano actual' })
  list(@Query() query: AdminUsersQueryDto) {
    return this.users.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de utilizador, usage e projectos' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }
}

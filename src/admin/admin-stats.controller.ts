import { Controller, Get, UseGuards } from '@nestjs/common';
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
import { AdminStatsService } from './admin-stats.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_GOD, UserRole.ADMIN_COLLABORATOR)
@Controller('admin')
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Resumo do painel admin' })
  @ApiOkResponse({ description: 'Contagens de utilizadores, empresas e tickets' })
  snapshot() {
    return this.stats.snapshot();
  }
}

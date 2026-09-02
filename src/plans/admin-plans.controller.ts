import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'src/users/user-role.enum';
import {
  CreatePlanBenefitDto,
  UpdatePlanBenefitDto,
  UpdatePlanDto,
} from './dto/plan.dto';
import { PlansService } from './plans.service';

@ApiTags('admin-plans')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_GOD, UserRole.ADMIN_COLLABORATOR)
@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os planos (inclui trial)' })
  @ApiOkResponse({ description: 'Lista administrativa de planos' })
  findAll() {
    return this.plans.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um plano' })
  findOne(@Param('id') id: string) {
    return this.plans.findOneAdmin(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar quotas e metadados do plano' })
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plans.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Apagar plano',
    description: 'Planos isSystem (free-trial) não podem ser apagados.',
  })
  remove(@Param('id') id: string) {
    return this.plans.remove(id);
  }

  @Post(':id/benefits')
  @ApiOperation({ summary: 'Adicionar benefício' })
  addBenefit(@Param('id') id: string, @Body() dto: CreatePlanBenefitDto) {
    return this.plans.addBenefit(id, dto);
  }

  @Patch(':id/benefits/:benefitId')
  @ApiOperation({ summary: 'Actualizar benefício' })
  updateBenefit(
    @Param('id') id: string,
    @Param('benefitId') benefitId: string,
    @Body() dto: UpdatePlanBenefitDto,
  ) {
    return this.plans.updateBenefit(id, benefitId, dto);
  }

  @Delete(':id/benefits/:benefitId')
  @ApiOperation({ summary: 'Remover benefício' })
  removeBenefit(
    @Param('id') id: string,
    @Param('benefitId') benefitId: string,
  ) {
    return this.plans.removeBenefit(id, benefitId);
  }
}

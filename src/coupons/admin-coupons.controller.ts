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
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';
import { CouponsService } from './coupons.service';

@ApiTags('admin-coupons')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_GOD, UserRole.ADMIN_COLLABORATOR)
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cupons e redemptions' })
  @ApiOkResponse({ description: 'Lista administrativa de cupons' })
  findAll() {
    return this.coupons.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um cupom' })
  findOne(@Param('id') id: string) {
    return this.coupons.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar cupom' })
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cupom' })
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Apagar cupom (soft delete)' })
  remove(@Param('id') id: string) {
    return this.coupons.remove(id);
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/decorators/user.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { User as UserEntity } from 'src/users/entities/User.entity';
import { UserRole } from 'src/users/user-role.enum';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('admin-subscriptions')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_GOD, UserRole.ADMIN_COLLABORATOR)
@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Atribuir plano',
    description:
      'Cancela a assinatura TRIAL/ACTIVE anterior. Cupom opcional. Contas CNPJ recebem a assinatura na empresa.',
  })
  @ApiOkResponse({ description: 'Assinatura criada' })
  assign(@Body() dto: AssignSubscriptionDto, @User() actor: UserEntity) {
    return this.subscriptions.assign(dto, actor);
  }
}

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';
import { ProjectInvitesService } from './project-invites.service';

@ApiTags('invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly projectInvitesService: ProjectInvitesService) {}

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get(':token')
  @ApiOperation({
    summary: 'Pré-visualizar convite',
    description: 'Público. Metadados para cadastro (?invite=) e página /invite/:token.',
  })
  @ApiParam({ name: 'token', description: 'Token do convite' })
  @ApiResponse({ status: 200, description: 'E-mail e nome do projeto' })
  @ApiResponse({ status: 404, description: 'Convite inválido ou expirado' })
  async preview(@Param('token') token: string) {
    try {
      return await this.projectInvitesService.previewByToken(token);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException('Convite inválido ou expirado.');
    }
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceitar convite',
    description: 'Autenticado. O e-mail da sessão tem de coincidir com o do convite.',
  })
  @ApiParam({ name: 'token', description: 'Token do convite' })
  @ApiResponse({ status: 200, description: 'Participante adicionado ao projecto' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Convite de outro e-mail' })
  @ApiResponse({ status: 404, description: 'Convite inválido ou expirado' })
  accept(@Param('token') token: string, @User() user: UserEntity) {
    return this.projectInvitesService.acceptByToken(token, user);
  }
}

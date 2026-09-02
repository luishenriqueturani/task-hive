import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
}

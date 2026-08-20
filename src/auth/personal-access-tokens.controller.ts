import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';
import { CreatePersonalAccessTokenDto } from './dto/create-personal-access-token.dto';
import {
  PersonalAccessTokenCreatedDto,
  PersonalAccessTokenResponseDto,
} from './dto/personal-access-token-response.dto';
import { PersonalAccessTokensService } from './personal-access-tokens.service';

@ApiTags('personal-access-tokens')
@Controller('personal-access-tokens')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PersonalAccessTokensController {
  constructor(private readonly service: PersonalAccessTokensService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tokens de API do utilizador autenticado' })
  @ApiOkResponse({ type: PersonalAccessTokenResponseDto, isArray: true })
  list(@User() user: UserEntity) {
    return this.service.listForUser(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar token de API (PAT)',
    description:
      'Devolve o token completo uma única vez. Use Authorization: Bearer th_pat_…',
  })
  @ApiCreatedResponse({ type: PersonalAccessTokenCreatedDto })
  create(@User() user: UserEntity, @Body() dto: CreatePersonalAccessTokenDto) {
    return this.service.create(user, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revogar token de API' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  revoke(@User() user: UserEntity, @Param('id') id: string) {
    return this.service.revoke(user, id);
  }
}

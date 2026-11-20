import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { User as UserEntity } from 'src/users/entities/User.entity';
import { CreateSupportMessageDto } from './dto/create-message.dto';
import { CreateSupportTicketDto } from './dto/create-ticket.dto';
import { ListSupportTicketsQueryDto } from './dto/list-tickets-query.dto';
import { PatchSupportTicketDto } from './dto/patch-ticket.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tickets de suporte' })
  @ApiOkResponse({ description: 'Tickets do autor ou, para admin, a fila global' })
  list(
    @User() actor: UserEntity,
    @Query() query: ListSupportTicketsQueryDto,
  ) {
    return this.support.list(actor, query);
  }

  @Post()
  @ApiOperation({ summary: 'Abrir ticket de suporte' })
  create(@User() actor: UserEntity, @Body() dto: CreateSupportTicketDto) {
    return this.support.create(actor, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um ticket' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @User() actor: UserEntity,
  ) {
    return this.support.findOne(id, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar estado ou assumir ticket' })
  patch(
    @Param('id', ParseUUIDPipe) id: string,
    @User() actor: UserEntity,
    @Body() dto: PatchSupportTicketDto,
  ) {
    return this.support.patch(id, actor, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Mensagens do ticket' })
  listMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @User() actor: UserEntity,
  ) {
    return this.support.listMessages(id, actor);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post(':id/messages')
  @ApiOperation({ summary: 'Enviar mensagem no ticket' })
  postMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @User() actor: UserEntity,
    @Body() dto: CreateSupportMessageDto,
  ) {
    return this.support.postMessage(id, actor, dto);
  }
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportTicketStatus } from '../support.enums';

export class SupportPublicUserOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ nullable: true, example: 'Ana Silva' })
  name: string | null;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;
}

export class SupportTicketOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Erro no login' })
  subject: string;

  @ApiProperty({ enum: SupportTicketStatus, example: SupportTicketStatus.OPEN })
  status: SupportTicketStatus;

  @ApiProperty({ example: '2026-11-20T12:00:00.000Z' })
  lastMessageAt: Date;

  @ApiProperty({ example: '2026-11-20T12:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  updatedAt: Date | null;

  @ApiProperty({ type: SupportPublicUserOpenApiDto })
  createdBy: SupportPublicUserOpenApiDto;

  @ApiPropertyOptional({ type: SupportPublicUserOpenApiDto, nullable: true })
  assignedTo: SupportPublicUserOpenApiDto | null;
}

export class SupportMessageOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Não consigo entrar na conta.' })
  body: string;

  @ApiProperty({ example: '2026-11-20T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: SupportPublicUserOpenApiDto })
  author: SupportPublicUserOpenApiDto;
}

export class AdminStatsOpenApiDto {
  @ApiProperty({ example: 12 })
  users: number;

  @ApiProperty({ example: 3 })
  companies: number;

  @ApiProperty({ example: 2 })
  openTickets: number;
}

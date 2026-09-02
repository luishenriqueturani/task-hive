import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../user-role.enum';
import { AccountKind } from '../account-kind.enum';

export class SessionCompanyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Acme Tecnologia Ltda' })
  legalName: string;

  @ApiPropertyOptional({ nullable: true, example: 'Acme' })
  tradeName?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '11444777000161' })
  document?: string | null;
}

/** Usuário exposto na API (sem `password`). Campos opcionais variam conforme o endpoint. */
export class UserPublicResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ nullable: true, example: 'João Silva' })
  name?: string | null;

  @ApiProperty({ example: 'joao@email.com' })
  email: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  avatar?: string | null;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.CLIENT })
  role?: UserRole;

  @ApiPropertyOptional({ enum: AccountKind, example: AccountKind.INDIVIDUAL })
  accountKind?: AccountKind;

  @ApiPropertyOptional({ nullable: true, example: null })
  document?: string | null;

  @ApiPropertyOptional({ type: SessionCompanyResponseDto, nullable: true })
  company?: SessionCompanyResponseDto | null;

  @ApiProperty({ example: '2025-02-09T12:00:00.000Z' })
  createdAt: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  updatedAt?: string | null;

  @ApiPropertyOptional({ nullable: true, example: null })
  deletedAt?: string | null;
}

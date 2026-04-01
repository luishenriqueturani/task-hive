import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../user-role.enum';

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

  @ApiProperty({ example: '2025-02-09T12:00:00.000Z' })
  createdAt: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  updatedAt?: string | null;

  @ApiPropertyOptional({ nullable: true, example: null })
  deletedAt?: string | null;
}

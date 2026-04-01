import { PartialType, PickType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/** Atualização parcial: apenas `name`, `email` e `avatar` (sem senha). */
export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, ['name', 'email', 'avatar'] as const),
) {}

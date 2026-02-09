import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({ description: 'UUID do usuário a adicionar como participante' })
  @IsUUID()
  userId: string;
}

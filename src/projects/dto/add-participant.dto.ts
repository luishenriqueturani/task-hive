import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({
    description: 'UUID do usuário a adicionar como participante',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;
}

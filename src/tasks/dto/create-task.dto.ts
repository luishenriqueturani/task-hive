import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";
import { IsBigInt } from "src/decorators/IsBigInt.decorator";

export class CreateTaskDto {
  @ApiProperty({
    description: 'Nome da tarefa',
    example: 'Implementar login',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'ID da coluna (stage) onde a tarefa será criada (bigint)',
    example: '9876543210987654321',
  })
  @IsBigInt()
  stageId: string;
}

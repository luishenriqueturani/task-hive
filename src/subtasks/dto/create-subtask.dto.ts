import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class CreateSubtaskDto {

  @ApiProperty({
    description: 'Nome da subtarefa',
    example: 'Revisar código',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'ID da tarefa (bigint) à qual a subtarefa pertence',
    example: '1112223334455667778',
  })
  @IsString()
  taskId: string;
}

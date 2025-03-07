import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class CreateSubtaskDto {

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string

  @ApiProperty()
  @IsString()
  taskId: string
}

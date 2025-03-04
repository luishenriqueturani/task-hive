import { IsString, MaxLength } from "class-validator";

export class CreateSubtaskDto {

  @IsString()
  @MaxLength(255)
  name: string

  @IsString()
  taskId: string
}

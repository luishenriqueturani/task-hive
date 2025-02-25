import { IsString, MaxLength } from "class-validator"
import { IsBigInt } from "src/decorators/IsBigInt.decorator"

export class CreateTaskDto {
  @IsString()
  @MaxLength(255)
  name: string

  @IsBigInt()
  stageId: string
}

import { ApiProperty } from "@nestjs/swagger"
import { IsString, MaxLength } from "class-validator"
import { IsBigInt } from "src/decorators/IsBigInt.decorator"

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string

  @ApiProperty()
  @IsBigInt()
  stageId: string
}

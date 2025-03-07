import { ApiProperty } from "@nestjs/swagger"
import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator"

export class CreateProjectStageDto {

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string

  @ApiProperty()
  @IsString()
  projectId: string

  @ApiProperty()
  @IsNumber()
  @Min(0)
  order: number

  @ApiProperty()
  @IsString()
  @IsOptional()
  nextStageId: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  prevStageId: string


}

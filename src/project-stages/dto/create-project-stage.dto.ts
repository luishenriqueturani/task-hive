import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator"

export class CreateProjectStageDto {

  @IsString()
  @MaxLength(255)
  name: string

  @IsString()
  projectId: string

  @IsNumber()
  @Min(0)
  order: number

  @IsString()
  @IsOptional()
  nextStageId: string

  @IsString()
  @IsOptional()
  prevStageId: string


}

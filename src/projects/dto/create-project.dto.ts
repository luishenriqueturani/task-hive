import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString, MaxLength } from "class-validator"

export class CreateProjectDto {

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  companyOwnerId: string

}

import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class CreateCompanyDto {

  @ApiProperty({
    description: 'Nome da empresa',
    example: 'Minha Empresa Ltda',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

}

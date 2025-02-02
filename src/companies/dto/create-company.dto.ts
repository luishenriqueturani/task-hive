import { IsString, MaxLength } from "class-validator";

export class CreateCompanyDto {

  @IsString()
  @MaxLength(255)
  name: string

}

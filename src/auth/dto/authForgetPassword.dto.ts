import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";



export class AuthForgetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

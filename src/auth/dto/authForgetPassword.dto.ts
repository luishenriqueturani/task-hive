import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";



export class AuthForgetPasswordDto {
  @ApiProperty({
    description: 'Email do usuário para envio do link de redefinição',
    example: 'usuario@email.com',
  })
  @IsEmail()
  email: string;
}

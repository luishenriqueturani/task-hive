import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsStrongPassword } from "class-validator";


export class AuthLoginDto {

  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha (mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo)',
    example: 'Senha@123',
    minLength: 8,
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
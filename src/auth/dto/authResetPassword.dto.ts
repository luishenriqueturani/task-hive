import { ApiProperty } from "@nestjs/swagger";
import { IsJWT, IsStrongPassword } from "class-validator";
import { IsEqualsTo } from "src/decorators/IsEqualsTo.decorator";


export class AuthResetPasswordDto {
  @ApiProperty({
    description: 'Nova senha (mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo)',
    example: 'NovaSenha@123',
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

  @ApiProperty({
    description: 'Confirmação da nova senha (deve ser igual a password)',
    example: 'NovaSenha@123',
  })
  @IsEqualsTo('password')
  confirmPassword: string;

  @ApiProperty({
    description: 'Token JWT recebido por email no fluxo de esqueci a senha',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InV1aWQiLCJuYW1lIjoiSm9hbyIsImVtYWlsIjoidXN1YXJpb0BlbWFpbC5jb20iLCJyb2xlIjoiQ0xJRU5UIiwic3ViIjoidXVpZCIsImlzc3VlciI6IlRhc2tIaXZlIiwiYXVkaWVuY2UiOiJGT1JHRVRfUEFTU1dPUkQiLCJpYXQiOjE3MDk4MDAwMDAsImV4cCI6MTcwOTg4NjQwMH0.xxx',
  })
  @IsJWT()
  token: string;
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, IsStrongPassword, MaxLength } from "class-validator";
import { IsEqualsTo } from "src/decorators/IsEqualsTo.decorator";

export class CreateUserDto {

  @ApiPropertyOptional({
    description: 'Nome do usuário',
    example: 'João Silva',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Email único do usuário',
    example: 'joao@email.com',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Senha (mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo)',
    example: 'Senha@123',
    minLength: 8,
    maxLength: 255,
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @MaxLength(255)
  password: string;

  @ApiProperty({
    description: 'Confirmação da senha (deve ser igual a password)',
    example: 'Senha@123',
  })
  @IsEqualsTo('password')
  confirmPassword: string;

  @ApiPropertyOptional({
    description: 'URL ou identificador do avatar',
    example: 'https://example.com/avatar.png',
  })
  @IsString()
  @IsOptional()
  avatar: string;
}

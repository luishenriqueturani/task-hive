import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { IsEqualsTo } from "src/decorators/IsEqualsTo.decorator";
import { AccountKind } from "../account-kind.enum";
import { RegisterCompanyDto } from "./register-company.dto";

function toDigits(value: unknown): unknown {
  return typeof value === 'string' ? value.replace(/\D/g, '') : value;
}

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

  @ApiPropertyOptional({
    enum: AccountKind,
    description: 'Tipo de conta no cadastro. Omissão = pessoa física.',
    example: AccountKind.INDIVIDUAL,
  })
  @IsOptional()
  @IsEnum(AccountKind)
  accountKind?: AccountKind;

  @ApiPropertyOptional({
    description: 'CPF (apenas dígitos). Opcional para pessoa física.',
    example: '39053344705',
  })
  @IsOptional()
  @Transform(({ value }) => toDigits(value))
  @IsString()
  @MaxLength(14)
  document?: string;

  @ApiPropertyOptional({
    type: RegisterCompanyDto,
    description: 'Dados da empresa. Obrigatório quando accountKind=COMPANY.',
  })
  @ValidateIf((o: CreateUserDto) => o.accountKind === AccountKind.COMPANY)
  @IsDefined()
  @ValidateNested()
  @Type(() => RegisterCompanyDto)
  company?: RegisterCompanyDto;

  @ApiPropertyOptional({
    description: 'Token de convite para projecto (consumido na Onda 2).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  inviteToken?: string;
}

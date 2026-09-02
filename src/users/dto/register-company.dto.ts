import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { normalizeCnpj } from 'src/utils/br-documents';

export class RegisterCompanyDto {
  @ApiProperty({
    description: 'Razão social',
    example: 'Acme Tecnologia Ltda',
    maxLength: 255,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  legalName: string;

  @ApiPropertyOptional({
    description: 'Nome fantasia',
    example: 'Acme',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradeName?: string;

  @ApiProperty({
    description:
      'CNPJ com 14 caracteres (A-Z/0-9 nas 12 primeiras posições; 2 dígitos verificadores). Aceita máscara.',
    example: '12ABC34501DE35',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeCnpj(value) : value,
  )
  @IsString()
  @Matches(/^[A-Z0-9]{12}\d{2}$/, {
    message: 'CNPJ deve ter 12 caracteres alfanuméricos e 2 dígitos verificadores',
  })
  document: string;
}

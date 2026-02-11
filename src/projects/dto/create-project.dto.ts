import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateProjectDto {

  @ApiProperty({
    description: 'Nome do projeto',
    example: 'Backlog 2025',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição do projeto',
    example: 'Projeto principal do time',
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'UUID da empresa dona (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  companyOwnerId: string;

}

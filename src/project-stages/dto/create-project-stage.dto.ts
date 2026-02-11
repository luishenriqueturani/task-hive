import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateProjectStageDto {

  @ApiProperty({
    description: 'Nome da coluna (stage)',
    example: 'To Do',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'ID do projeto (bigint) ao qual a coluna pertence',
    example: '1234567890123456789',
  })
  @IsString()
  projectId: string;

  @ApiProperty({
    description: 'Ordem de exibição (número >= 0)',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  order: number;

  @ApiPropertyOptional({
    description: 'ID da coluna seguinte (bigint), para encadear colunas',
    example: '9876543210987654321',
  })
  @IsString()
  @IsOptional()
  nextStageId: string;

  @ApiPropertyOptional({
    description: 'ID da coluna anterior (bigint), para encadear colunas',
    example: '9876543210987654320',
  })
  @IsString()
  @IsOptional()
  prevStageId: string;

}

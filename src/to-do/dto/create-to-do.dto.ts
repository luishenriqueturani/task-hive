import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { RecurringTypes } from "src/repository/postgresql.enums";

export class CreateToDoDto {

  @ApiProperty({
    description: 'Título da tarefa avulsa',
    example: 'Reunião semanal',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Descrição da tarefa',
    example: 'Preparar pauta e enviar convites',
    minLength: 3,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({
    description: 'Se true, tarefa é recorrente (type RECURRING); senão PUNCTUAL',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: 'Número de ocorrências da recorrente (opcional)',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  recurringTimes?: number;

  @ApiPropertyOptional({
    description: 'Data limite da recorrência (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  recurringDeadline?: string;

  @ApiPropertyOptional({
    description: 'Tipo de recorrência: DAILY, WEEKLY, MONTHLY',
    example: 'WEEKLY',
    enum: RecurringTypes,
  })
  @IsOptional()
  @IsEnum(RecurringTypes)
  recurringType?: RecurringTypes;
}

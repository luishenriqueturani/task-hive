import {
  ApiPropertyOptional,
  IntersectionType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

class UpdateTaskExtraDto {
  @ApiPropertyOptional({
    description: 'Descrição da tarefa',
    example: 'Implementar login com OAuth2',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Data de conclusão prevista (ISO 8601)',
    example: '2025-03-01T23:59:59.000Z',
  })
  @IsDateString()
  @IsOptional()
  finishDate?: string;

  @ApiPropertyOptional({
    description:
      'Ordem na coluna (0 = topo). Apenas dono da tarefa ou admin.',
    example: 0,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    description:
      'Somente `null` para limpar o estado de concluída (histórico permanece). Para concluir use POST /tasks/:id/completions.',
    nullable: true,
    example: null,
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  completedAt?: null;
}

/** Partial de criação + campos extra; o IntersectionType expõe name/stageId no schema OpenAPI. */
export class UpdateTaskDto extends IntersectionType(
  PartialType(CreateTaskDto),
  UpdateTaskExtraDto,
) {}

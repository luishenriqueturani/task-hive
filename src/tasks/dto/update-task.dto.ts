import {
  ApiPropertyOptional,
  IntersectionType,
  PartialType,
} from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
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
}

/** Partial de criação + campos extra; o IntersectionType expõe name/stageId no schema OpenAPI. */
export class UpdateTaskDto extends IntersectionType(
  PartialType(CreateTaskDto),
  UpdateTaskExtraDto,
) {}

import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {

  @ApiPropertyOptional({
    description: 'Descrição da tarefa',
    example: 'Implementar login com OAuth2',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiPropertyOptional({
    description: 'Data de conclusão prevista (ISO 8601)',
    example: '2025-03-01T23:59:59.000Z',
  })
  @IsDateString()
  @IsOptional()
  finishDate: string;

}

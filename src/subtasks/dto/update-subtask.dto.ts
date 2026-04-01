import { PartialType } from '@nestjs/swagger';
import { CreateSubtaskDto } from './create-subtask.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubtaskDto extends PartialType(CreateSubtaskDto) {

  @ApiPropertyOptional({
    description: 'Descrição da subtarefa',
    example: 'Revisar código e testes unitários',
  })
  @IsString()
  @IsOptional()
  description: string;
}

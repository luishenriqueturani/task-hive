import { PartialType } from '@nestjs/mapped-types';
import { CreateSubtaskDto } from './create-subtask.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSubtaskDto extends PartialType(CreateSubtaskDto) {

  @IsString()
  @IsOptional()
  description: string

  @IsString()
  @IsOptional()
  responsibleId: string
}

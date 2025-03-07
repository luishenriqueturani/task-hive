import { PartialType } from '@nestjs/mapped-types';
import { CreateSubtaskDto } from './create-subtask.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSubtaskDto extends PartialType(CreateSubtaskDto) {

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  responsibleId: string
}

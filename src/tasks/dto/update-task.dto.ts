import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  finishDate: Date

}

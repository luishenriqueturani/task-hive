import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class CreateTimetrackDto {
  @ApiPropertyOptional({ example: '2025-02-09T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  start?: string;
}

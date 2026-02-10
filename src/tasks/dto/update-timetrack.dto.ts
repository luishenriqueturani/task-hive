import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateTimetrackDto {
  @ApiPropertyOptional({ example: '2025-02-09T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  end?: string;
}

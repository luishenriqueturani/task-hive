import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class CreateTimetrackDto {
  @ApiPropertyOptional({
    description: 'Data/hora de início (ISO 8601). Se omitido, usa o momento atual.',
    example: '2025-02-09T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  start?: string;
}

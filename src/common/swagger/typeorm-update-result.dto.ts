import { ApiProperty } from '@nestjs/swagger';

/** Forma típica de `UpdateResult` do TypeORM nas respostas desta API. */
export class TypeormUpdateResultDto {
  @ApiProperty({ type: 'array', items: { type: 'object' }, example: [] })
  raw: unknown[];

  @ApiProperty({ example: 1 })
  affected: number;

  @ApiProperty({ type: 'array', items: { type: 'object' }, example: [] })
  generatedMaps: unknown[];
}

import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

function emptyToUndef({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}

export class AdminCompaniesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;

  @Transform(emptyToUndef)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @Transform(emptyToUndef)
  @IsOptional()
  @IsString()
  @MaxLength(18)
  document?: string;

  @Transform(emptyToUndef)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  planSlug?: string;
}

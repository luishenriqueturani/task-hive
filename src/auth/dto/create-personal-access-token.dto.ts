import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreatePersonalAccessTokenDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  /** Dias até expirar; omitir = 90 dias. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;
}

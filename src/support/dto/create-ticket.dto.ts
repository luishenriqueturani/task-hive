import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

function emptyToUndef({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateSupportTicketDto {
  @Transform(emptyToUndef)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject: string;

  @Transform(emptyToUndef)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body?: string;
}

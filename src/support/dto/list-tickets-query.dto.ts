import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SupportTicketStatus } from '../support.enums';

function emptyToUndef({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}

export class ListSupportTicketsQueryDto {
  @Transform(emptyToUndef)
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @Transform(emptyToUndef)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}

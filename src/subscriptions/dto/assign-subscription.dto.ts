import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

function emptyToUndef({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}

export class AssignSubscriptionDto {
  @Transform(emptyToUndef)
  @IsOptional()
  @IsUUID()
  userId?: string;

  @Transform(emptyToUndef)
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsUUID()
  planId: string;

  @Transform(emptyToUndef)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(32)
  couponCode?: string;
}

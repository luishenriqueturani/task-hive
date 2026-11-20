import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AccountKind } from 'src/users/account-kind.enum';
import { UserRole } from 'src/users/user-role.enum';

function emptyToUndef({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}

export class AdminUsersQueryDto {
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
  @IsEnum(AccountKind)
  accountKind?: AccountKind;

  @Transform(emptyToUndef)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  planSlug?: string;

  @Transform(emptyToUndef)
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

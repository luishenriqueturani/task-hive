import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { RecurringTypes } from "src/repository/postgresql.enums";

export class CreateToDoDto {

  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  id: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  description: string;

  @IsBoolean()
  @IsOptional()
  isRecurring: boolean;

  @IsOptional()
  @IsNumber()
  recurringTimes: number;

  @IsOptional()
  @IsDateString()
  recurringDeadline: Date;

  @IsOptional()
  @IsEnum(RecurringTypes)
  recurringType: RecurringTypes;
}

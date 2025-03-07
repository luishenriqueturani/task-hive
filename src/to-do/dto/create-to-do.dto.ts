import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { RecurringTypes } from "src/repository/postgresql.enums";

export class CreateToDoDto {

  @ApiProperty()
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  id: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  description: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isRecurring: boolean;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  recurringTimes: number;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  recurringDeadline: Date;

  @ApiProperty()
  @IsOptional()
  @IsEnum(RecurringTypes)
  recurringType: RecurringTypes;
}

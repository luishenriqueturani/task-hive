import { Transform } from "class-transformer";
import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

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

  @IsUUID()
  typeId: string;
}

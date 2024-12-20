import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateToDoTypeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(1024)
  description: string;
}

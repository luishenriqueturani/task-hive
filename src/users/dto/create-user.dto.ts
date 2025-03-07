import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, IsStrongPassword, MaxLength } from "class-validator";
import { IsEqualsTo } from "src/decorators/IsEqualsTo.decorator";

export class CreateUserDto {

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @MaxLength(255)
  password: string;

  @ApiProperty()
  @IsEqualsTo('password')
  confirmPassword: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  avatar: string;
}

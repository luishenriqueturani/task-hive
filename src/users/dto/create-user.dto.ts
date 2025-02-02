import { IsEmail, IsOptional, IsString, IsStrongPassword, MaxLength } from "class-validator";
import { IsEqualsTo } from "src/decorators/IsEqualsTo.decorator";

export class CreateUserDto {

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @MaxLength(255)
  password: string;

  @IsEqualsTo('password')
  confirmPassword: string;

  @IsString()
  @IsOptional()
  avatar: string;
}

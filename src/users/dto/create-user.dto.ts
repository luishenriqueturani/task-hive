import { IsEmail, IsOptional, IsString, IsStrongPassword } from "class-validator";
import { IsEqualsTo } from "src/decorators/IsEqualsTo.decorator";

export class CreateUserDto {

  @IsString()
  @IsOptional()
  name: string;

  @IsEmail()
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsEqualsTo('password')
  confirmPassword: string;

  @IsString()
  @IsOptional()
  avatar: string;
}

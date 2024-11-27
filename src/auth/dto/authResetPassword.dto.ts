import { IsJWT, IsStrongPassword } from "class-validator";
import { IsEqualsTo } from "src/decorators/IsEqualsTo.decorator";


export class AuthResetPasswordDto {
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

  @IsJWT()
  token: string;
}

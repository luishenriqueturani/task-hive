import { IsJWT } from "class-validator";


export class AuthCheckTokenDto {
  @IsJWT()
  token: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsJWT } from "class-validator";


export class AuthCheckTokenDto {
  @ApiProperty()
  @IsJWT()
  token: string;
}
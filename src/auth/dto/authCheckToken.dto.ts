import { ApiProperty } from "@nestjs/swagger";
import { IsJWT } from "class-validator";


export class AuthCheckTokenDto {
  @ApiProperty({
    description: 'Token JWT recebido por email no fluxo de esqueci a senha',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InV1aWQiLCJuYW1lIjoiSm9hbyIsImVtYWlsIjoidXN1YXJpb0BlbWFpbC5jb20iLCJyb2xlIjoiQ0xJRU5UIiwic3ViIjoidXVpZCIsImlzc3VlciI6IlRhc2tIaXZlIiwiYXVkaWVuY2UiOiJGT1JHRVRfUEFTU1dPUkQiLCJpYXQiOjE3MDk4MDAwMDAsImV4cCI6MTcwOTg4NjQwMH0.xxx',
  })
  @IsJWT()
  token: string;
}
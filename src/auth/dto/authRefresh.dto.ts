import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AuthRefreshDto {
  @ApiProperty({ example: 'th_rf_abc123...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  refreshToken: string;
}

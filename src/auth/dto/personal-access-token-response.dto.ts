import { ApiProperty } from '@nestjs/swagger';

export class PersonalAccessTokenResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Prefixo visível do token (ex.: th_pat_ab12…)' })
  tokenPrefix: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty({ nullable: true })
  lastUsedAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class PersonalAccessTokenCreatedDto extends PersonalAccessTokenResponseDto {
  @ApiProperty({
    description: 'Token completo — mostrado apenas uma vez na criação',
  })
  token: string;
}

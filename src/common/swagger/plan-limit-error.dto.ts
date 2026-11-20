import { ApiProperty } from '@nestjs/swagger';

/** Corpo 402 quando uma quota do plano é atingida. */
export class PlanLimitErrorDto {
  @ApiProperty({
    enum: [
      'PLAN_LIMIT_PROJECTS',
      'PLAN_LIMIT_API_KEYS',
      'PLAN_LIMIT_TODOS',
      'PLAN_LIMIT_GUESTS',
    ],
    example: 'PLAN_LIMIT_PROJECTS',
  })
  code:
    | 'PLAN_LIMIT_PROJECTS'
    | 'PLAN_LIMIT_API_KEYS'
    | 'PLAN_LIMIT_TODOS'
    | 'PLAN_LIMIT_GUESTS';

  @ApiProperty({ example: 'Limite de projetos do plano atingido.' })
  message: string;

  @ApiProperty({ example: 3, description: 'Tecto do plano; -1 = ilimitado' })
  limit: number;

  @ApiProperty({ example: 3 })
  used: number;
}

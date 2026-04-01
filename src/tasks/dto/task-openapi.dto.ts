import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskIdRefOpenApiDto {
  @ApiProperty({ example: '1112223334455667778' })
  id: string;
}

export class UserIdRefOpenApiDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
}

export class UserIdNameRefOpenApiDto extends UserIdRefOpenApiDto {
  @ApiProperty({ example: 'João Silva' })
  name: string;
}

export class ProjectStageSummaryOpenApiDto {
  @ApiProperty({ example: '9876543210987654321' })
  id: string;

  @ApiProperty({ example: 'To Do' })
  name: string;

  @ApiPropertyOptional({ example: 0 })
  order?: number;
}

export class TaskOpenApiDto {
  @ApiProperty({ example: '1112223334455667778' })
  id: string;

  @ApiProperty({ example: 'Implementar login' })
  name: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  description?: string | null;

  @ApiPropertyOptional({ nullable: true, example: null })
  finishDate?: string | null;

  @ApiPropertyOptional({ type: () => ProjectStageSummaryOpenApiDto })
  stage?: ProjectStageSummaryOpenApiDto;

  @ApiPropertyOptional({ type: () => UserIdRefOpenApiDto })
  user?: UserIdRefOpenApiDto;

  @ApiPropertyOptional({ example: '2025-02-09T12:00:00.000Z' })
  createdAt?: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  updatedAt?: string | null;

  @ApiPropertyOptional({ nullable: true, example: null })
  deletedAt?: string | null;
}

export class TimetrackListItemOpenApiDto {
  @ApiProperty({ example: '1234567890123456789' })
  id: string;

  @ApiProperty({ example: '2025-02-09T10:00:00.000Z' })
  start: string;

  @ApiPropertyOptional({ nullable: true, example: '2025-02-09T12:00:00.000Z' })
  end?: string | null;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: 'João Silva' })
  userName: string;
}

export class TimetrackDetailOpenApiDto {
  @ApiProperty({ example: '1234567890123456789' })
  id: string;

  @ApiProperty({ type: () => TaskIdRefOpenApiDto })
  task: TaskIdRefOpenApiDto;

  @ApiProperty({ type: () => UserIdNameRefOpenApiDto })
  user: UserIdNameRefOpenApiDto;

  @ApiProperty({ example: '2025-02-09T10:00:00.000Z' })
  start: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  end?: string | null;
}

export class DeletedFlagOpenApiDto {
  @ApiProperty({ example: true })
  deleted: boolean;
}

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';

/** Repositório TypeORM mínimo para compilar serviços nos testes unitários */
export function createMockRepository(): Record<string, jest.Mock> {
  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => qb),
  };
}

export function mockRepositoryProvider(token: string) {
  return { provide: token, useValue: createMockRepository() };
}

export const mockSnowflakeIdServiceProvider = {
  provide: SnowflakeIdService,
  useValue: { generateId: jest.fn(() => '1') },
};

export const mockJwtServiceProvider = {
  provide: JwtService,
  useValue: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
};

export const mockConfigServiceProvider = {
  provide: ConfigService,
  useValue: {
    get: jest.fn(),
  },
};

export const mockTaskRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.TASK_REPOSITORY,
);
export const mockTaskCompletionRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.TASK_COMPLETION_REPOSITORY,
);
export const mockUserRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.USER_REPOSITORY,
);
export const mockDataSourceProvider = {
  provide: PostgreSQLTokens.DATA_SOURCE,
  useValue: {
    transaction: jest.fn(),
    getRepository: jest.fn(),
  },
};
export const mockForgetPasswordRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.FORGET_PASSWORD,
);
export const mockSessionRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.SESSION_REPOSITORY,
);
export const mockRefreshTokenRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.REFRESH_TOKEN_REPOSITORY,
);
export const mockPersonalAccessTokenRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.PERSONAL_ACCESS_TOKEN_REPOSITORY,
);
export const mockCompanyRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.COMPANY_REPOSITORY,
);
export const mockProjectRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.PROJECT_REPOSITORY,
);
export const mockProjectStageRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.PROJECT_STAGE_REPOSITORY,
);
export const mockTodoRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.TODO_REPOSITORY,
);
export const mockSubtaskRepositoryProvider = mockRepositoryProvider(
  PostgreSQLTokens.SUBTASK_REPOSITORY,
);

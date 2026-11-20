import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';
import {
  mockCompanyRepositoryProvider,
  mockUserRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { AdminStatsService } from './admin-stats.service';

describe('AdminStatsService', () => {
  let service: AdminStatsService;
  let users: { count: jest.Mock };
  let companies: { count: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        AdminStatsService,
        mockUserRepositoryProvider,
        mockCompanyRepositoryProvider,
      ],
    }).compile();

    service = module.get(AdminStatsService);
    users = module.get(PostgreSQLTokens.USER_REPOSITORY);
    companies = module.get(PostgreSQLTokens.COMPANY_REPOSITORY);
  });

  it('devolve contagens e tickets a 0', async () => {
    users.count.mockResolvedValue(12);
    companies.count.mockResolvedValue(3);
    await expect(service.snapshot()).resolves.toEqual({
      users: 12,
      companies: 3,
      openTickets: 0,
    });
  });
});

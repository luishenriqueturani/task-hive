import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';
import {
  mockCompanyRepositoryProvider,
  mockSupportTicketRepositoryProvider,
  mockUserRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { AdminStatsService } from './admin-stats.service';

describe('AdminStatsService', () => {
  let service: AdminStatsService;
  let users: { count: jest.Mock };
  let companies: { count: jest.Mock };
  let tickets: { count: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        AdminStatsService,
        mockUserRepositoryProvider,
        mockCompanyRepositoryProvider,
        mockSupportTicketRepositoryProvider,
      ],
    }).compile();

    service = module.get(AdminStatsService);
    users = module.get(PostgreSQLTokens.USER_REPOSITORY);
    companies = module.get(PostgreSQLTokens.COMPANY_REPOSITORY);
    tickets = module.get(PostgreSQLTokens.SUPPORT_TICKET_REPOSITORY);
  });

  it('devolve contagens incluindo tickets abertos', async () => {
    users.count.mockResolvedValue(12);
    companies.count.mockResolvedValue(3);
    tickets.count.mockResolvedValue(2);
    await expect(service.snapshot()).resolves.toEqual({
      users: 12,
      companies: 3,
      openTickets: 2,
    });
  });
});

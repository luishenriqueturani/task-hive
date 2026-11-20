import { Inject, Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Company } from 'src/companies/entities/Company.entity';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import {
  OPEN_SUPPORT_TICKET_STATUSES,
} from 'src/support/support.enums';
import { SupportTicket } from 'src/support/entities/SupportTicket.entity';
import { User } from 'src/users/entities/User.entity';

@Injectable()
export class AdminStatsService {
  constructor(
    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private readonly users: Repository<User>,
    @Inject(PostgreSQLTokens.COMPANY_REPOSITORY)
    private readonly companies: Repository<Company>,
    @Inject(PostgreSQLTokens.SUPPORT_TICKET_REPOSITORY)
    private readonly tickets: Repository<SupportTicket>,
    private readonly metrics: AppMetricsService,
  ) {}

  snapshot() {
    return this.metrics.track('admin', 'stats', async () => {
      const [users, companies, openTickets] = await Promise.all([
        this.users.count(),
        this.companies.count(),
        this.tickets.count({
          where: { status: In([...OPEN_SUPPORT_TICKET_STATUSES]) },
        }),
      ]);
      return {
        users,
        companies,
        openTickets,
      };
    });
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/Company.entity';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { User } from 'src/users/entities/User.entity';

@Injectable()
export class AdminStatsService {
  constructor(
    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private readonly users: Repository<User>,
    @Inject(PostgreSQLTokens.COMPANY_REPOSITORY)
    private readonly companies: Repository<Company>,
    private readonly metrics: AppMetricsService,
  ) {}

  snapshot() {
    return this.metrics.track('admin', 'stats', async () => {
      const [users, companies] = await Promise.all([
        this.users.count(),
        this.companies.count(),
      ]);
      return {
        users,
        companies,
        /** Sem módulo de suporte nesta onda. */
        openTickets: 0,
      };
    });
  }
}

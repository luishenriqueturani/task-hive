import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DatabaseModule } from 'src/repository/database.module';
import { companyProvider } from 'src/repository/providers/company.provider';
import { planProviders } from 'src/repository/providers/plan.provider';
import { projectProviders } from 'src/repository/providers/project.provider';
import { todoProviders } from 'src/repository/providers/todo.provider';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { SupportModule } from 'src/support/support.module';
import { AdminCompaniesController } from './admin-companies.controller';
import { AdminCompaniesService } from './admin-companies.service';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [DatabaseModule, AuthModule, SubscriptionsModule, SupportModule],
  controllers: [
    AdminStatsController,
    AdminUsersController,
    AdminCompaniesController,
  ],
  providers: [
    ...companyProvider,
    ...planProviders,
    ...projectProviders,
    ...todoProviders,
    AdminStatsService,
    AdminUsersService,
    AdminCompaniesService,
  ],
})
export class AdminModule {}
